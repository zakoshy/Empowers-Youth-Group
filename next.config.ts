import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // ✅ Always alias pdfjs to the browser-friendly legacy build
    config.resolve.alias = {
      ...config.resolve.alias,
      "pdfjs-dist/build/pdf": path.join(
        __dirname,
        "node_modules/pdfjs-dist/legacy/build/pdf.js"
      ),
      "pdfjs-dist/build/pdf.worker": path.join(
        __dirname,
        "node_modules/pdfjs-dist/legacy/build/pdf.worker.js"
      ),
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false, // prevents Node's canvas module from being bundled
        fs: false,
        path: false,
      };
    }

    return config;
  },
};

export default nextConfig;
