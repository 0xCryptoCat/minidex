import React, { useCallback, useEffect, useMemo, useState } from "react";
import ChartLoader from "./ChartLoader";
import { FavoriteBorder, KeyboardReturn, Repeat, BarChart } from '@mui/icons-material';

/**
 * Minimal types for the API payload we observed.
 */
type TweetAuthor = {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
};

type TweetMetrics = {
  retweet_count?: number;
  reply_count?: number;
  like_count?: number;
  quote_count?: number;
  bookmark_count?: number;
  impression_count?: number;
};

type TweetEntitiesUrl = {
  url?: string;
  expanded_url?: string;
  display_url?: string;
  media_key?: string;
};

type Tweet = {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  author: TweetAuthor;
  public_metrics?: TweetMetrics;
  entities?: { urls?: TweetEntitiesUrl[]; cashtags?: { tag: string }[] };
};

type TweetsResponse = {
  is_enabled: boolean;
  tweets: Tweet[];
};

type Props = {
  /** Solana mint address for the token (required by the API) */
  tokenAddress: string;

  /**
   * Chain identifier.
   * We treat Solana as supported and everything else as "coming soon".
   * Common values you might pass: "solana", 101, "solana-mainnet".
   */
  chainId: string | number;

  /** Optional: override panel title (default: "Twitter Feed") */
  title?: string;

  /** Optional: panel height when expanded; content scrolls inside (default: 340) */
  heightPx?: number;

  /** Optional: polling interval while open (ms). Set 0 to disable (default: 90_000) */
  refreshMs?: number;

  /**
   * Optional: className hooks to better match your repo CSS quickly.
   * If your Security section uses particular classes, map them here.
   */
  classNames?: {
    root?: string;           // wrapper of the whole panel
    headerRow?: string;      // clickable header row container
    headerLeft?: string;     // title container
    headerRight?: string;    // right-aligned controls
    expandBtn?: string;      // toggle button
    content?: string;        // collapsible content container
    card?: string;           // tweet card wrapper
    authorRow?: string;      // author (avatar + names) row
    authorName?: string;     // author display name
    authorHandle?: string;   // @handle
    metaRow?: string;        // created_at + views
    text?: string;           // tweet text
    metricsRow?: string;     // likes/replies/etc row
    pill?: string;           // small status pill (for unavailable/soon)
  };
};

/**
 * Loose detection for Solana.
 * Feel free to simplify if your app already knows (e.g., boolean isSolana prop).
 */
function isSolana(chainId: Props["chainId"]) {
  if (typeof chainId === "number") return chainId === 101; // common Solana id in some apps
  const v = String(chainId).toLowerCase();
  return v.includes("solana") || v === "sol";
}

const TwitterFeedPanel: React.FC<Props> = ({
  tokenAddress,
  chainId,
  title = "Twitter Feed",
  heightPx = 340,
  refreshMs = 90_000,
  classNames = {},
}) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<null | "comingSoon" | "unavailable">(null);
  const [data, setData] = useState<TweetsResponse | null>(null);

  const canShowFeed = useMemo(() => isSolana(chainId), [chainId]);

  const url = useMemo(() => {
    const u = new URL("/.netlify/functions/tweets", window.location.origin);
    u.searchParams.set("token_address", tokenAddress);
    u.searchParams.set("compact", "false");
    return u.toString();
  }, [tokenAddress]);

  const fetchTweets = useCallback(async (signal?: AbortSignal) => {
    if (!canShowFeed) {
      setErr("comingSoon");
      setData(null);
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch(url, { method: "GET", credentials: "omit", signal });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json: TweetsResponse = await r.json();

      if (!json?.is_enabled) {
        setErr("unavailable");
        setData(null);
      } else if (!json.tweets || json.tweets.length === 0) {
        setErr("unavailable");
        setData({ is_enabled: true, tweets: [] });
      } else {
        setData(json);
      }
    } catch (_e) {
      setErr("unavailable");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [url, canShowFeed]);

  // Load on first expand, then poll while open (if refreshMs > 0)
  useEffect(() => {
    if (!expanded) return;

    const ctrl = new AbortController();
    fetchTweets(ctrl.signal);

    if (refreshMs > 0) {
      const id = setInterval(() => fetchTweets(ctrl.signal), refreshMs);
      return () => {
        ctrl.abort();
        clearInterval(id);
      };
    }
    return () => ctrl.abort();
  }, [expanded, fetchTweets, refreshMs]);

  // --- UI helpers
  const openTweet = (t: Tweet) =>
    window.open(`https://x.com/${t.author?.username}/status/${t.id}`, "_blank", "noopener,noreferrer");

  // --- Date to time-ago formatter
  const formatTimeAgo = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    if (diffMinutes > 0) return `${diffMinutes}m`;
    return "just now";
  };

  return (
    <div className={classNames.root ?? "security-section"}>
      {/* Header row (need to match security section style) */}
      <div
        className={classNames.headerRow ?? "detail-panel__row"}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
      >
        <div className={classNames.headerLeft ?? "tweets-name"}>
          {title}
        </div>
        <div className={classNames.headerRight ?? "detail-panel__controls"}>
          <button
            type="button"
            className={classNames.expandBtn ?? "detail-panel__expand"}
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls="twitter-feed-content"
            title={expanded ? "Collapse" : "Expand"}
            style={{
              border: 0,
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
              lineHeight: 0,
            }}
          >
            {/* simple chevron */}
            <svg width="16" height="16" viewBox="0 0 24 24" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .15s" }}>
              <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Collapsible content */}
      {expanded && (
        <div
          id="twitter-feed-content"
          className={classNames.content ?? "detail-panel__content"}
          style={{
            position: "relative",
            padding: "8px 0 0",
          }}
        >
          {loading && <ChartLoader message="Loading feed…" />}

          {/* Coming soon / unavailable states */}
          {!loading && err === "comingSoon" && (
            <div style={{ display: "grid", placeItems: "center", padding: "16px 0" }}>
              <span className={classNames.pill ?? "pill pill--muted"}>Feed is coming soon.</span>
            </div>
          )}

          {!loading && err === "unavailable" && (
            <div style={{ display: "grid", placeItems: "center", padding: "16px 0" }}>
              <span className={classNames.pill ?? "pill pill--muted"}>Feed is unavailable.</span>
            </div>
          )}

          {/* Tweets list */}
          {!loading && !err && data?.tweets && (
            <div
              style={{
                maxHeight: heightPx,
                overflow: "scroll",
                display: "grid",
                gap: 8,
              }}
            >
              {data.tweets.map((t) => (
                <article
                  key={t.id}
                  className={classNames.card ?? "card"}
                  style={{
                    borderRadius: 12,
                    padding: 12,
                    background: "var(--bg-elev-2)",
                  }}
                >
                  {/* Author */}
                  <div className={classNames.authorRow ?? "tweet__author"} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {t.author?.profile_image_url ? (
                      <img
                        src={t.author.profile_image_url}
                        alt={t.author?.name || t.author?.username}
                        width={30}
                        height={30}
                        style={{ borderRadius: "50%", objectFit: "cover" }}
                        loading="lazy"
                      />
                    ) : (
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--muted, #333)" }}><img src={`https://placehold.co/36x36/909090/ffffff?text=${(t.author?.name || t.author?.username)?.[0]?.toUpperCase() || ' '}`} alt="Placeholder" style={{ borderRadius: "50%", objectFit: "cover" }} /></div>
                    )}
                    <div style={{ display: "flex", alignItems: "baseline", minWidth: 0, flexDirection: "column" }}>
                      <div className={classNames.authorName ?? "tweet__name"} style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.author?.name || "Unknown"}
                      </div>
                      <div className={classNames.authorHandle ?? "tweets-text"} style={{ fontSize: 15, color: "var(--text-disabled)" }}>
                        @{t.author?.username}
                      </div>
                    </div>
                    {/* Meta: time ago */}
                    <div className={classNames.metaRow ?? "tweet-text"} style={{ marginTop: 8, fontSize: 12, color: "var(--text-disabled)", display: "flex", gap: 8, justifyContent: "space-between" }}>
                      <span> · {formatTimeAgo(t.created_at)}</span>
                    </div>
                  </div>

                  {/* Text */}
                  <div className={classNames.text ?? "tweets-text"} style={{ marginTop: 8, fontSize: 15, whiteSpace: "pre-wrap", lineHeight: "20px", fontFamily: "TwitterChirp, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
                    {t.text}
                  </div>

                  {/* URLs (simple list) */}
                  {!!t.entities?.urls?.length && (
                    // Display URLs as an image - if not possible, show as text
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                      {t.entities.urls.map((url, i) => (
                        <img
                          key={i}
                          src={url.expanded_url || url.url}
                          alt={url.display_url || url.expanded_url || url.url}
                          style={{ borderRadius: 8, objectFit: "cover", width: "100%", height: "auto" }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Metrics */}
                  <div className={classNames.metricsRow ?? "tweet__metrics"} style={{ marginTop: 8, fontSize: 12, display: "flex", gap: 12, opacity: 0.85 }}>
                    <span><FavoriteBorder fontSize="small" /> {t.public_metrics?.like_count ?? 0}</span>
                    <span><KeyboardReturn fontSize="small" /> {t.public_metrics?.reply_count ?? 0}</span>
                    <span><Repeat fontSize="small" /> {t.public_metrics?.retweet_count ?? 0}</span>
                    {typeof t.public_metrics?.impression_count === "number" && (
                      <span><BarChart fontSize="small" /> {t.public_metrics?.impression_count.toLocaleString() ?? 0}</span>
                    )}
                  </div>

                  {/* CTA */}
                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => openTweet(t)}
                      style={{
                        border: "1px solid var(--border, rgba(255,255,255,0.12))",
                        background: "transparent",
                        color: "inherit",
                        borderRadius: 8,
                        padding: "6px 10px",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Read on X
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TwitterFeedPanel;
