import type { Metric } from 'web-vitals';
import { logger } from './logger';

function sendToAnalytics(metric: Metric) {
  logger.info('web-vital', {
    metric: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
  });
}

export async function initWebVitals() {
  if (typeof window === 'undefined') return;

  const { onCLS, onINP, onLCP, onTTFB, onFCP } = await import('web-vitals');

  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
  onFCP(sendToAnalytics);
}
