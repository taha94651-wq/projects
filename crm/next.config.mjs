// Static export so the app can be hosted on GitHub Pages (no server needed).
// BASE_PATH is set when building for a sub-folder, e.g. /projects/crm-app
const basePath = process.env.BASE_PATH || "";
/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
};
