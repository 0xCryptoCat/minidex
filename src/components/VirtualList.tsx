import { useRef, useState, useEffect } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number; // fixed height per item in px
  render: (item: T, index: number) => React.ReactNode;
}

export default function VirtualList<T>({ items, itemHeight, render }: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const element = el; // non-null reference
    function onScroll() {
      setScrollTop(element.scrollTop);
    }
    function onResize() {
      setHeight(element.clientHeight);
    }
    onResize();
    element.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize);
    return () => {
      element.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight));
  const endIndex = Math.min(items.length, Math.ceil((scrollTop + height) / itemHeight));
  const paddingTop = startIndex * itemHeight;
  const paddingBottom = (items.length - endIndex) * itemHeight;
  const visible = items.slice(startIndex, endIndex);

  return (
    <div ref={containerRef} style={{ overflowY: 'auto', height: '100%' }}>
      <div style={{ paddingTop, paddingBottom }}>
        {visible.map((item, i) => render(item, startIndex + i))}
      </div>
    </div>
  );
}
