# Chart UX

Outlines chart interactions and optional features.

## Views
1. **Detail** – finance KPIs and project links.
2. **Chart-only** – full chart with header and bottom tabs.
3. **Chart + TXs** – vertical split with trades list.
4. **TXs-only** – full-height trades table.

## Pool Switcher
- Display when more than one pool is available.
- Switching pools must keep the chart's x‑axis aligned.

## Trade Markers
- Toggle off by default; user can enable on demand.
- Buys are lime, sells are magenta.
- Cluster markers when trades are dense; tooltip shows aggregated info.

## Metrics Panel
- Optional mini-charts rendered with uPlot.
- Computed only when panel is opened; removed on close.
