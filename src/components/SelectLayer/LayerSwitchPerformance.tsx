import React, { useState, useEffect, useRef } from 'react';

interface PerformanceMetrics {
  totalSwitches: number;
  averageSwitchTime: number;
  fastestSwitch: number;
  slowestSwitch: number;
  lastSwitchTime: number;
}

export const LayerSwitchPerformance: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalSwitches: 0,
    averageSwitchTime: 0,
    fastestSwitch: Infinity,
    slowestSwitch: 0,
    lastSwitchTime: 0
  });

  const switchTimesRef = useRef<number[]>([]);
  const isVisible = process.env.NODE_ENV === 'development';

  // Listen for layer switch events
  useEffect(() => {
    const handleLayerSwitch = (event: CustomEvent) => {
      const { switchTime, layerType } = event.detail;
      
      if (switchTime) {
        switchTimesRef.current.push(switchTime);
        
        const newMetrics = {
          totalSwitches: switchTimesRef.current.length,
          averageSwitchTime: switchTimesRef.current.reduce((a, b) => a + b, 0) / switchTimesRef.current.length,
          fastestSwitch: Math.min(...switchTimesRef.current),
          slowestSwitch: Math.max(...switchTimesRef.current),
          lastSwitchTime: switchTime
        };
        
        setMetrics(newMetrics);
        
        console.log(`Layer switch performance: ${layerType} took ${switchTime}ms`);
      }
    };

    window.addEventListener('layerSwitch', handleLayerSwitch as EventListener);
    
    return () => {
      window.removeEventListener('layerSwitch', handleLayerSwitch as EventListener);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      minWidth: '200px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
        Layer Switch Performance
      </div>
      <div>Total Switches: {metrics.totalSwitches}</div>
      <div>Average: {metrics.averageSwitchTime.toFixed(1)}ms</div>
      <div>Fastest: {metrics.fastestSwitch === Infinity ? 'N/A' : `${metrics.fastestSwitch}ms`}</div>
      <div>Slowest: {metrics.slowestSwitch}ms</div>
      <div>Last: {metrics.lastSwitchTime}ms</div>
      
      {metrics.lastSwitchTime > 0 && (
        <div style={{ 
          marginTop: '5px', 
          color: metrics.lastSwitchTime < 100 ? '#4CAF50' : metrics.lastSwitchTime < 300 ? '#FF9800' : '#F44336' 
        }}>
          {metrics.lastSwitchTime < 100 ? '⚡ Ultra Fast' : 
           metrics.lastSwitchTime < 300 ? '🚀 Fast' : '🐌 Slow'}
        </div>
      )}
    </div>
  );
};

// Utility function to dispatch performance events
export const trackLayerSwitch = (layerType: string, startTime: number) => {
  const endTime = performance.now();
  const switchTime = endTime - startTime;
  
  window.dispatchEvent(new CustomEvent('layerSwitch', {
    detail: { switchTime, layerType }
  }));
}; 