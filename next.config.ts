import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React Compiler after installing: npm i babel-plugin-react-compiler
  // reactCompiler: true,
  async headers() {
    return [
      ...["/app/:path*", "/login", "/feedback", "/test/:path*"].map(
        (source) => ({
          source,
          headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
        }),
      ),
      ...["/api/:path*", "/auth/:path*"].map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      })),
    ];
  },
};

export default nextConfig;
