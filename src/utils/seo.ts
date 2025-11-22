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
    description: 'Revolutionary full-stack development framework with PHP and Python. Build without limits with RPA, AI, Blockchain and more.',
    keywords: 'Orionis Framework, full-stack development, PHP, Python, RPA, artificial intelligence, blockchain, web development',
    author: 'Raul Mauricio Uñate Castro'
  },
  es: {
    siteName: 'Orionis Framework',
    description: 'Framework revolucionario para desarrollo full-stack con PHP y Python. Construye sin límites con RPA, IA, Blockchain y más.',
    keywords: 'Orionis Framework, desarrollo full-stack, PHP, Python, RPA, inteligencia artificial, blockchain, desarrollo web',
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