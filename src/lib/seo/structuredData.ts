import { SITE_URL } from '@/lib/api/config'

export interface BreadcrumbItem {
  name: string
  url: string
}

export interface ArticleAuthor {
  name: string
  url?: string
}

export interface Organization {
  name: string
  url: string
  logo?: string
  sameAs?: string[]
}

export interface BreadcrumbListItem {
  '@type': 'ListItem'
  position: number
  name: string
  item: string
}

export interface BreadcrumbListSchema {
  '@context': 'https://schema.org'
  '@type': 'BreadcrumbList'
  itemListElement: BreadcrumbListItem[]
}

export interface ArticleSchema {
  '@context': 'https://schema.org'
  '@type': 'NewsArticle'
  headline: string
  image: string[]
  datePublished: string
  dateModified: string
  author: Array<{ '@type': 'Person'; name: string; url?: string }>
  publisher: {
    '@type': 'Organization'
    name: string
    logo: { '@type': 'ImageObject'; url: string }
  }
  description: string
  url: string
}

export interface WebsiteSchema {
  '@context': 'https://schema.org'
  '@type': 'WebSite'
  name: string
  url: string
  potentialAction: {
    '@type': 'SearchAction'
    target: {
      '@type': 'EntryPoint'
      urlTemplate: string
    }
    'query-input': string
  }
}

export interface OrganizationSchema {
  '@context': 'https://schema.org'
  '@type': 'Organization'
  name: string
  url: string
  logo?: string
  sameAs: string[]
  contactPoint: {
    '@type': 'ContactPoint'
    telephone: string
    contactType: string
    availableLanguage: string[]
  }
}

export interface CollectionPageSchema {
  '@context': 'https://schema.org'
  '@type': 'CollectionPage'
  name: string
  description?: string
  url: string
  numberOfItems?: number
  isPartOf: {
    '@type': 'WebSite'
    url: string
  }
}

export interface SearchResultsPageSchema {
  '@context': 'https://schema.org'
  '@type': 'SearchResultsPage'
  name: string
  description: string
  url: string
  numberOfItems: number
  isPartOf: {
    '@type': 'WebSite'
    url: string
  }
  mainEntity: {
    '@type': 'ItemList'
    numberOfItems: number
  }
}

export function generateBreadcrumbList(items: BreadcrumbItem[]): BreadcrumbListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function generateArticleSchema(params: {
  headline: string
  description: string
  url: string
  image: string
  datePublished: string
  dateModified: string
  author: ArticleAuthor
  organization?: Organization
}): ArticleSchema {
  const org = params.organization || {
    name: 'Mitra Banten News',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: params.headline,
    image: [params.image],
    datePublished: params.datePublished,
    dateModified: params.dateModified,
    author: [{
      '@type': 'Person',
      name: params.author.name,
      url: params.author.url,
    }],
    publisher: {
      '@type': 'Organization',
      name: org.name,
      logo: {
        '@type': 'ImageObject',
        url: org.logo || `${SITE_URL}/logo.png`,
      },
    },
    description: params.description,
    url: params.url,
  }
}

export function generateWebsiteSchema(organization: Organization): WebsiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: organization.name,
    url: organization.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${organization.url}/cari?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function generateOrganizationSchema(organization: Organization): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: organization.name,
    url: organization.url,
    logo: organization.logo,
    sameAs: organization.sameAs || [],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '',
      contactType: 'customer service',
      availableLanguage: ['Indonesian', 'English'],
    },
  }
}

export function generateCollectionPageSchema(params: {
  name: string
  description?: string
  url: string
  numberOfItems?: number
}): CollectionPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: params.name,
    description: params.description,
    url: params.url,
    numberOfItems: params.numberOfItems,
    isPartOf: {
      '@type': 'WebSite',
      url: SITE_URL,
    },
  }
}

export function generateSearchResultsPageSchema(params: {
  query: string
  resultCount: number
  url: string
}): SearchResultsPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'SearchResultsPage',
    name: `Hasil pencarian: ${params.query}`,
    description: `Hasil pencarian untuk "${params.query}" - ${params.resultCount} artikel ditemukan`,
    url: params.url,
    numberOfItems: params.resultCount,
    isPartOf: {
      '@type': 'WebSite',
      url: SITE_URL,
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: params.resultCount,
    },
  }
}

export function generateBreadcrumbSchemaForPage(
  items: { label: string; href: string }[]
): BreadcrumbListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href.startsWith('http') ? item.href : `${SITE_URL}${item.href}`,
    })),
  }
}

export const DEFAULT_ORGANIZATION: Organization = {
  name: 'Mitra Banten News',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
}
