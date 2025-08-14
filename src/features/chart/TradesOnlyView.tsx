import { useEffect, useState } from 'react';
import type { Trade } from '../../lib/types';
import { trades } from '../../lib/api';

interface Props {
  pairId: string;
  chain: string;
  poolAddress?: string;
  address: string;
}

export default function TradesOnlyView({ pairId, chain, poolAddress, address }: Props) {
  const [rows, setRows] = useState<Trade[]>([]);
  const [noTrades, setNoTrades] = useState(false);

  useEffect(() => {
    let cancelled = false;
    trades({ pairId, chain, poolAddress, address })
      .then((data) => {
        if (cancelled) return;
        setRows(data.trades || []);
        setNoTrades(!data.trades || data.trades.length === 0);
      })
      .catch(() => {
        if (!cancelled) setNoTrades(true);
      });
    return () => {
        cancelled = true;
    };
  }, [pairId, chain, poolAddress]);

  return (
    <div>
      {rows.length > 0 && <div>{rows.length} trades</div>}
      {rows.length === 0 && noTrades && <div>No recent trades</div>}
      {rows.length > 0 && (
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Time</th>
              <th>Side</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.txHash || t.ts}>
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
