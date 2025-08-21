import './TechStack.css';

const tech = [
  { name: 'TradingView', src: '../icons/tradingview.svg', url: 'https://www.tradingview.com/' },
  { name: 'GeckoTerminal', src: '../icons/gecko.svg', url: 'https://www.geckoterminal.com/' },
  { name: 'DEX Screener', src: '../icons/dexscreener.svg', url: 'https://dexscreener.com/' },
  { name: 'GoPlus Security', src: '../icons/goplus.svg', url: 'https://gopluslabs.io/' },
  { name: 'HoneyPot.is', src: '../icons/honeypotis.svg', url: 'https://honeypot.is/' },
];

export default function TechStack() {
  return (
    <div className="tech-stack-container">
      <h4 className="tech-stack-title">Powered By</h4>
      <div className="tech-stack-logos">
        {tech.map((t) => (
          <a href={t.url} key={t.name} target="_blank" rel="noopener noreferrer" title={t.name}>
            <img src={t.src} alt={t.name} className="tech-logo" />
          </a>
        ))}
      </div>
    </div>
  );
}
