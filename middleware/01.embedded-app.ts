import { defineMiddleware } from "void";
import { env } from "void/env";
import { getShopify } from "../src/shopify/shopify";

/**
 * Everything an embedded app page needs:
 * - App Bridge, Polaris web components and the Inter font loaded in <head> (App Bridge must
 *   be the first script, and it reads the API key from the meta tag).
 * - A `frame-ancestors` CSP so only the Shopify admin can frame the app.
 */
export default defineMiddleware(async (c, next) => {
  c.set("headDefaults", {
    meta: [{ name: "shopify-api-key", content: env.SHOPIFY_API_KEY }],
    // Inter is the Polaris typeface; matches the Shopify admin.
    link: [
      { rel: "preconnect", href: "https://cdn.shopify.com/" },
      { rel: "stylesheet", href: "https://cdn.shopify.com/static/fonts/inter/v4/styles.css" },
    ],
    script: [
      { src: "https://cdn.shopify.com/shopifycloud/app-bridge.js" },
      { src: "https://cdn.shopify.com/shopifycloud/polaris.js" },
    ],
  });

  await next();

  const shop = getShopify(c.req.url).utils.sanitizeShop(c.req.query("shop") ?? "");
  const csp = `frame-ancestors https://${shop ?? "*.myshopify.com"} https://admin.shopify.com;`;
  try {
    c.res.headers.set("Content-Security-Policy", csp);
  } catch {
    // Some responses have immutable headers; copy and retry.
    c.res = new Response(c.res.body, c.res);
    c.res.headers.set("Content-Security-Policy", csp);
  }
});
