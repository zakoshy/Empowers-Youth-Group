
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
    // Exclude canvas from being bundled on the client
    if (!isServer) {
        config.externals.push('canvas');
    }
    // Aliases for client-side libraries
    config.resolve.alias = {
        ...config.resolve.alias,
        'pdf-parse': false, // Don't bundle server-side pdf-parse on the client
        'fs': false, // fs is a server-side module
    };

    return config;
  },
};

export default nextConfig;
