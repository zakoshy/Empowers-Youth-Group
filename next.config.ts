
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Aliases for client-side libraries
    config.resolve.alias = {
        ...config.resolve.alias,
        'pdf-parse': false, // Don't bundle server-side pdf-parse on the client
        'fs': false, // fs is a server-side module
    };

    // Keep canvas as an external module on the server
    if (!isServer) {
        config.resolve.alias.canvas = false;
    }

    return config;
  },
};

export default nextConfig;
