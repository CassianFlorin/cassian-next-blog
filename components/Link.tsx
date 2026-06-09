/* eslint-disable jsx-a11y/anchor-has-content */
'use client';

import Link from 'next/link';
import type { LinkProps } from 'next/link';
import { useParams } from 'next/navigation';
import { AnchorHTMLAttributes } from 'react';
import {
  defaultLocale,
  isLocale,
  locales,
  type Locale,
} from '@/lib/i18nRouting';

const localePrefixes = locales.map((locale) => `/${locale}`);

function withLocalePrefix(href: LinkProps['href'], locale: string) {
  if (typeof href !== 'string') return href;
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  if (
    localePrefixes.some(
      (prefix) => href === prefix || href.startsWith(`${prefix}/`),
    )
  ) {
    return href;
  }

  const localePrefix = `/${locale as Locale}`;
  return href === '/' ? localePrefix : `${localePrefix}${href}`;
}

const CustomLink = ({
  href,
  ...rest
}: LinkProps & AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const params = useParams<{ locale?: string }>();
  const locale = isLocale(params?.locale) ? params.locale : defaultLocale;
  const isStringHref = typeof href === 'string';
  const isInternalLink =
    isStringHref && href.startsWith('/') && !href.startsWith('//');
  const isAnchorLink = isStringHref && href.startsWith('#');

  if (isInternalLink) {
    return (
      <Link
        className="break-words"
        href={withLocalePrefix(href, locale)}
        {...rest}
      />
    );
  }

  if (isAnchorLink) {
    return <a className="break-words" href={href} {...rest} />;
  }

  return (
    <a
      className="break-words"
      target="_blank"
      rel="noopener noreferrer"
      href={href}
      {...rest}
    />
  );
};

export default CustomLink;
