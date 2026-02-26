import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Prevent Next.js from inferring a parent directory as workspace root
  // when this project lives inside a monorepo or nested git structure.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
