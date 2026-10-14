export const defaultSEO = {
  en: {
    description: 'Orionis Framework documentation: installation, application architecture, HTTP, services, databases, asynchronous processing, and testing in Python.',
    author: 'Raul Mauricio Uñate Castro',
  },
  es: {
    description: 'Documentación de Orionis Framework: instalación, arquitectura de aplicaciones, HTTP, servicios, bases de datos, procesamiento asíncrono y pruebas en Python.',
  },
};

export function generateSEODescription(pageDescription: string, lang = 'en'): string {
  return pageDescription || defaultSEO[lang as keyof typeof defaultSEO]?.description || defaultSEO.en.description;
}

export function generateCanonicalURL(pathname: string, baseURL = 'https://docs.orionis-framework.com'): string {
  return new URL(pathname, baseURL).toString();
}

export function generateOGImageURL(baseURL = 'https://docs.orionis-framework.com'): string {
  return new URL('/seo/seo.png', baseURL).toString();
}

export function generateTechArticleSchema(props: {
  title: string;
  description: string;
  url: string;
  dateModified?: string;
  lang: string;
}) {
  const siteURL = new URL(props.url).origin;
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: props.title,
    description: props.description,
    url: props.url,
    author: {
      '@type': 'Organization',
      name: 'Orionis Framework Team',
      url: siteURL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Orionis Framework',
      url: siteURL,
      logo: {
        '@type': 'ImageObject',
        url: new URL('/favicon.svg', siteURL).toString(),
      },
    },
    inLanguage: props.lang,
    ...(props.dateModified ? { dateModified: props.dateModified } : {}),
  };
}
