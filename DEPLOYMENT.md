# Deployment Guide

This project is configured to be seamlessly deployed via [Vercel](https://vercel.com). There are two primary ways to deploy your application:

## Method 1: Automatic Deployments via GitHub (Recommended)

Since this repository is linked to Vercel via GitHub, deploying updates is completely automatic when you push code to your default branch.

1. Ensure your local changes are committed:
   ```bash
   git add .
   git commit -m "Your descriptive commit message"
   ```
2. Push your changes to the `main` branch (or whichever branch is linked):
   ```bash
   git push origin main
   ```
3. Vercel will automatically detect the new commit, build the Next.js application, and deploy it to production. You can monitor the build progress on your Vercel Dashboard.

## Method 2: Manual Deployments using the Vercel CLI

If you want to deploy pending changes immediately from your local terminal without waiting for a Git push, you can use the Vercel CLI.

1. First, make sure you're in the project's root directory.
2. Run the Vercel production deployment command without installing it globally by using `npx`:
   ```bash
   npx vercel --prod
   ```
   *(Or, to auto-confirm all default prompts, use: `npx vercel --prod --yes`)*
3. The CLI will securely upload your local source code to Vercel's servers, initialize the Next.js production build, and return the live production URLs directly in your terminal once completed.

### Preview Deployments

If you want to test your code in a live environment *before* pushing it to production, you can create a Preview Deployment using the Vercel CLI:

```bash
npx vercel
```
This generates a unique URL where you can visually inspect your changes without affecting the live user site.
