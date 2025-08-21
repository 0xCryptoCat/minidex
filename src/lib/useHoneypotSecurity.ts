import { useState, useEffect, useMemo } from 'react';
import type { HoneypotAPIResponse, HoneypotResponse, ProcessedHoneypotData } from './honeypot-types';

// Local helper function to format balance
function formatBalance(balance: string, decimals?: number): string {
  try {
    const num = parseFloat(balance);
    if (isNaN(num)) return balance;
    
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    
    return num.toFixed(decimals || 2);
  } catch {
    return balance;
  }
}

// Supported chains for HoneyPot.is (per documentation)
const SUPPORTED_CHAINS = {
  '1': 'ethereum',
  '56': 'bsc', 
  '8453': 'base',
  'ethereum': '1',
  'bsc': '56',
  'base': '8453'
};

export function useHoneypotSecurity(chain: string, address: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HoneypotAPIResponse | null>(null);

  const apiUrl = useMemo(() => {
    if (!chain || !address) return null;
    
    // Check if chain is supported
    const chainLower = chain.toLowerCase();
    const chainId = SUPPORTED_CHAINS[chainLower as keyof typeof SUPPORTED_CHAINS] || 
                   SUPPORTED_CHAINS[chain as keyof typeof SUPPORTED_CHAINS];
    
    if (!chainId) return null; // Chain not supported by HoneyPot.is
    
    const baseUrl = '/.netlify/functions/honeypot';
    const params = new URLSearchParams({ chain: chainId, address });
    return `${baseUrl}?${params}`;
  }, [chain, address]);

  useEffect(() => {
    if (!apiUrl) {
      // Chain not supported, set unavailable state
      setData({
        success: false,
        error: 'Chain not supported by HoneyPot.is',
        chain,
        address
      });
      setLoading(false);
      setError(null);
      return;
    }

    let abortController = new AbortController();
    
    const fetchHoneypot = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(apiUrl, {
          signal: abortController.signal,
          credentials: 'omit',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result: HoneypotAPIResponse = await response.json();
        
        if (!abortController.signal.aborted) {
          setData(result);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch honeypot data');
          setData({
            success: false,
            error: err instanceof Error ? err.message : 'Failed to fetch honeypot data',
            chain,
            address
          });
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchHoneypot();

    return () => {
      abortController.abort();
    };
  }, [apiUrl, chain, address]);

  const processedData = useMemo(() => {
    if (!data) return null;
    
    if (!data.success || !data.data) {
      // Return unavailable state
      return {
        available: false,
        risk: {
          level: 'unknown' as const,
          description: 'Unavailable'
        },
        isHoneypot: false,
        taxes: { buy: 0, sell: 0, transfer: 0 },
        contractInfo: { openSource: true, isProxy: false },
        flags: []
      } as ProcessedHoneypotData;
    }
    
    return processHoneypotData(data.data);
  }, [data]);

  return {
    loading,
    error,
    data: processedData,
    raw: data,
    supported: !!apiUrl
  };
}

function processHoneypotData(honeypotData: HoneypotResponse): ProcessedHoneypotData {
  const { summary, honeypotResult, simulationResult, contractCode, token } = honeypotData;
  
  // Process risk level
  const getRiskDescription = (risk: string, riskLevel?: number) => {
    switch (risk) {
      case 'very_low': return 'Very Low Risk';
      case 'low': return 'Low Risk';
      case 'medium': return 'Medium Risk';
      case 'high': return 'High Risk';
      case 'very_high': return 'Very High Risk';
      case 'honeypot': return 'Honeypot Detected';
      case 'unknown':
      default: return 'Unknown Risk';
    }
  };

  // Process flags from summary.flags (preferred) or legacy flags
  const processedFlags = (summary.flags || []).map(flag => ({
    severity: flag.severity,
    message: flag.description
  }));

  // Calculate percentage limits if available
  let limits: ProcessedHoneypotData['limits'] = undefined;
  if (simulationResult?.maxBuy || simulationResult?.maxSell) {
    // For percentage calculation, we'll use the formatted token amounts
    // Since we don't have totalSupply from HoneyPot.is API, we'll show the raw amounts
    // and mark percentage as unavailable
    
    const processedLimits: NonNullable<ProcessedHoneypotData['limits']> = {} as any;
    
    if (simulationResult.maxBuy) {
      processedLimits.maxBuy = {
        tokens: simulationResult.maxBuy.token,
        percentage: 0, // Will be calculated later if we have total supply from other sources
        formattedValue: formatBalance(simulationResult.maxBuy.token.toString())
      };
    }
    
    if (simulationResult.maxSell) {
      processedLimits.maxSell = {
        tokens: simulationResult.maxSell.token,
        percentage: 0, // Will be calculated later if we have total supply from other sources
        formattedValue: formatBalance(simulationResult.maxSell.token.toString())
      };
    }
    
    // Only set limits if we have at least one of them
    if (processedLimits.maxBuy || processedLimits.maxSell) {
      limits = processedLimits;
    }
  }

  return {
    available: true,
    risk: {
      level: summary.risk,
      score: summary.riskLevel,
      description: getRiskDescription(summary.risk, summary.riskLevel)
    },
    isHoneypot: honeypotResult?.isHoneypot || false,
    honeypotReason: honeypotResult?.honeypotReason,
    taxes: {
      buy: simulationResult?.buyTax || 0,
      sell: simulationResult?.sellTax || 0,
      transfer: simulationResult?.transferTax || 0
    },
    limits,
    contractInfo: {
      openSource: contractCode?.openSource || false,
      isProxy: contractCode?.isProxy || false
    },
    flags: processedFlags,
    totalHolders: token.totalHolders
  };
}
