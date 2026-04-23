import { Helmet } from 'react-helmet-async';
import { APP_NAME, absoluteUrl, defaultOgImageUrl, getSiteUrl } from '@/lib/site';

type SeoProps = {
  title: string;
  description: string;
  path: string;
  /** If true, search engines should not index this page */
  noIndex?: boolean;
  /** Optional shorter title for Open Graph / Twitter when the page title is long */
  socialTitle?: string;
};

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

export function Seo({ title, description, path, noIndex, socialTitle }: SeoProps) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const canonical = absoluteUrl(normalizedPath);
  const pageTitle = title.includes(APP_NAME) ? title : `${title} | ${APP_NAME}`;
  const ogTitle = socialTitle ?? pageTitle;
  const imageUrl = defaultOgImageUrl();

  return (
    <Helmet>
      <html lang="es-MX" />
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta name="robots" content={noIndex ? 'noindex, follow' : 'index, follow'} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={APP_NAME} />
      <meta property="og:locale" content="es_MX" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:secure_url" content={imageUrl} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content={String(OG_WIDTH)} />
      <meta property="og:image:height" content={String(OG_HEIGHT)} />
      <meta property="og:image:alt" content={`${APP_NAME} — preparación ENARM`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={`${APP_NAME} — preparación ENARM`} />
    </Helmet>
  );
}

const SOFTWARE_DESCRIPTION =
  'Plataforma web de preparación para el ENARM en México: casos clínicos, simulacros con ritmo de examen, estadísticas de desempeño y plan de estudio.';

export type FaqItem = { question: string; answer: string };

/** FAQPage JSON-LD — el texto debe coincidir con el contenido visible en la página */
export function JsonLdFaqPage({ items }: { items: FaqItem[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
}

/** JSON-LD Organization + WebSite + SoftwareApplication for public discovery */
export function JsonLdSiteIdentity() {
  const site = getSiteUrl();
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${site}/#organization`,
        name: APP_NAME,
        url: `${site}/`,
        logo: `${site}/logotiposolo.png`,
      },
      {
        '@type': 'WebSite',
        '@id': `${site}/#website`,
        name: APP_NAME,
        url: `${site}/`,
        publisher: { '@id': `${site}/#organization` },
        inLanguage: 'es-MX',
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${site}/#software`,
        name: APP_NAME,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        url: `${site}/`,
        description: SOFTWARE_DESCRIPTION,
        publisher: { '@id': `${site}/#organization` },
      },
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(graph)}</script>
    </Helmet>
  );
}
