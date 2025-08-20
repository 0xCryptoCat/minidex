import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import type { PoolSummary, TokenMeta, TokenResponse, Provider } from '../../lib/types';
import { pairs, token as fetchToken } from '../../lib/api';
import { poolDataManager } from '../../lib/pool-manager';
import { useGoSecurity } from '../../lib/useGoSecurity';
import PoolSwitcher from './PoolSwitcher';
import ChartOnlyView from './ChartOnlyView';
import DetailView from './DetailView';
import DetailTop from './DetailTop';
import TradesOnlyView from '../trades/TradesOnlyView';
import copy from '../../copy/en.json';
import { useProvider } from '../../lib/provider';
import { resolvePairSymbols } from '../../lib/pairs';

// Views for chart page
type View = 'chart' | 'trades' | 'detail';

export default function ChartPage() {
  const { chain, address, pairId } = useParams<{ chain: string; address: string; pairId?: string }>();
  const navigate = useNavigate();
  const [token, setToken] = useState<TokenMeta | null>(null);
  const [tokenDetail, setTokenDetail] = useState<TokenResponse | null>(null);
  const [pools, setPools] = useState<PoolSummary[]>([]);
  const [currentPool, setCurrentPool] = useState<PoolSummary | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const view = (searchParams.get('view') as View) || 'detail';
  const [xDomain, setXDomain] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noData, setNoData] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const { setProvider: setGlobalProvider } = useProvider();

  // Fetch security data for market cap calculations and general security info
  const { loading: securityLoading, error: securityError, data: securityData } = useGoSecurity(
    chain || '', 
    address || ''
  );

  useEffect(() => {
    if (!searchParams.get('view')) {
      const params = new URLSearchParams(searchParams);
      params.set('view', 'detail');
      setSearchParams(params, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!chain || !address) {
      setNoData(true);
      return;
    }
    let cancelled = false;
    setUnsupported(false);
    setLoading(true);
    setDetailLoading(true);
    setError(null);
    setProvider(null);
    setGlobalProvider('');

    // Fetch pairs data
    pairs(chain, address)
      .then(({ data }) => {
        if (cancelled) return;
        if ('error' in data) {
          if (data.error === 'unsupported_network') {
            setUnsupported(true);
          } else {
            setError(data.error);
          }
          setNoData(true);
          return;
        }
        setToken(data.token);
        setProvider(data.provider);
        setGlobalProvider(data.provider);
        const sorted = data.pools.slice().sort((a, b) => {
          const sup = Number(!!b.gtSupported) - Number(!!a.gtSupported);
          if (sup !== 0) return sup;
          return (b.liqUsd || 0) - (a.liqUsd || 0);
        });
        setPools(sorted);
        
        // Cache each pool individually
        poolDataManager.cachePools(sorted);
        
        const sel = sorted.find((p) => p.pairId === pairId) || sorted[0];
        setCurrentPool(sel || null);
        setNoData(!sel || !sel.poolAddress);
      })
      .catch(() => {
        if (!cancelled) {
          setError('network');
          setNoData(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Fetch token detail data
    fetchToken(chain, address)
      .then(({ data }) => {
        if (cancelled) return;
        if (!('error' in data)) {
          setTokenDetail(data);
        }
      })
      .catch(() => {
        // Token detail is optional, so we don't handle errors
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [chain, address]);

  function handlePoolSwitch(p: PoolSummary) {
    const scroll = window.scrollY;
    
    // Update the pool data in the manager (in case there are any updates)
    poolDataManager.updatePool(p);
    
    setCurrentPool(p);
    setXDomain((d) => d);
    if (address) {
      navigate(`/t/${p.chain}/${address}/${p.pairId}`, { replace: true });
    }
    setNoData(!p.poolAddress);
    requestAnimationFrame(() => window.scrollTo(0, scroll));
  }

  const tradeSymbols =
    currentPool && token ? resolvePairSymbols(token.symbol, currentPool) : null;

  return (
    <div className="chart-page">
      {loading && <div className="loading-state">{copy.loading}</div>}

      {unsupported && (
        <div className="error-state">Network not supported (yet)</div>
      )}

      {!loading && error && (
        <div className="error-state">
          {error === 'rate_limit' ? copy.error_rate_limit : copy.error_generic}
        </div>
      )}

      {!loading && !error && pools.length === 0 && (
        <div className="no-data-state">{copy.no_pools}</div>
      )}

      {!loading && !error && pools.length > 0 && (
        <div className="chart-content">
          {/* Show DetailTop for all views if we have token detail */}
          {tokenDetail && currentPool && !detailLoading && (
            <DetailTop
              detail={tokenDetail}
              pairId={currentPool.pairId}
              pools={pools}
              chain={chain!}
              onPoolSwitch={handlePoolSwitch}
            />
          )}

          {/* Show loading skeleton if detail is still loading */}
          {detailLoading && (
            <div className="detail-top-skeleton">
              <div className="loading-skeleton" style={{ height: 200, marginBottom: '1rem' }} />
              <div className="loading-skeleton" style={{ height: 100 }} />
            </div>
          )}

          {/* View-specific content */}
          {view === 'chart' && currentPool && currentPool.poolAddress && provider && address && (
            <div className="chart-view-content">
              <div className="chart-container">
                <ChartOnlyView
                  pairId={currentPool.pairId}
                  chain={currentPool.chain}
                  poolAddress={currentPool.poolAddress}
                  provider={provider}
                  xDomain={xDomain}
                  onXDomainChange={setXDomain}
                  tokenAddress={address}
                  tokenDetail={tokenDetail}
                  securityData={securityData}
                />
              </div>
            </div>
          )}

          {view === 'trades' && currentPool && currentPool.poolAddress && address && (
            <div className="trades-view-content">
              <TradesOnlyView
                pairId={currentPool.pairId}
                chain={currentPool.chain}
                poolAddress={currentPool.poolAddress}
                tokenAddress={address}
                baseSymbol={tradeSymbols?.baseSymbol || currentPool.base}
                quoteSymbol={tradeSymbols?.quoteSymbol || currentPool.quote}
              />
            </div>
          )}

          {view === 'detail' && currentPool && address && (
            <div className="detail-view-content">
              <DetailView
                chain={currentPool.chain}
                address={address}
                pairId={currentPool.pairId}
                pools={pools}
                onSwitch={handlePoolSwitch}
                hideDetailTop={true} // Don't show DetailTop again in DetailView
              />
            </div>
          )}
        </div>
      )}

      {noData && (
        <div className="no-data-state">No data available for this token</div>
      )}
    </div>
  );
}

