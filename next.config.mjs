/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  allowedDevOrigins: ['10.208.3.67'],

 images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "xhfkqugxrkvqspsuthmq.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [
     {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          // ✅ Allow only your site to use camera, mic, and geolocation
          { key: "Permissions-Policy", value: "geolocation=(self), microphone=(self), camera=(self)" },
        ],
      },

      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },

  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: true },
    ];
  },

  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  experimental: {
    // optimizeCss: true,
    // optimizePackageImports: ["lucide-react"],
  },

  productionBrowserSourceMaps: false,
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  trailingSlash: false,

  eslint: {
    dirs: ["pages", "components", "lib", "hooks", "utils"],
  },

  typescript: {
    // ignoreBuildErrors: false,
  },
};

export default nextConfig;
