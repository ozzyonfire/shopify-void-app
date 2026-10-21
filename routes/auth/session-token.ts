import { defineHandler } from "void";
import { env } from "void/env";

/**
 * Session token "bounce" page. App Bridge loads, fetches a fresh session
 * token, then reloads the `shopify-reload` URL with `id_token` attached.
 */
export const GET = defineHandler(() => {
  return `<!doctype html>
<html>
  <head>
    <meta name="shopify-api-key" content="${env.SHOPIFY_API_KEY}" />
    <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
  </head>
  <body></body>
</html>`;
});
