import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

export default getRequestConfig(async ({locale}) => {
  if (!routing.locales.includes(locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    timeZone: 'Europe/Vienna',
    messages: (await import(`../messages/${locale}.json`)).default
  };
});