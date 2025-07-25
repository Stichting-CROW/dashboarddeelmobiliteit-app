import React, { useState } from 'react';
import { useUnifiedLayerManager } from '../../hooks/useUnifiedLayerManager';

export const LayerSwitchTest: React.FC = () => {
  const layerManager = useUnifiedLayerManager();
const { setBaseLayer, currentState, isSwitching } = layerManager;
const currentMapStyle = currentState.baseLayer;
  const [testResults, setTestResults] = useState<Array<{ operation: string; time: number }>>([]);

  const runPerformanceTest = async () => {
    const results: Array<{ operation: string; time: number }> = [];
    
    // Test base layer switching
    const layers: Array<'base' | 'satellite' | 'hybrid'> = ['base', 'satellite', 'hybrid'];
    
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const nextLayer = layers[(i + 1) % layers.length];
      
      const startTime = performance.now();
      setBaseLayer(nextLayer);
      
      // Wait a bit for the switch to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const endTime = performance.now();
      const switchTime = endTime - startTime;
      
      results.push({
        operation: `${layer} → ${nextLayer}`,
        time: switchTime
      });
    }
    
    setTestResults(results);
  };

  const getPerformanceColor = (time: number) => {
    if (time < 100) return '#4CAF50'; // Green - Excellent
    if (time < 300) return '#FF9800'; // Orange - Good
    return '#F44336'; // Red - Poor
  };

  const getPerformanceLabel = (time: number) => {
    if (time < 100) return '⚡ Ultra Fast';
    if (time < 300) return '🚀 Fast';
    return '🐌 Slow';
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '14px',
      fontFamily: 'monospace',
      zIndex: 9999,
      minWidth: '300px',
      maxWidth: '400px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '16px' }}>
        Layer Switch Performance Test
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Current:</strong> {currentMapStyle}
        {isSwitching && <span style={{ color: '#FF9800', marginLeft: '10px' }}>🔄 Switching...</span>}
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <button
          onClick={runPerformanceTest}
          disabled={isSwitching}
          style={{
            background: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: isSwitching ? 'wait' : 'pointer',
            opacity: isSwitching ? 0.6 : 1
          }}
        >
          Run Performance Test
        </button>
      </div>
      
      {testResults.length > 0 && (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Test Results:</div>
          {testResults.map((result, index) => (
            <div key={index} style={{ 
              marginBottom: '5px',
              padding: '5px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '3px'
            }}>
              <div style={{ color: getPerformanceColor(result.time) }}>
                {result.operation}: {result.time.toFixed(1)}ms {getPerformanceLabel(result.time)}
              </div>
            </div>
          ))}
          
          <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px' }}>
            <strong>Average:</strong> {(testResults.reduce((sum, r) => sum + r.time, 0) / testResults.length).toFixed(1)}ms
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '15px', fontSize: '12px', opacity: 0.8 }}>
        <div>⚡ &lt; 100ms: Excellent</div>
        <div>🚀 &lt; 300ms: Good</div>
        <div>🐌 &gt; 300ms: Needs improvement</div>
      </div>
    </div>
  );
}; 