**Chart Prototyping**

```JS
// Requires:
// <script src="https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js"></script>

const root = document.getElementById('chart');

/* =============== Chart =============== */
const chart = LightweightCharts.createChart(root, {
  width: root.clientWidth,
  height: root.clientHeight,
  layout: {
    background: { color: 'transparent' },
    textColor: '#fff',
    fontSize: 12,
  },
  rightPriceScale: {
    borderColor: 'rgba(255,255,255,0.2)',
    scaleMargins: { top: 0.10, bottom: 0.20 }, // ~20% bottom for volume
    minimumWidth: 60,
    entireTextOnly: false,
  },
  leftPriceScale: { visible: false },
  grid: {
    vertLines: { color: 'rgba(255,255,255,0.10)' },
    horzLines: { color: 'rgba(255,255,255,0.10)' },
  },
  crosshair: {
    mode: LightweightCharts.CrosshairMode.Normal,
    vertLine: {
      color: 'rgba(255,255,255,0.3)',
      width: 1,
      style: LightweightCharts.LineStyle.Dashed,
      labelBackgroundColor: '#333',
      labelVisible: true,
    },
    horzLine: {
      color: 'rgba(255,255,255,0.3)',
      width: 1,
      style: LightweightCharts.LineStyle.Dashed,
      labelBackgroundColor: '#333',
      labelVisible: true,
    },
  },
  timeScale: {
    timeVisible: true,
    secondsVisible: false,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});

/* =============== Price formatting (K/M/B/T + subscript tiny) =============== */
function formatPrice(v) {
  if (v == null || !isFinite(v)) return '';
  const a = Math.abs(v);
  if (a >= 1e3) {
    if (a < 1e6)  return (v/1e3).toFixed(1) + 'K';
    if (a < 1e9)  return (v/1e6).toFixed(1) + 'M';
    if (a < 1e12) return (v/1e9).toFixed(1) + 'B';
    return (v/1e12).toFixed(1) + 'T';
  }
  if (a > 0 && a < 1e-4) {
    const exp = Math.floor(Math.log10(a));         // negative
    const zeros = Math.abs(exp) - 1;               // zeros after '0.'
    if (zeros >= 3) {
      const sub = zeros - 1;                       // we render 0.0ₓ…
      const sci = v.toExponential(3);              // "1.23e-5"
      const mantissa = sci.split('e')[0].replace('.', ''); // "123"
      const subscript = String(sub).split('').map(d => String.fromCharCode(0x2080 + +d)).join('');
      return `0.0${subscript}${mantissa}`;
    }
  }
  return String(v.toFixed(4)).replace(/\.?0+$/, '');
}
chart.applyOptions({ localization: { priceFormatter: formatPrice } });

/* =============== Demo OHLCV =============== */
const rawData = [
  { time: 1755129600, open: 0.00, high: 100.60, low:  99.59, close: 100.56, volume: 300.89 },
  { time: 1755133200, open: 100.56, high: 102.52, low:  99.22, close: 101.50, volume: 178.24 },
  { time: 1755136800, open: 101.50, high: 101.55, low: 100.86, close: 101.19, volume: 554.82 },
  { time: 1755140400, open: 101.19, high: 101.49, low:  98.32, close:  99.30, volume: 590.45 },
  { time: 1755144000, open:  99.30, high: 100.18, low:  96.97, close:  98.18, volume: 105.85 },
  { time: 1755147600, open:  98.18, high: 100.45, low:  97.67, close:  99.40, volume: 239.93 },
  { time: 1755151200, open:  99.40, high: 101.74, low:  99.26, close: 101.23, volume: 187.04 },
  { time: 1755154800, open: 101.23, high: 103.53, low: 100.02, close: 102.62, volume: 756.76 },
  { time: 1755158400, open: 102.62, high: 104.23, low: 102.05, close: 102.77, volume: 596.84 },
  { time: 1755162000, open: 102.77, high: 105.01, low: 101.47, close: 104.08, volume: 619.62 },
  { time: 1755165600, open: 104.08, high: 104.97, low: 103.74, close: 104.90, volume: 360.45 },
  { time: 1755169200, open: 104.90, high: 105.25, low: 103.07, close: 103.22, volume: 350.18 },
  { time: 1755172800, open: 103.22, high: 104.31, low: 102.67, close: 103.76, volume: 288.56 },
  { time: 1755176400, open: 103.76, high: 105.17, low: 101.86, close: 102.83, volume: 648.22 },
  { time: 1755180000, open: 102.83, high: 103.93, low: 101.27, close: 101.52, volume: 441.51 },
  { time: 1755183600, open: 101.52, high: 104.43, low: 100.68, close: 103.47, volume: 716.15 },
  { time: 1755187200, open: 103.47, high: 106.01, low: 103.13, close: 104.85, volume: 128.89 },
  { time: 1755190800, open: 104.85, high: 105.25, low: 103.79, close: 104.11, volume: 948.62 },
  { time: 1755194400, open: 104.11, high: 106.09, low: 103.12, close: 105.61, volume: 456.07 },
  { time: 1755198000, open: 105.61, high: 107.96, low: 105.22, close: 107.27, volume: 321.96 },
  { time: 1755201600, open: 107.27, high: 107.91, low: 106.39, close: 107.52, volume: 908.04 },
  { time: 1755205200, open: 107.52, high: 107.85, low: 105.62, close: 107.11, volume: 558.57 },
  { time: 1755208800, open: 107.11, high: 107.19, low: 105.31, close: 105.48, volume: 664.70 },
  { time: 1755212400, open: 105.48, high: 107.28, low: 105.38, close: 106.65, volume: 443.46 },
  { time: 1755216000, open: 106.65, high: 109.42, low: 105.19, close: 108.63, volume: 874.70 },
  { time: 1755219600, open: 108.63, high: 109.71, low: 105.65, close: 106.68, volume: 583.27 },
  { time: 1755223200, open: 106.68, high: 107.64, low: 105.58, close: 105.74, volume: 491.29 },
  { time: 1755226800, open: 105.74, high: 107.17, low: 104.25, close: 105.56, volume: 337.05 },
  { time: 1755230400, open: 105.56, high: 105.83, low: 104.19, close: 105.56, volume: 883.47 },
  { time: 1755234000, open: 105.56, high: 106.52, low: 103.84, close: 104.76, volume: 237.56 },
  { time: 1755237600, open: 104.76, high: 106.61, low: 103.59, close: 105.81, volume: 577.32 },
  { time: 1755241200, open: 105.81, high: 106.29, low: 103.78, close: 103.81, volume: 936.19 },
  { time: 1755244800, open: 103.81, high: 106.57, low: 103.35, close: 105.32, volume: 152.13 },
  { time: 1755248400, open: 105.32, high: 108.25, low: 105.19, close: 106.83, volume: 537.39 },
  { time: 1755252000, open: 106.83, high: 107.98, low: 103.96, close: 105.11, volume: 215.55 },
  { time: 1755255600, open: 105.11, high: 105.94, low: 104.61, close: 105.01, volume: 885.19 },
  { time: 1755259200, open: 105.01, high: 105.33, low: 103.90, close: 104.71, volume: 756.94 },
  { time: 1755262800, open: 104.71, high: 105.17, low: 102.02, close: 103.51, volume: 684.89 },
  { time: 1755266400, open: 103.51, high: 104.29, low: 103.08, close: 103.26, volume: 302.23 },
  { time: 1755270000, open: 103.26, high: 104.14, low: 102.27, close: 102.61, volume: 298.20 },
  { time: 1755273600, open: 102.61, high: 103.56, low: 100.55, close: 100.90, volume: 914.88 },
  { time: 1755277200, open: 100.90, high: 102.44, low: 100.54, close: 102.34, volume: 702.08 },
  { time: 1755280800, open: 102.34, high: 102.54, low:  99.79, close: 101.19, volume: 613.94 },
  { time: 1755284400, open: 101.19, high: 102.37, low:  99.87, close: 101.08, volume: 271.37 },
  { time: 1755288000, open: 101.08, high: 101.73, low:  98.84, close:  99.47, volume: 520.32 },
  { time: 1755291600, open:  99.47, high: 101.40, low:  98.00, close: 100.39, volume: 188.58 },
  { time: 1755295200, open: 100.39, high: 100.90, low:  98.71, close: 100.00, volume: 323.79 },
  { time: 1755298800, open: 100.00, high: 100.67, low:  98.13, close:  98.76, volume: 350.69 },
  { time: 1755302400, open:  98.76, high: 100.14, low:  97.09, close:  97.76, volume: 875.21 },
];

const candles = rawData.map(({ time, open, high, low, close }) => ({ time, open, high, low, close }));
const closes  = rawData.map(({ time, close }) => ({ time, value: close }));
const volumes = rawData.map(({ time, open, close, volume }) => ({
  time, value: volume, color: close >= open ? 'rgba(52,199,89,0.5)' : 'rgba(225,50,50,0.5)',
}));


/* =============== Series =============== */
// Candlesticks (no top-right labels or price line)
const candleSeries = chart.addCandlestickSeries({
  upColor: '#34c759', downColor: '#e13232',
  borderUpColor: '#34c759', borderDownColor: '#e13232',
  wickUpColor: '#34c759', wickDownColor: '#e13232',
  lastValueVisible: false,
  priceLineVisible: false,
  priceFormat: { type: 'price', minMove: 0.00000001, precision: 8 },
});
candleSeries.setData(candles);

// Baseline Line (single series, auto color flip above/below baseValue)
// --- PATCH: enable gradient fills above/below baseline ---
const lineSeries = chart.addBaselineSeries({
  baseValue: { type: 'price', price: candles[0].open },
  topLineColor: '#34c759',             // lime
  bottomLineColor: '#e13232',          // maroon-ish
  topFillColor1: 'rgba(52,199,89,0.75)',
  topFillColor2: 'rgba(52,199,89,0.00)',
  bottomFillColor1: 'rgba(225,50,50,0.00)',
  bottomFillColor2: 'rgba(225,50,50,0.75)',
  lastValueVisible: false,
  priceLineVisible: false,
  priceFormat: { type: 'price', minMove: 0.00000001, precision: 8 },
});

lineSeries.setData(closes);

// Volume
const volumeSeries = chart.addHistogramSeries({
  priceScaleId: '',
  priceFormat: { type: 'volume' },
  lastValueVisible: false,   // <- hide last value marker
  priceLineVisible: false,   // <- hide price line
});

volumeSeries.priceScale().applyOptions({
  scaleMargins: { top: 0.80, bottom: 0.00 },
  borderColor: 'rgba(255,255,255,0.1)',
});
volumeSeries.setData(volumes);

// --- PATCH: OHLCV info panel (hovered or last bar) ---
const infoEl = document.getElementById('bar-info');

function fmtUSD(n) {
  if (n == null) return '-';
  const a = Math.abs(n);
  if (a >= 1e12) return (n/1e12).toFixed(2)+'T';
  if (a >= 1e9)  return (n/1e9 ).toFixed(2)+'B';
  if (a >= 1e6)  return (n/1e6 ).toFixed(2)+'M';
  if (a >= 1e3)  return (n/1e3 ).toFixed(2)+'K';
  return n.toFixed(2);
}

function renderInfo(bar) {
  if (!bar) return;
  // Detect bullish / bearish / neutral
  let color = '#ffffff'; // default neutral
  if (bar.open != null && bar.close != null) {
    color = bar.close >= bar.open ? '#34c759' : '#e13232'; // lime vs red
  }
  const volBar = volumes.find(v => v.time === bar.time);
  
  infoEl.innerHTML = `
    <div style="color:${color};"><strong style="color:white;">O</strong> ${formatPrice(bar.open ?? bar.value)}, <strong style="color:white;">H</strong> ${formatPrice(bar.high ?? bar.value)}, <strong style="color:white;">L</strong> ${formatPrice(bar.low  ?? bar.value)}, <strong style="color:white;">C</strong> ${formatPrice(bar.close ?? bar.value)}, <strong style="color:white;">Vol</strong> $${volBar ? fmtUSD(volBar.value) : '-'}</div>
  `;
}

// update on crosshair
chart.subscribeCrosshairMove(param => {
  const t = param?.time;
  if (t == null) {
    // no crosshair: show last bar (candles preferred, fallback to line)
    const last = candles[candles.length - 1] || (closes.length && { ...closes[closes.length-1], open:null, high:null, low:null, close: closes[closes.length-1].value });
    renderInfo(last);
    return;
  }
  // prefer candle at time t, fallback to line point mapped to candle shape
  const bar = candles.find(b => b.time === t) 
    || (closes.find(p => p.time === t) && { 
          time: t, 
          open: null, high: null, low: null, close: (closes.find(p => p.time === t) || {}).value 
        });
  renderInfo(bar);
});

// initial paint
renderInfo(candles[candles.length - 1]);


/* =============== Mode switching (separate series) =============== */
let mode = 'candlestick'; // 'candlestick' | 'line'

function showCandles() {
  mode = 'candlestick';
  candleSeries.applyOptions({ visible: true });
  lineSeries.applyOptions({ visible: false });
  ensureBaselinePriceLine('candlestick');
  chart.timeScale().fitContent();
  recomputeBaselineFromFirstVisible();
}

function showLine() {
  mode = 'line';
  lineSeries.applyOptions({ visible: true });
  candleSeries.applyOptions({ visible: false });
  ensureBaselinePriceLine('line');
  chart.timeScale().fitContent();
  recomputeBaselineFromFirstVisible();
}

let baselineGuideCandles = null;
let baselineGuideLine    = null;

// baseline guide line shows axis label + title ---
function createGuideLineOn(series, price) {
  return series.createPriceLine({
    price,
    color: '#ffffff',
    lineWidth: 1,
    lineStyle: LightweightCharts.LineStyle.Dotted,
    axisLabelVisible: true,
  });
}


function ensureBaselinePriceLine(modeNow) {
  // Remove both, then recreate only on the active series
  if (baselineGuideCandles) {
    candleSeries.removePriceLine(baselineGuideCandles);
    baselineGuideCandles = null;
  }
  if (baselineGuideLine) {
    lineSeries.removePriceLine(baselineGuideLine);
    baselineGuideLine = null;
  }
  // Current baseline (first visible open). Fallback to first candle if not computed yet.
  const vr = chart.timeScale().getVisibleRange();
  let basePrice = candles[0].open;
  if (vr && vr.from != null) {
    const idx = Math.min(lowerBoundByTime(candles, vr.from), candles.length - 1);
    basePrice = (candles[idx] || candles[0]).open;
  }

  if (modeNow === 'candlestick') {
    baselineGuideCandles = createGuideLineOn(candleSeries, basePrice);
  } else {
    baselineGuideLine = createGuideLineOn(lineSeries, basePrice);
  }
}

// Hook up external radios if present
document.querySelectorAll('input[name="chartType"]')?.forEach(r => {
  r.addEventListener('change', () => {
    if (!r.checked) return;
    if (r.value === 'candlestick') showCandles();
    else showLine();
  });
});

/* =============== Dynamic baseline = first visible candle's OPEN =============== */
function lowerBoundByTime(arr, t) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid].time < t) lo = mid + 1; else hi = mid;
  }
  return lo;
}

let raf = 0;
function recomputeBaselineFromFirstVisible() {
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    const vr = chart.timeScale().getVisibleRange();
    if (!vr || vr.from == null) return;

    const idx = Math.min(lowerBoundByTime(candles, vr.from), candles.length - 1);
    const first = candles[idx];
    if (!first) return;

    const p = first.open;

    // Flip colors in BaselineSeries
    lineSeries.applyOptions({ baseValue: { type: 'price', price: p } });

    // Recreate the white guide on the active series
    if (mode === 'candlestick') {
      if (baselineGuideCandles) candleSeries.removePriceLine(baselineGuideCandles);
      baselineGuideCandles = createGuideLineOn(candleSeries, p);
    } else {
      if (baselineGuideLine) lineSeries.removePriceLine(baselineGuideLine);
      baselineGuideLine = createGuideLineOn(lineSeries, p);
    }
  });
}


// Recompute baseline whenever the visible range changes
chart.timeScale().subscribeVisibleTimeRangeChange(recomputeBaselineFromFirstVisible);

/* =============== Timeframe simulation (optional) =============== */
document.querySelectorAll('#timeframes button')?.forEach(btn => {
  btn.addEventListener('click', () => {
    const tf = btn.dataset.tf;
    let hours = 24;
    switch (tf) {
      case '1m':  hours = 0.5; break;
      case '5m':  hours = 2; break;
      case '15m': hours = 6; break;
      case '30m': hours = 12; break;
      case '1h':  hours = 24; break;
      case '2h':  hours = 48; break;
      case '6h':  hours = 24*7; break;
      case '12h': hours = 24*14; break;
      case '24h': hours = 24*30; break;
    }
    const end = rawData[rawData.length - 1].time;
    chart.timeScale().setVisibleRange({ from: end - Math.round(hours * 3600), to: end });
    recomputeBaselineFromFirstVisible();
  });
});

/* =============== Toggles (optional) =============== */
document.getElementById('toggleVolume')?.addEventListener('change', (e) => {
  const visible = e.target.checked;
  volumeSeries.applyOptions({ visible });
  volumeSeries.priceScale().applyOptions({
    scaleMargins: visible ? { top: 0.80, bottom: 0.00 } : { top: 0.00, bottom: 0.00 },
  });
});
document.getElementById('toggleGrid')?.addEventListener('change', (e) => {
  const vis = e.target.checked;
  chart.applyOptions({ grid: { vertLines: { visible: vis }, horzLines: { visible: vis } } });
});
document.getElementById('toggleCrosshairLabels')?.addEventListener('change', (e) => {
  const show = e.target.checked;
  chart.applyOptions({ crosshair: { vertLine: { labelVisible: show }, horzLine: { labelVisible: show } } });
});
document.querySelectorAll('input[name="crosshairMode"]')?.forEach(r => {
  r.addEventListener('change', () => {
    if (!r.checked) return;
    chart.applyOptions({
      crosshair: {
        mode: r.value === 'magnet'
          ? LightweightCharts.CrosshairMode.Magnet
          : LightweightCharts.CrosshairMode.Normal,
      },
    });
  });
});

/* =============== Resize =============== */
window.addEventListener('resize', () => {
  chart.applyOptions({ width: root.clientWidth, height: root.clientHeight });
  recomputeBaselineFromFirstVisible();
});

/* =============== Boot =============== */
candleSeries.setData(candles);
lineSeries.setData(closes);
showCandles();                  // default mode
chart.timeScale().fitContent();
recomputeBaselineFromFirstVisible();
```