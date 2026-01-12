// Performance monitoring utilities for analytics components

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
  }

  // Start timing a performance metric
  startTiming(name) {
    this.metrics.set(name, {
      startTime: performance.now(),
      endTime: null,
      duration: null
    });
  }

  // End timing a performance metric
  endTiming(name) {
    const metric = this.metrics.get(name);
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      
      // Log performance in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Performance: ${name} took ${metric.duration.toFixed(2)}ms`);
      }
      
      return metric.duration;
    }
    return null;
  }

  // Measure component render time
  measureRender(componentName, renderFunction) {
    this.startTiming(`${componentName}-render`);
    const result = renderFunction();
    this.endTiming(`${componentName}-render`);
    return result;
  }

  // Monitor memory usage
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
      };
    }
    return null;
  }

  // Monitor long tasks
  observeLongTasks(callback) {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            callback(entry);
          }
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', observer);
    }
  }

  // Monitor layout shifts
  observeLayoutShifts(callback) {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.value > 0.1) { // Significant layout shift
            callback(entry);
          }
        }
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('layout-shift', observer);
    }
  }

  // Monitor first contentful paint
  observeFirstContentfulPaint(callback) {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            callback(entry);
          }
        }
      });
      
      observer.observe({ entryTypes: ['paint'] });
      this.observers.set('first-contentful-paint', observer);
    }
  }

  // Get all performance metrics
  getMetrics() {
    const metrics = {};
    for (const [name, metric] of this.metrics) {
      metrics[name] = metric;
    }
    return metrics;
  }

  // Clear all metrics
  clearMetrics() {
    this.metrics.clear();
  }

  // Disconnect all observers
  disconnect() {
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
  }

  // Get performance report
  getReport() {
    const memory = this.getMemoryUsage();
    const metrics = this.getMetrics();
    
    return {
      memory,
      metrics,
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export const usePerformanceMonitor = (componentName) => {
  const startRender = () => {
    performanceMonitor.startTiming(`${componentName}-render`);
  };

  const endRender = () => {
    performanceMonitor.endTiming(`${componentName}-render`);
  };

  const measureAsync = async (operationName, asyncFunction) => {
    performanceMonitor.startTiming(`${componentName}-${operationName}`);
    try {
      const result = await asyncFunction();
      performanceMonitor.endTiming(`${componentName}-${operationName}`);
      return result;
    } catch (error) {
      performanceMonitor.endTiming(`${componentName}-${operationName}`);
      throw error;
    }
  };

  return {
    startRender,
    endRender,
    measureAsync,
    getMemoryUsage: () => performanceMonitor.getMemoryUsage(),
    getReport: () => performanceMonitor.getReport()
  };
};

export default performanceMonitor;