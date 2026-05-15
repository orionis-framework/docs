// src/utils/seo.ts
export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  lang?: string;
}

export const defaultSEO = {
  en: {
    siteName: 'Orionis Framework',
    description: 'High-Performance Async Python Framework designed for modern web applications. Build scalable, fast, and efficient Python applications with Orionis Framework.',
    keywords: 'python, async, framework, web development, high-performance, python framework, async framework, web framework, orionis',
    author: 'Raul Mauricio Uñate Castro'
  },
  es: {
    siteName: 'Orionis Framework',
    description: 'Framework Python Asíncrono de Alto Rendimiento diseñado para aplicaciones web modernas. Construye aplicaciones Python escalables, rápidas y eficientes con Orionis Framework.',
    keywords: 'python, async, framework, web development, high-performance, python framework, async framework, web framework, orionis',
    author: 'Raul Mauricio Uñate Castro'
  }
};

export function generateSEOTitle(pageTitle: string, lang: string = 'en'): string {
  const siteName = defaultSEO[lang as keyof typeof defaultSEO]?.siteName || defaultSEO.en.siteName;
  return pageTitle ? `${pageTitle} - ${siteName}` : siteName;
}

export function generateSEODescription(pageDescription: string, lang: string = 'en'): string {
  return pageDescription || defaultSEO[lang as keyof typeof defaultSEO]?.description || defaultSEO.en.description;
}

export function generateKeywords(pageKeywords: string, lang: string = 'en'): string {
  const defaultKeywords = defaultSEO[lang as keyof typeof defaultSEO]?.keywords || defaultSEO.en.keywords;
  return pageKeywords ? `${pageKeywords}, ${defaultKeywords}` : defaultKeywords;
}

export function generateCanonicalURL(pathname: string, baseURL: string = 'https://docs.orionis-framework.com'): string {
  return new URL(pathname, baseURL).toString();
}

export function generateOGImageURL(title: string, baseURL: string = 'https://docs.orionis-framework.com'): string {
  // Aquí podrías implementar un generador de imágenes OG dinámicas
  // Por ahora, devuelve una imagen estática
  return `${baseURL}/og-image.png`;
}

// Función para generar metadatos JSON-LD para documentación técnica
export function generateTechArticleSchema(props: {
  title: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
  lang: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": props.title,
    "description": props.description,
    "url": props.url,
    "author": {
      "@type": "Organization",
      "name": defaultSEO[props.lang as keyof typeof defaultSEO]?.author || defaultSEO.en.author,
      "url": "https://docs.orionis-framework.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Orionis Framework",
      "url": "https://docs.orionis-framework.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://docs.orionis-framework.com/favicon.svg"
      }
    },
    "inLanguage": props.lang,
    "datePublished": props.datePublished || new Date().toISOString(),
    "dateModified": props.dateModified || new Date().toISOString()
  };
}