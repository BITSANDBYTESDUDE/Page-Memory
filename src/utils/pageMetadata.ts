import type { PageMetadata } from '../types';
import { normalizePageUrl } from './url';

export interface MetadataDocument {
  readonly title: string;
  querySelector(selector: string): Pick<Element, 'getAttribute'> | null;
}

function resolveFavicon(document: MetadataDocument, pageUrl: string): string | null {
  const href = document.querySelector('link[rel~="icon" i]')?.getAttribute('href');
  if (!href) return null;

  try {
    const faviconUrl = new URL(href, pageUrl);
    if (
      (faviconUrl.protocol !== 'https:' && faviconUrl.protocol !== 'http:') ||
      !faviconUrl.hostname
    ) {
      return null;
    }

    faviconUrl.username = '';
    faviconUrl.password = '';
    return faviconUrl.toString();
  } catch {
    return null;
  }
}

function resolveCanonicalUrl(
  document: MetadataDocument,
  normalizedPageUrl: ReturnType<typeof normalizePageUrl>,
): string {
  const href = document
    .querySelector('link[rel~="canonical" i]')
    ?.getAttribute('href');
  if (!href) return normalizedPageUrl.canonicalUrl;

  try {
    return normalizePageUrl(new URL(href, normalizedPageUrl.url).toString()).canonicalUrl;
  } catch {
    return normalizedPageUrl.canonicalUrl;
  }
}

export function extractPageMetadata(
  document: MetadataDocument,
  pageUrl: string,
  pageId: string = globalThis.crypto.randomUUID(),
): PageMetadata {
  const normalizedPageUrl = normalizePageUrl(pageUrl);

  return {
    pageId,
    url: normalizedPageUrl.url,
    canonicalUrl: resolveCanonicalUrl(document, normalizedPageUrl),
    title: document.title,
    hostname: normalizedPageUrl.hostname,
    domain: normalizedPageUrl.domain,
    favicon: resolveFavicon(document, normalizedPageUrl.url),
  };
}
