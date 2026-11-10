const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://web-nu-wine-25.vercel.app";

export default function robots() {
  return { rules: [{ userAgent: "*", allow: "/" }], sitemap: `${SITE}/sitemap.xml` };
}
