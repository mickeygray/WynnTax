import { Helmet } from "react-helmet-async";
import { canonicalTaxPath } from "../utils/indexableTaxPath";

const SEO = ({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
  structuredData,
  noindex,
}) => (
  // ReactSnap may save the body before the next animation frame.
  <Helmet defer={false}>
    <title>{title}</title>
    <meta name="description" content={description} />
    <link
      rel="canonical"
      href={`https://www.wynntaxsolutions.com${canonicalTaxPath(canonical)}`}
    />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta
      property="og:url"
      content={`https://www.wynntaxsolutions.com${canonicalTaxPath(canonical)}`}
    />
    <meta property="og:type" content={ogType} />
    <meta
      property="og:image"
      content={
        ogImage || "https://www.wynntaxsolutions.com/images/og-image.png"
      }
    />
    <meta property="og:site_name" content="Wynn Tax Solutions" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    {noindex && <meta name="robots" content="noindex, nofollow" />}
    {structuredData &&
      (Array.isArray(structuredData) ? (
        structuredData.map((sd, i) => (
          <script key={i} type="application/ld+json">
            {JSON.stringify(sd)}
          </script>
        ))
      ) : (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      ))}
  </Helmet>
);

export default SEO;
