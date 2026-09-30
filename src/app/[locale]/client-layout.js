'use client';

import { useEffect } from 'react';
import Navbar from '@/components/Navbar/navbar';
import BeforeFooter from '@/components/Reusable/Footer';
import CookieComponent from '@/components/Cookies/cookiecomponent';
import VernissagePopup from '@/components/Home/vernissagePopup';
import { CartProvider } from '@/context/CartContext';
import '../globals.css';
import RouteLoader from '@/components/Loader/RouteLoader';

export default function ClientLayout({ children, activeCategoryKeys }) {
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <CartProvider>
      <RouteLoader />
      <Navbar activeCategoryKeys={activeCategoryKeys} />
      <main>
        {children}
        <BeforeFooter />
        <CookieComponent />
        <VernissagePopup />
      </main>
    </CartProvider>
  );
}