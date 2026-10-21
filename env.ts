import { defineEnv, string, url } from "void/env";

export default defineEnv({
  // App credentials from the Partner Dashboard / `shopify app env show`.
  // In dev, `scripts/dev.mjs` copies these from the Shopify CLI into `.env.local`.
  SHOPIFY_API_KEY: string().public(),
  SHOPIFY_API_SECRET: string().secret(),
  // Comma-separated scopes. Optional with Shopify managed installation
  // (scopes live in shopify.app.toml).
  SCOPES: string().optional(),
  // Public URL of the app. Falls back to the incoming request's origin.
  SHOPIFY_APP_URL: url().optional(),
  // Extra shop domain to accept besides *.myshopify.com (rarely needed).
  SHOP_CUSTOM_DOMAIN: string().optional(),
});
