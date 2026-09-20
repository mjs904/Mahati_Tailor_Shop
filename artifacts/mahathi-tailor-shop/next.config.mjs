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
  env: {
    NEXT_PUBLIC_INSFORGE_URL:
      process.env.NEXT_PUBLIC_INSFORGE_URL || 'https://jk3f7ixk.us-east.insforge.app/',
    NEXT_PUBLIC_INSFORGE_ANON_KEY:
      process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || 'ik_f1506c66409346efbb2378b1abc33eae',
    NEXT_PUBLIC_ADMIN_PIN:
      process.env.NEXT_PUBLIC_ADMIN_PIN || '1998',
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;