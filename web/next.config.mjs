/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { inlineCss: true }, // CSS kecil di-inline: tanpa request render-blocking
};
export default nextConfig;
