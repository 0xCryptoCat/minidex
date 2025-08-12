import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import type { ListItem as Item, Window, ListsResponse, Provider } from '../../lib/types';
import ListItem from './ListItem';
import VirtualList from '../../components/VirtualList';
import { createPoller } from '../../lib/polling';

const windows: Window[] = ['1h', '1d', '1w'];

export default function ListsPage() {
  const { chain, type } = useParams<{ chain: string; type: string }>();
  const [windowSel, setWindowSel] = useState<Window>('1h');
  const [items, setItems] = useState<Item[]>([]);
  const [provider, setProvider] = useState<Provider | undefined>();
  const [sortKey, setSortKey] = useState<keyof Item | 'rank'>('rank');
  const [sortAsc, setSortAsc] = useState(false);

  const fetchLists = useCallback(async () => {
    if (!chain || !type) return;
    const url = new URL('/.netlify/functions/lists', window.location.origin);
    url.searchParams.set('chain', chain);
    url.searchParams.set('type', type);
    url.searchParams.set('window', windowSel);
    const res = await fetch(url.toString());
    if (!res.ok) {
      setItems([]);
      return;
    }
    const data = (await res.json()) as ListsResponse;
    setItems(data.items);
    setProvider(data.provider);
  }, [chain, type, windowSel]);

  useEffect(() => {
    fetchLists();
    const poller = createPoller(fetchLists, 60000);
    poller.start();
    return () => poller.stop();
  }, [fetchLists]);

  function handleSort(key: keyof Item | 'rank') {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  const sorted = useMemo(() => {
    const indexed = items.map((it, idx) => ({ it, idx }));
    indexed.sort((a, b) => {
      if (sortKey === 'rank') return a.idx - b.idx; // original order
      const av = (a.it as any)[sortKey];
      const bv = (b.it as any)[sortKey];
      if (av === undefined && bv === undefined) return a.idx - b.idx;
      if (av === undefined) return 1;
      if (bv === undefined) return -1;
      if (av < bv) return -1;
      if (av > bv) return 1;
      return a.idx - b.idx;
    });
    if (!sortAsc) indexed.reverse();
    return indexed.map((x) => x.it);
  }, [items, sortKey, sortAsc]);

  return (
    <div style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <strong style={{ textTransform: 'capitalize' }}>{type}</strong>
        <select value={windowSel} onChange={(e) => setWindowSel(e.target.value as Window)}>
          {windows.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </div>
      <div style={{ flex: 1, border: '1px solid #ccc', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 80px 80px 80px 80px 80px 60px',
            gap: '0.5rem',
            padding: '0.5rem',
            fontWeight: 'bold',
            position: 'sticky',
            top: 0,
            background: '#fff',
            zIndex: 1,
          }}
        >
          <div style={{ cursor: 'pointer' }} onClick={() => handleSort('rank')}>
            # {sortKey === 'rank' ? (sortAsc ? '▲' : '▼') : ''}
          </div>
          <div>Token</div>
          <div style={{ cursor: 'pointer' }} onClick={() => handleSort('priceUsd')}>
            Price {sortKey === 'priceUsd' ? (sortAsc ? '▲' : '▼') : ''}
          </div>
          <div style={{ cursor: 'pointer' }} onClick={() => handleSort('liqUsd')}>
            Liq {sortKey === 'liqUsd' ? (sortAsc ? '▲' : '▼') : ''}
          </div>
          <div style={{ cursor: 'pointer' }} onClick={() => handleSort('volWindowUsd')}>
            Vol {sortKey === 'volWindowUsd' ? (sortAsc ? '▲' : '▼') : ''}
          </div>
          <div style={{ cursor: 'pointer' }} onClick={() => handleSort('priceChangePct')}>
            % {sortKey === 'priceChangePct' ? (sortAsc ? '▲' : '▼') : ''}
          </div>
          <div style={{ cursor: 'pointer' }} onClick={() => handleSort('score')}>
            Score {sortKey === 'score' ? (sortAsc ? '▲' : '▼') : ''}
          </div>
          <div></div>
        </div>
        <div style={{ flex: 1 }}>
          <VirtualList
            items={sorted}
            itemHeight={56}
            render={(item, idx) => (
              <ListItem key={item.pairId} item={item} rank={idx + 1} provider={provider || 'gt'} />
            )}
          />
        </div>
      </div>
    </div>
  );
}
