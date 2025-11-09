/**
 * Sentry Error Tracking
 * 
 * Configures Sentry for error tracking and performance monitoring
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

/**
 * Initialize Sentry
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';

  if (!dsn) {
    console.warn('⚠️  Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    
    // Performance monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Profiling
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    integrations: [
      // Profiling integration
      nodeProfilingIntegration(),
      
      // HTTP integration (automatically included in v10)
      // Express integration (automatically included in v10)
    ],

    // Release tracking
    release: process.env.SENTRY_RELEASE || undefined,

    // Filter out health checks and other noise
    beforeSend(event, hint) {
      // Filter out health check endpoints
      if (event.request?.url?.includes('/health')) {
        return null;
      }
      
      // Filter out 404s for static assets
      if (event.exception && event.exception.values) {
        const error = event.exception.values[0];
        if (error?.value?.includes('ENOENT') && event.request?.url?.match(/\.(js|css|png|jpg|svg)$/)) {
          return null;
        }
      }
      
      return event;
    },
  });

  console.log('✅ Sentry initialized for error tracking');
}

/**
 * Capture exception
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Capture message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context
 */
export function setUser(user: { id: string; email?: string; username?: string }): void {
  Sentry.setUser(user);
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  Sentry.addBreadcrumb(breadcrumb);
}
