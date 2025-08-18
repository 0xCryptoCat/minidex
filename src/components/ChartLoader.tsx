import { useEffect, useRef } from 'react';
import lottie from 'lottie-web';

interface Props {
  message?: string;
  className?: string;
}

export default function ChartLoader({ message = 'Loading chart...', className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Load the logo animation
    animationRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/logo_animation.json',
    });

    return () => {
      if (animationRef.current) {
        animationRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className={`chart-loader ${className}`}>
      <div className="chart-loader-content">
        <div 
          ref={containerRef} 
          className="chart-loader-animation"
          style={{
            width: '80px',
            height: '80px',
          }}
        />
        <div className="chart-loader-text">{message}</div>
      </div>
    </div>
  );
}
