import { useState, useEffect } from 'react';
import { ElectricBolt, MobileFriendly, Polyline, AutoAwesome, Verified } from '@mui/icons-material';
import './FeatureCarousel.css';
import iconsData from '../lib/icons-data.json';

const features = [
	/* {
		title: 'Multi-chain',
		description: 'Access tokens on multiple chains.',
	}, */
	{
		icon: <ElectricBolt style={{ fontSize: '2em' }} />,
		title: 'Real-Time Data',
		description: 'Streaming trades, prices, and analytics.',
	},
	{
		icon: <Polyline style={{ fontSize: '2em' }} />,
		title: 'Multi-chain',
		description: 'Support for all major networks.',
	},
	{
		icon: <MobileFriendly style={{ fontSize: '2em' }} />,
		title: 'Mobile First',
		description: 'Seamless experience on any device.',
	},
	/* {
		icon: <AutoAwesome style={{ fontSize: '2em' }} />,
		title: 'AI-Powered Insights',
		description: 'Get alpha with our predictive analytics.',
	}, */
	{
		icon: <Verified style={{ fontSize: '2em' }} />,
		title: 'Trusted Sources',
		description: 'Aggregated data from top-tier providers.',
	},
];

export default function FeatureCarousel() {
	const [activeIndex, setActiveIndex] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setActiveIndex((prevIndex) => (prevIndex + 1) % features.length);
		}, 5000); // Change slide every 5 seconds

		return () => clearInterval(interval);
	}, []);

	return (
		<div className="feature-carousel">
			<div
				className="carousel-inner"
				style={{ transform: `translateX(-${activeIndex * 100}%)` }}
			>
				{features.map((feature, index) => (
					<div className="carousel-item" key={index}>
						<div className="feature-card">
							{feature.title === 'Multi-chain' ? (
								<FloatingCoins />
							) : (
								<div className="feature-icon">{feature.icon}</div>
							)}
							<h3 className="feature-title">{feature.title}</h3>
							<p className="feature-description">{feature.description}</p>
						</div>
					</div>
				))}
			</div>
			<div className="carousel-dots">
				{features.map((_, index) => (
					<span
						key={index}
						className={`dot ${activeIndex === index ? 'active' : ''}`}
						onClick={() => setActiveIndex(index)}
					/>
				))}
			</div>
		</div>
	);
}

function FloatingCoins() {
	const [coins, setCoins] = useState<{ src: string; style: React.CSSProperties }[]>([]);

	useEffect(() => {
		const allIcons = Object.values((iconsData as any).chains) as string[];
		const selectedIcons: { src: string; style: React.CSSProperties }[] = [];
		const usedIcons = new Set();

		for (let i = 0; i < 6; i++) {
			let randomIndex;
			let iconUrl;
			do {
				randomIndex = Math.floor(Math.random() * allIcons.length);
				iconUrl = allIcons[randomIndex];
			} while (usedIcons.has(iconUrl));
			usedIcons.add(iconUrl);

			const rotX = Math.random() - 0.5;
			const rotY = Math.random() - 0.5;
			const angle = Math.random() * 60;

			// Normalize the rotation vector to calculate shadow direction
			const len = Math.sqrt(rotX * rotX + rotY * rotY);
			const normX = rotX / len;
			const normY = rotY / len;

			const shadowStrength = 4;
			// Shadow direction is perpendicular to the rotation axis
			const shadowX = -normY * shadowStrength;
			const shadowY = normX * shadowStrength;

			selectedIcons.push({
				src: iconUrl,
				style: {
					position: 'absolute',
					top: `${Math.random() * 80}%`,
					left: `${Math.random() * 80}%`,
					width: `${30 + Math.random() * 30}px`,
					height: `${30 + Math.random() * 30}px`,
					borderRadius: '50%',
					transform: `rotate3d(${rotX}, ${rotY}, 0, ${angle}deg)`,
					boxShadow: `${shadowX}px ${shadowY}px 0px #ffffff`,
				},
			});
		}
		setCoins(selectedIcons);
	}, []);

	return (
		<div className="floating-coins-container">
			{coins.map((coin, index) => (
				<img key={index} src={coin.src} style={coin.style} alt="chain icon" className="floating-coin" />
			))}
		</div>
	);
}