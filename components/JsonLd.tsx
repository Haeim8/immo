export default function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "USCI",
    "url": "https://usci.tech",
    "logo": "https://usci.tech/logo-dark.png",
    "sameAs": [
      "https://usci.ca",
      "https://usci.fund"
    ],
    "description": "RWA Multi Blockchain-powered",
    "foundingDate": "2024",
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "contact@usci.tech",
      "contactType": "customer service"
    }
  };

  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "USCI",
    "url": "https://usci.tech",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://usci.tech/search?q={search_term_string}",
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
