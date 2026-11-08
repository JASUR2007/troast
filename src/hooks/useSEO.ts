// src/hooks/useSEO.ts
import { useEffect } from 'react';

interface SEOOptions {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
}

export function useSEO({ title, description, ogTitle, ogDescription }: SEOOptions) {
  useEffect(() => {
    const prevTitle = document.title;
    const formattedTitle = title.includes('Troast CRM') ? title : `${title} | Troast CRM`;
    document.title = formattedTitle;

    const setMetaTag = (selector: string, attribute: string, attrValue: string, content: string) => {
      let meta = document.querySelector(selector) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, attrValue);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    if (description) {
      setMetaTag('meta[name="description"]', 'name', 'description', description);
    }
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', ogTitle || formattedTitle);
    if (description || ogDescription) {
      setMetaTag(
        'meta[property="og:description"]',
        'property',
        'og:description',
        ogDescription || description || ''
      );
    }

    return () => {
      document.title = prevTitle;
    };
  }, [title, description, ogTitle, ogDescription]);
}
