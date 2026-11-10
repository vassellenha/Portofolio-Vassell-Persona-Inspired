const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://web-nu-wine-25.vercel.app";

export default function sitemap() {
  return [{ url: SITE, lastModified: new Date(), changeFrequency: "monthly", priority: 1 }];
}
