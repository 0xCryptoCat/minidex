import { useState, useEffect, useRef, useMemo } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChartLoader from './ChartLoader';

interface Props {
  chain: string;
  address: string;
  twitterUrl?: string;
}

const TwitterFeedPanel: React.FC<Props> = ({ chain, address, twitterUrl }) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedError, setFeedError] = useState<null | 'comingSoon' | 'unavailable'>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Derive Twitter handle from the URL (e.g. "https://twitter.com/Project" -> "Project")
  const twitterHandle = useMemo(() => {
    if (!twitterUrl) return '';
    const match = twitterUrl.match(/(?:twitter\.com|x\.com)\/([^\/\?]+)/i);
    return match ? match[1] : '';
  }, [twitterUrl]);

  useEffect(() => {
    if (!expanded) return;
    // If chain is not Solana, no feed is available yet
    if (chain.toLowerCase() !== 'solana') {
      setFeedError('comingSoon');
      return;
    }
    // If no handle available for a Solana token, treat as unavailable
    if (!twitterHandle) {
      setFeedError('unavailable');
      return;
    }
    // Reset error and show loader while fetching tweets
    setFeedError(null);
    setLoading(true);

    // Helper to embed the Twitter timeline
    const embedTimeline = () => {
      const target = containerRef.current;
      if (!target) return;
      (window as any).twttr.widgets.createTimeline(
        { sourceType: 'profile', screenName: twitterHandle },
        target,
        { height: 300, theme: 'dark', chrome: 'transparent' }  // 300px tall, dark theme, no background borders
      ).then(() => {
        setLoading(false);
      }).catch(() => {
        setLoading(false);
        setFeedError('unavailable');
      });
    };

    // Ensure the Twitter widgets script is loaded, then create the timeline
    if (!(window as any).twttr?.widgets) {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.onload = () => {
        if ((window as any).twttr?.widgets) {
          embedTimeline();
        } else {
          setLoading(false);
          setFeedError('unavailable');
        }
      };
      document.body.appendChild(script);
    } else {
      // Script already loaded, directly embed
      embedTimeline();
    }
  }, [expanded, chain, twitterHandle]);

  return (
    <div className="security-section">
      {/* Header row (collapsed view) */}
      <div className="security-row">
        <div className="security-name">
          <span>Twitter Feed</span>
        </div>
        <div className="security-result">
          {/* Expand/collapse toggle */}
          <button 
            className="security-expand" 
            onClick={() => setExpanded(prev => !prev)}
            aria-label="Toggle Twitter feed"
          >
            <ExpandMoreIcon sx={{ fontSize: 16 }} />
          </button>
        </div>
      </div>

      {/* Expandable content */}
      {expanded && (
        <div className="twitter-feed-content" style={{ position: 'relative', paddingBottom: '8px' }}>
          {/* Loader animation while tweets load */}
          {loading && <ChartLoader message="Loading feed..." />}

          {/* "Coming soon" message for unsupported chains */}
          {feedError === 'comingSoon' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <span className="security-status pending">Feed is coming soon.</span>
            </div>
          )}

          {/* "Unavailable" message for errors/no-data */}
          {feedError === 'unavailable' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <span className="security-status pending">Feed is unavailable.</span>
            </div>
          )}

          {/* Container for the embedded Twitter timeline */}
          <div ref={containerRef} style={{ visibility: loading ? 'hidden' : 'visible' }} />
        </div>
      )}
    </div>
  );
};

export default TwitterFeedPanel;
