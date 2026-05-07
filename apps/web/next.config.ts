import "@workspace/env/client";
import "@workspace/env/server";

import { env } from "@workspace/env/client";
import { client } from "@workspace/sanity/client";
import { queryRedirects } from "@workspace/sanity/query";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  reactCompiler: true,
  experimental: {
    inlineCss: true,
  },
  logging: {
    fetches: {},
  },
  images: {
    minimumCacheTTL: 31_536_000,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: `/images/${env.NEXT_PUBLIC_SANITY_PROJECT_ID}/**`,
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/PokeAPI/sprites/**",
      },
      {
        protocol: "https",
        hostname: "notehub-official.vercel.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "placehold.net",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // Cache static JS/CSS chunks aggressively (they're content-hashed)
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Sanity CDN images — long cache
        source: "/api/og",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        // Preconnect hint for Sanity CDN (improves LCP)
        source: "/(.*)",
        headers: [
          {
            key: "Link",
            value: "<https://cdn.sanity.io>; rel=preconnect; crossorigin, <https://cdn.sanity.io>; rel=dns-prefetch",
          },
        ],
      },
    ];
  },
  async redirects() {
    const redirects = await client.fetch(queryRedirects);
    return redirects.map((redirect) => ({
      source: redirect.source,
      destination: redirect.destination,
      permanent: redirect.permanent ?? false,
    }));
  },
};

export default nextConfig;
