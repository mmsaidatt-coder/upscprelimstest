import nextConfig from "eslint-config-next";

const eslintConfig = [
  {
    ignores: [".vercel/**", ".next/**"],
  },
  ...nextConfig,
];

export default eslintConfig;
