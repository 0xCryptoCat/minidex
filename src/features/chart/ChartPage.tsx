import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import type { PoolSummary, TokenMeta, Provider } from '../../lib/types';
import { pairs } from '../../lib/api';
import PoolSwitcher from './PoolSwitcher';
import ChartOnlyView from './ChartOnlyView';
import DetailView from './DetailView';
import TradesOnlyView from '../trades/TradesOnlyView';
import copy from '../../copy/en.json';
import { useProvider } from '../../lib/provider';

// Views for chart page
type View = 'chart' | 'trades' | 'detail';

export default function ChartPage() {
  const { chain, address, pairId } = useParams<{ chain: string; address: string; pairId?: string }>();
  const navigate = useNavigate();
  const [token, setToken] = useState<TokenMeta | null>(null);
  const [pools, setPools] = useState<PoolSummary[]>([]);
  const [currentPool, setCurrentPool] = useState<PoolSummary | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const view = (searchParams.get('view') as View) || 'detail';
  const [xDomain, setXDomain] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noData, setNoData] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const { setProvider: setGlobalProvider } = useProvider();

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
    setError(null);
    setProvider(null);
    setGlobalProvider('');
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
    return () => {
      cancelled = true;
    };
  }, [chain, address]);

  function handlePoolSwitch(p: PoolSummary) {
    const scroll = window.scrollY;
    setCurrentPool(p);
    setXDomain((d) => d);
    if (address) {
      navigate(`/t/${p.chain}/${address}/${p.pairId}`, { replace: true });
    }
    setNoData(!p.poolAddress);
    requestAnimationFrame(() => window.scrollTo(0, scroll));
  }

  const tradeSymbols = currentPool && token
    ? token.symbol === currentPool.base
      ? { baseSymbol: currentPool.base, quoteSymbol: currentPool.quote }
      : { baseSymbol: currentPool.quote, quoteSymbol: currentPool.base }
    : null;

  return (
    <div style={{ padding: '1rem' }}>
      {token && (
        <div style={{ marginBottom: '1rem' }}>
          <strong>{token.symbol}</strong> {token.name}
        </div>
      )}

      {loading && <div>{copy.loading}</div>}

      {unsupported && (
        <div style={{ color: 'red' }}>Network not supported (yet)</div>
      )}

      {!loading && error && (
        <div style={{ color: 'red' }}>
          {error === 'rate_limit' ? copy.error_rate_limit : copy.error_generic}
        </div>
      )}

      {!loading && !error && pools.length === 0 && <div>{copy.no_pools}</div>}

      {!loading && !error && pools.length > 0 && (
        <>
          {view !== 'detail' && pools.length > 1 && pools.length <= 3 && (
            <PoolSwitcher
              pools={pools}
              current={currentPool?.pairId}
              onSwitch={handlePoolSwitch}
            />
          )}

          {(view === 'chart' || view === 'trades') && currentPool?.gtSupported === false && (
            <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Chart/Trades not available on this DEX; limited metrics shown.
            </div>
          )}

          {view === 'chart' && currentPool && currentPool.poolAddress && provider && address && (
            <div style={{ marginTop: '1rem' }}>
              <ChartOnlyView
                pairId={currentPool.pairId}
                chain={currentPool.chain}
                poolAddress={currentPool.poolAddress}
                provider={provider}
                xDomain={xDomain}
                onXDomainChange={setXDomain}
                tokenAddress={address}
              />
            </div>
          )}
          {view === 'trades' && currentPool && currentPool.poolAddress && address && (
            <TradesOnlyView
              pairId={currentPool.pairId}
              chain={currentPool.chain}
              poolAddress={currentPool.poolAddress}
              tokenAddress={address}
              baseSymbol={tradeSymbols?.baseSymbol || currentPool.base}
              quoteSymbol={tradeSymbols?.quoteSymbol || currentPool.quote}
            />
          )}
          {view === 'detail' && currentPool && address && (
            <DetailView
              chain={currentPool.chain}
              address={address}
              pairId={currentPool.pairId}
              pools={pools}
              onSwitch={handlePoolSwitch}
            />
          )}
        </>
      )}

      {noData && <div>No chart data available for this pool</div>}
    </div>
  );
}

