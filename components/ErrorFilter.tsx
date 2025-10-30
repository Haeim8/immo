'use client';

import { useEffect } from 'react';

export default function ErrorFilter() {
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const errorString = args.join(' ');
      // Filter out analytics and adblocker errors
      if (
        errorString.includes('ERR_BLOCKED_BY_ADBLOCKER') ||
        errorString.includes('Analytics SDK') ||
        errorString.includes('cca-lite.coinbase.com') ||
        (errorString.includes('Failed to fetch') && errorString.includes('metrics'))
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return null;
}
