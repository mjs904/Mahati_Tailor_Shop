/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  allowedDevOrigins: [
    '*.replit.dev',
    'a1fcaf18-04cb-4947-91b2-52471b04458a-00-y6tg2pdsuvra.pike.replit.dev',
    '127.0.0.1',
    'localhost',
  ],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;