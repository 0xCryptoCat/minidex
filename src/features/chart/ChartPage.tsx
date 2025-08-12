import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { PoolSummary, TokenMeta } from '../../lib/types';
import { pairs } from '../../lib/api';
import PoolSwitcher from './PoolSwitcher';
import ChartOnlyView from './ChartOnlyView';
import copy from '../../copy/en.json';

// Views for chart page
const views = ['chart', 'depth', 'trades', 'detail'] as const;
type View = typeof views[number];

export default function ChartPage() {
  const { chain, address, pairId } = useParams<{ chain: string; address: string; pairId?: string }>();
  const navigate = useNavigate();
  const [token, setToken] = useState<TokenMeta | null>(null);
  const [pools, setPools] = useState<PoolSummary[]>([]);
  const [currentPair, setCurrentPair] = useState<string | undefined>(pairId);
  const [view, setView] = useState<View>('chart');
  const [xDomain, setXDomain] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chain || !address) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    pairs(chain, address)
      .then((data) => {
        if (cancelled) return;
        if ('error' in data) {
          setError(data.error);
          return;
        }
        setToken(data.token);
        setPools(data.pools);
        if (!currentPair && data.pools.length > 0) {
          setCurrentPair(data.pools[0].pairId);
        }
      })
      .catch(() => {
        if (!cancelled) setError('network');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [chain, address]);

  function handlePoolSwitch(id: string) {
    setCurrentPair(id);
    setXDomain((d) => d);
    if (chain && address) {
      navigate(`/t/${chain}/${address}/${id}`, { replace: true });
    }
  }

  return (
    <div style={{ padding: '1rem' }}>
      {token && (
        <div style={{ marginBottom: '1rem' }}>
          <strong>{token.symbol}</strong> {token.name}
        </div>
      )}
      {loading && <div>{copy.loading}</div>}
      {!loading && error && (
        <div style={{ color: 'red' }}>
          {error === 'rate_limit' ? copy.error_rate_limit : copy.error_generic}
        </div>
      )}
      {!loading && !error && pools.length === 0 && <div>{copy.no_pools}</div>}
      {!loading && !error && pools.length > 0 && (
        <>
          <div className="view-tabs" role="tablist" aria-label="Chart sections">
            {views.map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                tabIndex={view === v ? 0 : -1}
                onClick={() => setView(v)}
                className="view-tab"
              >
                {v}
              </button>
            ))}
          </div>
          {view !== 'detail' && (
            <PoolSwitcher pools={pools} current={currentPair} onSwitch={handlePoolSwitch} />
          )}
          {view === 'chart' && currentPair && chain && (
            <div style={{ marginTop: '1rem' }}>
              <ChartOnlyView
                pairId={currentPair}
                chain={chain}
                tf="1m"
                xDomain={xDomain}
                onXDomainChange={setXDomain}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

