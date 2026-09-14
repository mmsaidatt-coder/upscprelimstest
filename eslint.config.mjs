import nextConfig from "eslint-config-next";

const eslintConfig = [
  {
    ignores: [".vercel/**", ".next/**", ".claude/worktrees/**"],
  },
  ...nextConfig,
];

export default eslintConfig;
