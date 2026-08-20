'use client';

import { useEffect, useState } from 'react';

export default function ClientLayout({ children }) {
  const [locale, setLocale] = useState('de');

  useEffect(() => {
    // Get locale from cookie
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };

    // Get from cookie or localStorage
    const cookieLocale = getCookie('NEXT_LOCALE');
    const storageLocale = localStorage.getItem('preferredLocale');
    const detectedLocale = cookieLocale || storageLocale || 'de';
    
    setLocale(detectedLocale);

    // Update HTML lang attribute
    document.documentElement.lang = detectedLocale;
  }, []);

  // Also listen for cookie changes
  useEffect(() => {
    const handleCookieChange = () => {
      const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
      };

      const cookieLocale = getCookie('NEXT_LOCALE');
      const storageLocale = localStorage.getItem('preferredLocale');
      const detectedLocale = cookieLocale || storageLocale || 'de';
      
      setLocale(detectedLocale);
      document.documentElement.lang = detectedLocale;
    };

    // Check for changes every 500ms (optional)
    const interval = setInterval(handleCookieChange, 500);

    // Also listen for storage events
    window.addEventListener('storage', handleCookieChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleCookieChange);
    };
  }, []);

  return <>{children}</>;
}