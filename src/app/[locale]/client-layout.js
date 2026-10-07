'use client';

import Navbar from '@/components/Navbar/navbar';
import BeforeFooter from '@/components/Reusable/Footer';
import CookieComponent from '@/components/Cookies/cookiecomponent';
import MobileCtaBar from '@/components/Reusable/MobileCtaBar';
import { CartProvider } from '@/context/CartContext';
import '../globals.css';

// Page shell. The footer and the consent bar sit OUTSIDE <main> so the
// footer is exposed as its own landmark and <main> holds page content only.
// Browser scroll restoration is left on (a former `scrollRestoration = "manual"`
// + scrollTo(0,0) made Back land at the top of every catalogue page).
// The event popup (Home/vernissagePopup.js) was removed from the shell: its
// last show date (2026-09-04) has passed, so it only cost bundle size — mount
// it again here for the next event.
export default function ClientLayout({ children, activeCategoryKeys }) {
  return (
    <CartProvider>
      <Navbar activeCategoryKeys={activeCategoryKeys} />
      {/* overflow-x-clip: entrance transforms (FadeInView) must never widen the
          mobile layout viewport; clip (not hidden) keeps sticky/anchor behaviour. */}
      <main id="main" className="overflow-x-clip">{children}</main>
      <BeforeFooter />
      <MobileCtaBar />
      <CookieComponent />
    </CartProvider>
  );
}
