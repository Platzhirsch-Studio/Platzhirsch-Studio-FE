import {createNavigation} from 'next-intl/navigation';
import {routing} from './config';
// Tempo fix2: Link mit Prefetch-Tor (./GatedLink.js, src/lib/prefetchGate.js).
import GatedLink from './GatedLink';

export const {redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);
export const Link = GatedLink;
