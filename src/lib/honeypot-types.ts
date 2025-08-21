// HoneyPot.is API Types
export interface HoneypotResponse {
  token: {
    name: string;
    symbol: string;
    decimals: number;
    address: string;
    totalHolders: number;
  };
  withToken: {
    name: string;
    symbol: string;
    decimals: number;
    address: string;
    totalHolders: number;
  };
  summary: {
    risk: 'unknown' | 'very_low' | 'low' | 'medium' | 'high' | 'very_high' | 'honeypot';
    riskLevel?: number; // 0-100, not present for "unknown"
    flags?: HoneypotFlag[];
  };
  simulationSuccess: boolean;
  simulationError?: string;
  honeypotResult?: {
    isHoneypot: boolean;
    honeypotReason?: string;
  };
  simulationResult?: {
    maxBuy?: {
      token: number;
      tokenWei: string;
      withToken: number;
      withTokenWei: string;
    };
    maxSell?: {
      token: number;
      tokenWei: string;
      withToken: number;
      withTokenWei: string;
    };
    buyTax: number;
    sellTax: number;
    transferTax: number;
    buyGas: string;
    sellGas: string;
  };
  // We'll exclude holderAnalysis per requirements
  flags?: string[]; // Legacy flags
  contractCode?: {
    openSource: boolean;
    rootOpenSource: boolean;
    isProxy: boolean;
    hasProxyCalls: boolean;
  };
  chain: {
    id: string;
    name: string;
    shortName: string;
    currency: string;
  };
  // We'll exclude everything after chain field per requirements
}

export interface HoneypotFlag {
  flag: string;
  description: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  severityIndex: number; // 4, 8, 12, 16, 20
}

// Processed data structure that integrates with our existing system
export interface ProcessedHoneypotData {
  available: boolean;
  risk: {
    level: 'unknown' | 'very_low' | 'low' | 'medium' | 'high' | 'very_high' | 'honeypot';
    score?: number; // 0-100
    description: string;
  };
  isHoneypot: boolean;
  honeypotReason?: string;
  taxes: {
    buy: number;
    sell: number;
    transfer: number;
  };
  limits?: {
    maxBuy: {
      tokens: number;
      percentage: number; // calculated from totalSupply
      formattedValue: string;
    };
    maxSell: {
      tokens: number;
      percentage: number; // calculated from totalSupply
      formattedValue: string;
    };
  };
  contractInfo: {
    openSource: boolean;
    isProxy: boolean;
  };
  flags: Array<{
    severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
    message: string;
  }>;
  totalHolders?: number; // Can be used as fallback if GoPlus data unavailable
}

// API wrapper response
export interface HoneypotAPIResponse {
  success: boolean;
  data?: HoneypotResponse;
  error?: string;
  chain: string;
  address: string;
}
