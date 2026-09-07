/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@stockmc/shared"],
  async rewrites() {
    // Proxy /api/* to the NestJS API in dev so the browser stays same-origin.
    const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:4000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
