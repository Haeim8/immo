export default function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "CANTORFI",
    "url": "https://cantorfi.tech",
    "logo": "https://cantorfi.tech/logo-dark.png",
    "sameAs": [
      "https://cantorfi.ca",
      "https://cantorfi.fund"
    ],
    "description": "RWA Multi Blockchain-powered",
    "foundingDate": "2024",
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "contact@cantorfi.tech",
      "contactType": "customer service"
    }
  };

  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "CANTORFI",
    "url": "https://cantorfi.tech",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://cantorfi.tech/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }}
      />
    </>
  );
}
