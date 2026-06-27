import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonicalPath: string;
  ogType?: 'website' | 'article';
  keywords?: string;
  schema?: Record<string, any>;
}

export function useSEO({ title, description, canonicalPath, ogType = 'website', keywords, schema }: SEOProps) {
  useEffect(() => {
    // 1. Title
    document.title = title;

    // Helper to select or create meta tags
    const setMetaTag = (attributeName: string, attributeValue: string, contentValue: string) => {
      let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attributeName, attributeValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentValue);
    };

    // 2. Meta Description
    setMetaTag('name', 'description', description);

    // 2b. Keywords
    if (keywords) {
      setMetaTag('name', 'keywords', keywords);
    }

    // 3. Open Graph Tags
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:url', `https://taskvexa.xyz${canonicalPath}`);
    setMetaTag('property', 'og:image', 'https://taskvexa.xyz/assets/og-image.png');
    setMetaTag('property', 'og:site_name', 'TaskVexa');

    // 4. Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', 'https://taskvexa.xyz/assets/og-image.png');

    // 5. Canonical Url Link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', `https://taskvexa.xyz${canonicalPath}`);

    // 6. Structured Schema Data JSON-LD
    let schemaScript = document.getElementById('seo-schema-script');
    if (schemaScript) {
      schemaScript.remove();
    }

    if (schema) {
      schemaScript = document.createElement('script');
      schemaScript.setAttribute('id', 'seo-schema-script');
      schemaScript.setAttribute('type', 'application/ld+json');
      schemaScript.innerHTML = JSON.stringify(schema);
      document.head.appendChild(schemaScript);
    }

    return () => {
      // Clean up dynamic schema script on unmount
      const scriptToRemove = document.getElementById('seo-schema-script');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [title, description, canonicalPath, ogType, schema]);
}
