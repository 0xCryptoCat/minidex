import { useEffect, useState, useRef } from 'react';
import type { Trade } from '../../lib/types';
import { trades } from '../../lib/api';
import { formatFetchMeta, type FetchMeta } from '../../lib/format';

interface Props {
  pairId: string;
  chain: string;
  poolAddress: string;
}

export default function TradesOnlyView({ pairId, chain, poolAddress }: Props) {
  const [rows, setRows] = useState<Trade[]>([]);
  const [noTrades, setNoTrades] = useState(false);
  const [meta, setMeta] = useState<FetchMeta | null>(null);
  const loggedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    trades({ pairId, chain, poolAddress })
      .then((data) => {
        if (cancelled) return;
        setRows(data.trades || []);
        setNoTrades(!data.trades || data.trades.length === 0);
        setMeta((data as any)._meta);
      })
      .catch(() => {
        if (!cancelled) setNoTrades(true);
      });
    return () => {
        cancelled = true;
    };
  }, [pairId, chain, poolAddress]);

  useEffect(() => {
    if (noTrades && meta && !loggedRef.current && (import.meta as any).env?.DEV) {
      console.log('no-trades meta', meta);
      loggedRef.current = true;
    }
  }, [noTrades, meta]);

  return (
    <div>
      {rows.length > 0 && <div>{rows.length} trades</div>}
      {rows.length === 0 && noTrades && (
        <div>
          <div>No recent trades</div>
          {meta && formatFetchMeta(meta) && (
            <div style={{ fontSize: '0.75rem' }}>{formatFetchMeta(meta)}</div>
          )}
        </div>
      )}
      {rows.length > 0 && (
        <table className="search-results-table">
          <thead>
            <tr style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              <th>Time</th>
              <th>Side</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr
                key={t.txHash || t.ts}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  minHeight: 40,
                }}
              >
                <td>{new Date(t.ts * 1000).toLocaleTimeString()}</td>
                <td>{t.side}</td>
                <td>${t.price.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
