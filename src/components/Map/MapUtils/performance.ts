interface PerformanceMetrics {
  layerSwitchTime: number;
  styleLoadTime: number;
  cacheHit: boolean;
  error?: string;
}

class MapPerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private isEnabled: boolean = process.env.NODE_ENV === 'development';

  startTimer(): number {
    return this.isEnabled ? performance.now() : 0;
  }

  endTimer(startTime: number): number {
    return this.isEnabled ? performance.now() - startTime : 0;
  }

  recordLayerSwitch(metrics: Partial<PerformanceMetrics>) {
    if (!this.isEnabled) return;

    this.metrics.push({
      layerSwitchTime: 0,
      styleLoadTime: 0,
      cacheHit: false,
      ...metrics
    });

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Log performance data in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Map Layer Switch Performance:', metrics);
    }
  }

  getAverageSwitchTime(): number {
    if (this.metrics.length === 0) return 0;
    
    const totalTime = this.metrics.reduce((sum, metric) => sum + metric.layerSwitchTime, 0);
    return totalTime / this.metrics.length;
  }

  getCacheHitRate(): number {
    if (this.metrics.length === 0) return 0;
    
    const cacheHits = this.metrics.filter(metric => metric.cacheHit).length;
    return cacheHits / this.metrics.length;
  }

  getRecentMetrics(count: number = 10): PerformanceMetrics[] {
    return this.metrics.slice(-count);
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }
}

export const mapPerformanceMonitor = new MapPerformanceMonitor(); 