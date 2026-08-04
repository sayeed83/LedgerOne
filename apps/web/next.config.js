/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @ledgerone/ui ships as untranspiled TS/TSX source (no build step of its
  // own) — Next skips compiling anything resolved from node_modules by
  // default, so the design-system package must be explicitly opted in.
  transpilePackages: ["@ledgerone/ui"],
};

module.exports = nextConfig;
