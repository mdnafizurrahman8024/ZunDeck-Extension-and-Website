import { escapeHtml, sanitizeUrl } from '../security/index.js';

export function generateSeoTags(profile, canonicalUrl = 'https://mdnafizurrahman8024.github.io/') {
  const identity = profile.identity || {};
  const meta = profile.meta || {};
  const links = profile.links || {};

  const title = escapeHtml(meta.title || `${identity.fullName} | Portfolio`);
  const description = escapeHtml(meta.description || identity.tagline || `${identity.fullName} Portfolio`);
  const author = escapeHtml(identity.fullName || '');
  const bannerUrl = sanitizeUrl(identity.banner || 'Banner.png');
  const safeCanonical = sanitizeUrl(canonicalUrl);

  const sameAsLinks = [
    links.scholar,
    links.orcid,
    links.researchgate,
    links.osf,
    links.github,
    links.linkedin,
    links.googleSites
  ].filter(Boolean).map(sanitizeUrl);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: identity.fullName || '',
    jobTitle: identity.roleBadge || '',
    description: identity.tagline || '',
    url: safeCanonical,
    image: sanitizeUrl(identity.avatar || ''),
    sameAs: sameAsLinks,
    worksFor: identity.institution ? {
      '@type': 'Organization',
      name: identity.institution
    } : undefined
  };

  const headMarkup = `
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="author" content="${author}">
  <meta name="robots" content="index, follow">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${bannerUrl}">
  <meta property="og:url" content="${safeCanonical}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${bannerUrl}">

  <!-- JSON-LD Person Structured Data -->
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>
`.trim();

  return {
    title,
    description,
    jsonLd,
    headMarkup
  };
}
