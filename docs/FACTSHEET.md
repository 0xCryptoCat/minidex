# Project Factsheet

**Name:** DEX Chart Mini-App

**Mission:** Mobile-first chart viewer for Telegram WebApp and mobile web, using GeckoTerminal with Dexscreener fallback.

**MVP Scope:**
- Address-based search with cross-chain results.
- Four chart views with pool switcher, trade markers, and optional metrics.
- Lists: trending, discovery, leaderboard.
- Polling only; no websockets or database.

**Non-goals:** payments, alerts, watchlists, heavy history, user auth.

**Success Metrics:**
- JS bundle ≤80 KB gz.
- Warm search <500 ms.
- Chart ≥60 FPS with 2k candles.
