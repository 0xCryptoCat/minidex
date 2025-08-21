**Integrate the new chart features into the codebase with changes in both PriceChart.tsx and ChartOnlyView.tsx.** Below are patch-style updates highlighting the necessary modifications:

**1\. Update PriceChart.tsx (add new props, series, formatting, and toggles):**

```diff
@@ interface Props {  
tokenDetail?: TokenResponse | null;  
\- displayMode?: DisplayMode;  
\+ displayMode?: DisplayMode;  
onDisplayModeChange?: (mode: DisplayMode) => void;  
\+ // New props for chart configuration  
\+ chartType?: 'candlestick' | 'line';  
\+ showVolume?: boolean;  
\+ crosshairMode?: 'normal' | 'magnet';  
}  
@@ export default function PriceChart({  
tokenDetail = null,  
\- displayMode = 'price',  
\- onDisplayModeChange,  
\+ displayMode = 'price',  
\+ onDisplayModeChange,  
\+ chartType = 'candlestick',  
\+ showVolume = true,  
\+ crosshairMode = 'normal',  
}: Props) {  
@@ inside PriceChart component:  
\- const chartRef = useRef&lt;IChartApi | null&gt;(null);  
\- const candleSeriesRef = useRef&lt;any&gt;(null);  
\- const volumeSeriesRef = useRef&lt;any&gt;(null);  
\+ const chartRef = useRef&lt;IChartApi | null&gt;(null);  
\+ const candleSeriesRef = useRef&lt;any&gt;(null);  
\+ const baselineSeriesRef = useRef&lt;any&gt;(null);  
\+ const volumeSeriesRef = useRef&lt;any&gt;(null);  
\+ const baselineGuideCandlesRef = useRef&lt;any&gt;(null);  
\+ const baselineGuideLineRef = useRef&lt;any&gt;(null);  
\+ const candlesDataRef = useRef&lt;{ time: number; open: number; high: number; low: number; close: number }\[\]&gt;(\[\]);  
\+ const volumeDataRef = useRef&lt;{ time: number; value: number; color: string }\[\]&gt;(\[\]);  
\+ const \[hoverBarData, setHoverBarData\] = useState&lt;{ time: number; open: number|null; high: number|null; low: number|null; close: number|null } | null&gt;(null);  
@@ useEffect(() => { ... create chart ... }:  
const chart = createChart(containerRef.current, {  
height: containerRef.current.clientHeight || 400,  
width: containerRef.current.clientWidth || 800,  
layout: {  
background: { color: 'transparent' },  
textColor: '#ffffff',  
fontSize: 12,  
fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',  
},  
grid: {  
vertLines: { color: 'rgba(255, 255, 255, 0.1)' },  
horzLines: { color: 'rgba(255, 255, 255, 0.1)' },  
},  
crosshair: {  
\- mode: 1, // Normal crosshair mode  
\- vertLine: {  
\+ mode: 1, // Normal (free) crosshair mode by default  
\+ vertLine: {  
color: 'rgba(255, 255, 255, 0.3)',  
width: 1,  
style: 2, // Dashed line  
\+ labelVisible: true,  
\+ labelBackgroundColor: '#333',  
},  
horzLine: {  
color: 'rgba(255, 255, 255, 0.3)',  
width: 1,  
style: 2, // Dashed line  
\+ labelVisible: true,  
\+ labelBackgroundColor: '#333',  
},  
},  
timeScale: {  
timeVisible: true,  
secondsVisible: false,  
borderColor: 'rgba(255, 255, 255, 0.2)',  
rightOffset: 50, // Increased to allow more empty space  
barSpacing: 8,  
fixLeftEdge: false,  
fixRightEdge: false,  
lockVisibleTimeRangeOnResize: false,  
// Allow scrolling beyond data  
shiftVisibleRangeOnNewBar: false,  
},  
rightPriceScale: {  
borderColor: 'rgba(255, 255, 255, 0.2)',  
scaleMargins: {  
top: 0.1,  
bottom: 0.2,  
},  
entireTextOnly: false,  
minimumWidth: 80,  
},  
leftPriceScale: {  
visible: false,  
},  
handleScroll: true,  
handleScale: true,  
});  
\-  
\- // Add candlestick series with theme colors  
\- const candleSeries = chart.addCandlestickSeries({  
\+ // Custom price formatter for axis labels (K/M/B abbreviations and tiny subscripts for small values)  
\+ function formatPrice(v: number): string {  
\+ if (v == null || !isFinite(v)) return '';  
\+ const a = Math.abs(v);  
\+ if (a >= 1e3) {  
\+ if (a < 1e6) return (v / 1e3).toFixed(1) + 'K';  
\+ if (a < 1e9) return (v / 1e6).toFixed(1) + 'M';  
\+ if (a < 1e12) return (v / 1e9).toFixed(1) + 'B';  
\+ return (v / 1e12).toFixed(1) + 'T';  
\+ }  
\+ if (a > 0 && a < 1e-4) {  
\+ const exp = Math.floor(Math.log10(a));  
\+ const zeros = Math.abs(exp) - 1;  
\+ if (zeros >= 3) {  
\+ const sub = zeros - 1;  
\+ const sci = v.toExponential(3);  
\+ const mantissa = sci.split('e')\[0\].replace('.', '');  
\+ const subscript = String(sub).split('').map(d => String.fromCharCode(0x2080 + +d)).join('');  
\+ return \`0.0${subscript}${mantissa}\`;  
\+ }  
\+ }  
\+ return String(v.toFixed(4)).replace(/\\.?0+$/, '');  
\+ }  
\+ chart.applyOptions({ localization: { priceFormatter: formatPrice } });  
+  
\+ // Add candlestick series with theme colors  
\+ const candleSeries = chart.addCandlestickSeries({  
upColor: '#34c759', // --buy-primary  
downColor: '#e13232', // --sell-primary  
borderUpColor: '#34c759',  
borderDownColor: '#e13232',  
wickUpColor: '#34c759',  
wickDownColor: '#e13232',  
\+ lastValueVisible: false,  
\+ priceLineVisible: false,  
\+ priceFormat: { type: 'price', minMove: 0.00000001, precision: 8 },  
});  
\-  
\- // Add volume series with theme colors  
\+ // Add baseline series for line chart mode (area line with dual-color fill)  
\+ const baselineSeries = chart.addBaselineSeries({  
\+ baseValue: { type: 'price', price: 0 }, // will be updated dynamically  
\+ topLineColor: '#34c759',  
\+ bottomLineColor: '#e13232',  
\+ topFillColor1: 'rgba(52,199,89,0.75)',  
\+ topFillColor2: 'rgba(52,199,89,0.00)',  
\+ bottomFillColor1: 'rgba(225,50,50,0.00)',  
\+ bottomFillColor2: 'rgba(225,50,50,0.75)',  
\+ lastValueVisible: false,  
\+ priceLineVisible: false,  
\+ priceFormat: { type: 'price', minMove: 0.00000001, precision: 8 },  
\+ });  
\+ baselineSeries.applyOptions({ visible: false }); // start with line series hidden  
+  
\+ // Add volume histogram series with theme colors  
const volumeSeries = chart.addHistogramSeries({  
priceScaleId: '',  
priceFormat: { type: 'volume' },  
\- color: 'rgba(255, 255, 255, 0.2)',  
\+ color: 'rgba(255, 255, 255, 0.2)',  
\+ lastValueVisible: false,  
\+ priceLineVisible: false,  
});  
<br/>volumeSeries.priceScale().applyOptions({  
scaleMargins: { top: 0.8, bottom: 0 },  
\- borderColor: 'rgba(255, 255, 255, 0.2)',  
\+ borderColor: 'rgba(255, 255, 255, 0.1)',  
});  
@@ after adding series:  
chartRef.current = chart;  
candleSeriesRef.current = candleSeries;  
\+ baselineSeriesRef.current = baselineSeries;  
volumeSeriesRef.current = volumeSeries;  
@@ handle resize and subscriptions:  
window.addEventListener('resize', handleResize);  
@@ subscribe to visible range changes for baseline dynamic base line:  
\+ // Update baseline base price and guide line whenever visible range changes  
\+ function lowerBoundByTime(arr: { time: number }\[\], t: number) {  
\+ let lo = 0, hi = arr.length;  
\+ while (lo < hi) {  
\+ const mid = (lo + hi) >> 1;  
\+ if (arr\[mid\].time < t) lo = mid + 1;  
\+ else hi = mid;  
\+ }  
\+ return lo;  
\+ }  
\+ const chartTypeRef = { current: chartType }; // capture current mode  
\+ const recomputeBaselineFromFirstVisible = () => {  
\+ if (!chartRef.current) return;  
\+ const range = chartRef.current.timeScale().getVisibleRange();  
\+ if (!range || range.from === undefined) return;  
\+ const data = candlesDataRef.current;  
\+ if (!data || data.length === 0) return;  
\+ let idx = lowerBoundByTime(data, range.from as number);  
\+ if (idx > data.length - 1) idx = data.length - 1;  
\+ const first = data\[idx\];  
\+ if (!first) return;  
\+ const basePrice = first.open;  
\+ // Update baseline series base value  
\+ baselineSeriesRef.current?.applyOptions({ baseValue: { type: 'price', price: basePrice } });  
\+ // Remove any existing guide line and add a new one on the active series  
\+ if (baselineGuideCandlesRef.current) {  
\+ candleSeriesRef.current?.removePriceLine(baselineGuideCandlesRef.current);  
\+ baselineGuideCandlesRef.current = null;  
\+ }  
\+ if (baselineGuideLineRef.current) {  
\+ baselineSeriesRef.current?.removePriceLine(baselineGuideLineRef.current);  
\+ baselineGuideLineRef.current = null;  
\+ }  
\+ if (chartTypeRef.current === 'candlestick') {  
\+ baselineGuideCandlesRef.current = candleSeriesRef.current?.createPriceLine({  
\+ price: basePrice,  
\+ color: '#ffffff',  
\+ lineWidth: 1,  
\+ lineStyle: 1, // dotted  
\+ axisLabelVisible: true,  
\+ });  
\+ } else {  
\+ baselineGuideLineRef.current = baselineSeriesRef.current?.createPriceLine({  
\+ price: basePrice,  
\+ color: '#ffffff',  
\+ lineWidth: 1,  
\+ lineStyle: 1, // dotted  
\+ axisLabelVisible: true,  
\+ });  
\+ }  
\+ };  
\+ chart.timeScale().subscribeVisibleTimeRangeChange(recomputeBaselineFromFirstVisible);  
@@ subscribe crosshair:  
const crosshairHandler = (param: any) => {  
\- if (param.time === undefined) {  
\- setHoveredMarkers(null);  
\- return;  
\- }  
\- const arr = markersMapRef.current.get(param.time as number);  
\- setHoveredMarkers(arr || null);  
\+ if (param.time === undefined) {  
\+ // No crosshair (cursor left chart): show last bar info  
\+ setHoveredMarkers(null);  
\+ const data = candlesDataRef.current;  
\+ setHoverBarData(data.length ? data\[data.length - 1\] : null);  
\+ return;  
\+ }  
\+ // Highlight any trade markers at this timestamp  
\+ const arr = markersMapRef.current.get(param.time as number);  
\+ setHoveredMarkers(arr || null);  
\+ // Find corresponding candle and update OHLC info  
\+ const bar = candlesDataRef.current.find(b => b.time === param.time);  
\+ setHoverBarData(bar || null);  
};  
chart.subscribeCrosshairMove(crosshairHandler);  
@@ cleanup return:  
return () => {  
window.removeEventListener('resize', handleResize);  
chart.unsubscribeCrosshairMove(crosshairHandler);  
\- chart.remove();  
\+ chart.timeScale().unsubscribeVisibleTimeRangeChange(recomputeBaselineFromFirstVisible);  
\+ chart.remove();  
};  
}, \[onXDomainChange\]);  
@@ useEffect for data fetch (within try block after receiving candles data):  
\- if (candles.length > 0 && cleaned.length === candles.length) {  
\+ if (candles.length > 0 && cleaned.length === candles.length) {  
// Transform data based on display mode  
const transformedData = cleaned.map((cd) => {  
@@ transform loop remains same  
});  
<br/>const v = transformedData.map((cd) => {  
const src = candles.find((k) => Math.floor(Number(k.t)) === cd.time);  
const vol = src && Number.isFinite(Number(src.v)) ? Number(src.v) : 0;  
return {  
time: cd.time as UTCTimestamp,  
value: vol,  
\- color: cd.close >= cd.open ? '#34c759' : '#e13232',  
\+ color: cd.close >= cd.open ? 'rgba(52,199,89,0.5)' : 'rgba(225,50,50,0.5)',  
};  
});  
<br/>candleSeriesRef.current?.setData(transformedData);  
\- volumeSeriesRef.current?.setData(v);  
\+ volumeSeriesRef.current?.setData(v);  
\+ baselineSeriesRef.current?.setData(transformedData.map((cd) => ({ time: cd.time as UTCTimestamp, value: cd.close })));  
\+ // Save data for later (e.g., crosshair/baseline calculations)  
\+ candlesDataRef.current = transformedData;  
\+ volumeDataRef.current = v;  
setHasData(true);  
setIsLoading(false);  
\+ // Show last bar info by default  
\+ if (transformedData.length > 0) {  
\+ setHoverBarData(transformedData\[transformedData.length - 1\]);  
\+ }  
\+ // Recompute baseline base line for initial range  
\+ recomputeBaselineFromFirstVisible();  
@@ after data fetch useEffect:  
}, \[pairId, tf, chain, poolAddress, tokenAddress, displayMode, tokenDetail\]);  
@@ \*\*New useEffects for toggles\*\*:  
\+ // Toggle candlestick vs line series visibility  
\+ useEffect(() => {  
\+ if (!chartRef.current || !candleSeriesRef.current || !baselineSeriesRef.current) return;  
\+ if (chartType === 'candlestick') {  
\+ candleSeriesRef.current.applyOptions({ visible: true });  
\+ baselineSeriesRef.current.applyOptions({ visible: false });  
\+ } else {  
\+ candleSeriesRef.current.applyOptions({ visible: false });  
\+ baselineSeriesRef.current.applyOptions({ visible: true });  
\+ }  
\+ // Update baseline guide line on toggle  
\+ recomputeBaselineFromFirstVisible();  
\+ }, \[chartType\]);  
+  
\+ // Toggle volume histogram visibility  
\+ useEffect(() => {  
\+ if (!chartRef.current || !volumeSeriesRef.current) return;  
\+ const visible = showVolume;  
\+ volumeSeriesRef.current.applyOptions({ visible });  
\+ // Adjust volume overlay scale margins  
\+ volumeSeriesRef.current.priceScale().applyOptions({  
\+ scaleMargins: visible ? { top: 0.8, bottom: 0 } : { top: 0, bottom: 0 },  
\+ });  
\+ // Adjust main price scale bottom margin to reclaim space if volume hidden  
\+ chartRef.current.priceScale('right').applyOptions({  
\+ scaleMargins: { top: 0.1, bottom: visible ? 0.2 : 0.0 },  
\+ });  
\+ }, \[showVolume\]);  
+  
\+ // Toggle crosshair mode (free vs magnet snap)  
\+ useEffect(() => {  
\+ if (!chartRef.current) return;  
\+ chartRef.current.applyOptions({  
\+ crosshair: {  
\+ mode: crosshairMode === 'magnet' ? 0 : 1, // 0 = Magnet, 1 = Normal  
\+ },  
\+ });  
\+ }, \[crosshairMode\]);  
@@ inside JSX return, add OHLC info panel:  
{/\* Hovered markers tooltip \*/}  
{hoveredMarkers && hoveredMarkers.length > 0 && (  
<div  
style={{  
position: 'absolute',  
left: 8,  
top: 8,  
background: 'rgba(0,0,0,0.8)',  
color: 'var(--text)',  
padding: 'var(--space-2)',  
fontSize: '12px',  
zIndex: 5,  
borderRadius: 'var(--radius-small)',  
backdropFilter: 'blur(8px)',  
border: '1px solid var(--border)',  
}}  
\>  
{/\* ...existing trade markers mapping... \*/}  
&lt;/div&gt;  
)}  
\+ {/\* OHLC info panel (shows open, high, low, close, volume for hovered or last bar) \*/}  
\+ {hoverBarData && (  
\+ <div  
\+ style={{  
\+ position: 'absolute',  
\+ left: 8,  
\+ top: degraded ? 40 : 8, // offset if degraded message is shown  
\+ background: 'rgba(0,0,0,0.6)',  
\+ color: '#fff',  
\+ padding: '4px 8px',  
\+ fontSize: '12px',  
\+ zIndex: 4,  
\+ borderRadius: 'var(--radius-small)',  
\+ }}  
\+ >  
\+ <div style={{ color: hoverBarData.open != null && hoverBarData.close != null  
\+ ? (hoverBarData.close >= hoverBarData.open ? '#34c759' : '#e13232')  
\+ : '#ffffff' }}>  
\+ &lt;strong style={{ color: '#fff' }}&gt;O&lt;/strong&gt; {formatPrice(hoverBarData.open ?? hoverBarData.close ?? 0)},{" "}  
\+ &lt;strong style={{ color: '#fff' }}&gt;H&lt;/strong&gt; {formatPrice(hoverBarData.high ?? hoverBarData.close ?? 0)},{" "}  
\+ &lt;strong style={{ color: '#fff' }}&gt;L&lt;/strong&gt; {formatPrice(hoverBarData.low ?? hoverBarData.close ?? 0)},{" "}  
\+ &lt;strong style={{ color: '#fff' }}&gt;C&lt;/strong&gt; {formatPrice(hoverBarData.close ?? 0)},{" "}  
\+ &lt;strong style={{ color: '#fff' }}&gt;Vol&lt;/strong&gt;{" "}  
\+ {hoverBarData.time ? formatUsd(volumeDataRef.current.find(v => v.time === hoverBarData.time)?.value || 0, { compact: true, dp: 2 }) : "-"}  
\+ &lt;/div&gt;  
\+ &lt;/div&gt;  
\+ )}
```

**Key changes in PriceChart.tsx:** We added new optional props (chartType, showVolume, crosshairMode) and set default values. A **baseline series** is created for the line chart mode (with green/red fill above/below a dynamic baseline price). We hide this series by default (show candlesticks initially). We also applied lastValueVisible: false and priceLineVisible: false to all series to remove built-in last-value markers and lines (for a cleaner UI, since we'll show the current price/values elsewhere).

We implemented a formatPrice function to format price values (using K/M/B suffixes and special formatting for very small values) and applied it via chart.applyOptions({ localization: { priceFormatter: ... } }) so the y-axis labels use these abbreviations. Volume bar colors now use semi-transparent green/red (rgba(52,199,89,0.5) for up-bars, rgba(225,50,50,0.5) for down-bars) to better blend with the background.

We introduced a **crosshair information panel**: using state hoverBarData to track the currently hovered bar (or last bar when no crosshair). The chart.subscribeCrosshairMove handler was extended to update hoverBarData with OHLCV of the hovered timestamp (or last candle if cursor leaves the chart). A new JSX block renders this info at the top-left of the chart (O, H, L, C, and Vol), with dynamic coloring (text turns lime for up-bars or red for down-bars). The volume in the info panel is formatted with formatUsd (compact notation with $ prefix). This panel is positioned at top:8px, left:8px by default, but shifts down slightly (top: 40px) if the “Data feed degraded” banner is showing, to avoid overlap. Its z-index is set lower than the trade markers tooltip, so if a trade tooltip appears (when hovering a marker), it will overlap and hide the OHLC panel to prevent visual conflict.

We also added a subscription to timeScale().subscribeVisibleTimeRangeChange that calls recomputeBaselineFromFirstVisible. This function dynamically recalculates the baseline’s reference price (the open price of the first visible candle) whenever the chart’s visible range changes (e.g. user zooms or scrolls). It updates the baseline series’s baseValue and moves a horizontal guide line (white dotted line with an axis label) to that price on the active series. When switching chart modes, we remove the old guide line and add a new one to the currently visible series (candlesticks or line).

Finally, we added three useEffect hooks to respond to prop changes for chartType, showVolume, and crosshairMode: - When chartType toggles, we show/hide the candlestick or baseline series accordingly and call recomputeBaselineFromFirstVisible() to update the baseline reference line for the new mode. - When showVolume toggles, we set the volume series visibility and adjust the price scale margins. If volume is hidden, the main price scale’s bottom margin is set to 0 (so candlesticks/baseline use full height), and the volume scale’s margins are also reset (so no empty space reserved). - When crosshairMode changes, we call chart.applyOptions to switch the crosshair mode between Normal (free) and Magnet (snap to data). (Here we use 0 for magnet and 1 for normal mode, as per the library’s CrosshairMode enum.)

**2\. Update ChartOnlyView.tsx (add UI controls and pass new props to PriceChart):**
```diff
@@ component state (above return):  
const \[displayMode, setDisplayMode\] = useState&lt;DisplayMode&gt;('price');  
const \[meta, setMeta\] = useState&lt;FetchMeta | null&gt;(null);  
const loggedRef = useRef(false);  
const DEBUG = (import.meta as any).env?.DEBUG === 'true';  
\+ const \[chartType, setChartType\] = useState&lt;'candlestick' | 'line'&gt;('candlestick');  
\+ const \[showVolume, setShowVolume\] = useState(true);  
\+ const \[snapCrosshair, setSnapCrosshair\] = useState(false);  
@@ inside return JSX, chart controls section:  
&lt;div className="chart-controls-left"&gt;  
<TimeframeSelector  
selectedTf={tf}  
availableTfs={availableTfs}  
onTfChange={handleTfChange}  
disabled={tfLoading}  
/>  
{/\* ... (DisplayMode buttons commented out) ... \*/}  
&lt;label className="trade-markers-toggle"&gt;  
<input  
type="checkbox"  
checked={showMarkers}  
onChange={handleToggle}  
/>  
&lt;span&gt;Trades&lt;/span&gt;  
&lt;/label&gt;  
&lt;/div&gt;  
\- &lt;div className="chart-controls-right"&gt;  
\- {/\* Space for future controls \*/}  
\- &lt;/div&gt;  
\+ &lt;div className="chart-controls-right"&gt;  
\+ &lt;div className="chart-type-toggle"&gt;  
\+ <button  
\+ className={\`chart-mode-button ${chartType === 'candlestick' ? 'selected' : ''}\`}  
\+ onClick={() => setChartType('candlestick')}  
\+ type="button"  
\+ >  
\+ Candlesticks  
\+ &lt;/button&gt;  
\+ <button  
\+ className={\`chart-mode-button ${chartType === 'line' ? 'selected' : ''}\`}  
\+ onClick={() => setChartType('line')}  
\+ type="button"  
\+ >  
\+ Line  
\+ &lt;/button&gt;  
\+ &lt;/div&gt;  
\+ &lt;label className="trade-markers-toggle"&gt;  
\+ <input  
\+ type="checkbox"  
\+ checked={showVolume}  
\+ onChange={(e) => setShowVolume(e.target.checked)}  
\+ />  
\+ &lt;span&gt;Volume&lt;/span&gt;  
\+ &lt;/label&gt;  
\+ &lt;label className="trade-markers-toggle"&gt;  
\+ <input  
\+ type="checkbox"  
\+ checked={snapCrosshair}  
\+ onChange={(e) => setSnapCrosshair(e.target.checked)}  
\+ />  
\+ &lt;span&gt;Snap&lt;/span&gt;  
\+ &lt;/label&gt;  
\+ &lt;/div&gt;  
@@ PriceChart usage (near end of return):  
\- <PriceChart  
\+ <PriceChart  
pairId={pairId}  
tf={tf}  
xDomain={xDomain}  
onXDomainChange={onXDomainChange}  
markers={markers}  
chain={chain}  
poolAddress={poolAddress}  
tokenAddress={tokenAddress}  
tokenDetail={tokenDetail}  
displayMode={displayMode}  
\- onDisplayModeChange={setDisplayMode}  
\+ onDisplayModeChange={setDisplayMode}  
\+ chartType={chartType}  
\+ showVolume={showVolume}  
\+ crosshairMode={snapCrosshair ? 'magnet' : 'normal'}  
/>
```

In **ChartOnlyView.tsx**, we added local state for the new controls: - chartType ('candlestick' or 'line'), defaulting to candlestick view. - showVolume (boolean), default true to show volume bars initially. - snapCrosshair (boolean), default false (crosshair free-moving by default).

We then populated the previously empty .chart-controls-right section with new UI elements: - A **Chart Type toggle** using two buttons (styled with the existing .chart-mode-button class). The “Candlesticks” button and “Line” button let the user switch between the candlestick chart and baseline line chart. The active mode button gets the selected class for styling (highlighted background). - A **Volume toggle** using a checkbox labeled "Volume". This is checked by default; unchecking it will hide the volume histogram. - A **Crosshair mode toggle** using a checkbox labeled "Snap". When checked, the crosshair snaps to data points (magnet mode); when unchecked, it moves freely.

_(All toggles use the existing .trade-markers-toggle styling for consistency, which gives a neat hover effect and uses the theme’s accent color for the checkbox.)_

Finally, we pass these state values down into &lt;PriceChart /&gt; via the new props: - chartType={chartType} - showVolume={showVolume} - crosshairMode={snapCrosshair ? 'magnet' : 'normal'}

This ties the UI controls to the chart behavior implemented in PriceChart.tsx. Now, when a user toggles any of these options, the chart will update accordingly (switch chart style, hide/show volume, change crosshair snapping).

After applying these patches, **the chart will be properly styled and interactive**: - Users can switch between candlestick and line (baseline) views without losing their zoom/scroll position. - Volume bars can be shown or hidden on demand. - Crosshair labels are always visible, and grid lines are always on (we’ve kept those enabled by default as per your instructions). - The crosshair can be toggled between a free mode and a snapping mode for precise value reading. - An info panel at the top-left displays the OHLC and volume for the currently hovered candle (or the latest candle when no crosshair), updating in real-time as you move the crosshair.

These changes use the existing data-fetching and state management logic of Minidex, integrating smoothly with the current codebase for a better chart UX. The chart should now match the tested prototype’s functionality and styling.