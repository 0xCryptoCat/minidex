import React, { useCallback, useEffect, useMemo, useState } from "react";
import ChartLoader from "./ChartLoader";

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
    const u = new URL("https://screener-api.assetdash.com/moby_screener/tokens/tweets");
    u.searchParams.set("token_address", tokenAddress || "");
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

  return (
    <div className={classNames.root ?? "detail-panel"}>
      {/* Header row (match your security section style) */}
      <div
        className={classNames.headerRow ?? "detail-panel__row"}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
      >
        <div className={classNames.headerLeft ?? "detail-panel__title"} style={{ fontWeight: 600 }}>
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
                overflow: "auto",
                paddingRight: 4, // room for scrollbar
                display: "grid",
                gap: 8,
              }}
            >
              {data.tweets.map((t) => (
                <article
                  key={t.id}
                  className={classNames.card ?? "card"}
                  style={{
                    border: "1px solid var(--border, rgba(255,255,255,0.08))",
                    borderRadius: 12,
                    padding: 12,
                    background: "var(--surface, rgba(255,255,255,0.02))",
                  }}
                >
                  {/* Author */}
                  <div className={classNames.authorRow ?? "tweet__author"} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {t.author?.profile_image_url ? (
                      <img
                        src={t.author.profile_image_url}
                        alt={t.author?.name || t.author?.username}
                        width={26}
                        height={26}
                        style={{ borderRadius: "50%", objectFit: "cover" }}
                        loading="lazy"
                      />
                    ) : (
                      <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--muted, #333)" }} />
                    )}
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 }}>
                      <div className={classNames.authorName ?? "tweet__name"} style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.author?.name || "Unknown"}
                      </div>
                      <div className={classNames.authorHandle ?? "tweet__handle"} style={{ fontSize: 12, opacity: 0.75 }}>
                        @{t.author?.username}
                      </div>
                    </div>
                  </div>

                  {/* Text */}
                  <div className={classNames.text ?? "tweet__text"} style={{ marginTop: 8, fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.35 }}>
                    {t.text}
                  </div>

                  {/* URLs (simple list) */}
                  {!!t.entities?.urls?.length && (
                    <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 16 }}>
                      {t.entities.urls.map((u, i) => {
                        const href = u.expanded_url || u.url;
                        if (!href) return null;
                        return (
                          <li key={i} style={{ fontSize: 12 }}>
                            <a href={href} target="_blank" rel="noreferrer noopener" style={{ textDecoration: "underline" }}>
                              {u.display_url || href}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* Meta: time + impressions */}
                  <div className={classNames.metaRow ?? "tweet__meta"} style={{ marginTop: 8, fontSize: 11, opacity: 0.7, display: "flex", gap: 8 }}>
                    <span>{new Date(t.created_at).toLocaleString()}</span>
                    {typeof t.public_metrics?.impression_count === "number" && (
                      <span>· {t.public_metrics.impression_count.toLocaleString()} views</span>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className={classNames.metricsRow ?? "tweet__metrics"} style={{ marginTop: 8, fontSize: 12, display: "flex", gap: 12, opacity: 0.85 }}>
                    <span>❤ {t.public_metrics?.like_count ?? 0}</span>
                    <span>↩︎ {t.public_metrics?.reply_count ?? 0}</span>
                    <span>🔁 {t.public_metrics?.retweet_count ?? 0}</span>
                    <span>🔖 {t.public_metrics?.bookmark_count ?? 0}</span>
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
