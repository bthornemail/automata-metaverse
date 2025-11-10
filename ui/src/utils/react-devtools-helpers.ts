/**
 * React DevTools Helper Utilities
 * Provides debugging utilities and component metadata for React DevTools inspection
 */

/**
 * Set display name for React components (helps in React DevTools)
 */
export function setComponentDisplayName(component: React.ComponentType<any>, displayName: string): void {
  if (component) {
    component.displayName = displayName;
  }
}

/**
 * Log component props for React DevTools inspection
 */
export function logComponentProps(componentName: string, props: Record<string, any>): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[React DevTools] ${componentName} props:`, props);
  }
}

/**
 * Log component state for React DevTools inspection
 */
export function logComponentState(componentName: string, state: Record<string, any>): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[React DevTools] ${componentName} state:`, state);
  }
}

/**
 * Create a React DevTools-friendly component wrapper
 */
export function withDevToolsDisplayName<P extends object>(
  Component: React.ComponentType<P>,
  displayName: string
): React.ComponentType<P> {
  const WrappedComponent = Component as React.ComponentType<P> & { displayName?: string };
  WrappedComponent.displayName = displayName;
  return WrappedComponent;
}

/**
 * Debug hook for React DevTools - logs component lifecycle
 */
export function useDevToolsDebug(componentName: string, props?: Record<string, any>, state?: Record<string, any>): void {
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[React DevTools] ${componentName} mounted`, { props, state });
      return () => {
        console.log(`[React DevTools] ${componentName} unmounted`);
      };
    }
  }, [componentName]);
  
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && props) {
      console.log(`[React DevTools] ${componentName} props updated:`, props);
    }
  }, [componentName, props]);
  
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && state) {
      console.log(`[React DevTools] ${componentName} state updated:`, state);
    }
  }, [componentName, state]);
}

// Re-export React for type checking
import React from 'react';
