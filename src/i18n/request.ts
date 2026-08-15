import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !['pt-BR', 'en'].includes(locale)) {
    locale = 'pt-BR';
  }

  return {
    locale,
    messages: (await import(`../locales/${locale}.json`)).default,
  };
});
