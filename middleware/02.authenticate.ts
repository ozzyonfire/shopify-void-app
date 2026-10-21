import { defineMiddleware } from "void";
import {
  authenticate,
  getSessionToken,
  InvalidSessionTokenError,
  type AdminContext,
} from "../src/shopify/authenticate";
import { getShopify } from "../src/shopify/shopify";

declare module "void" {
  interface CloudContextVariables {
    /** Set for every authenticated page, action, and `/api` request. */
    shopify: AdminContext;
    shared: { shop: string };
  }
}

/** Paths that don't come from inside the Shopify admin iframe. */
const PUBLIC_PREFIXES = ["/webhooks/", "/auth/", "/__void", "/@", "/node_modules/"];

function isPublic(pathname: string) {
  // Static files (favicon, images, JS chunks) never need a session.
  if (/\.[a-z0-9]+$/i.test(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** A full page load, as opposed to a Void client navigation or `fetch`. */
function isDocumentRequest(request: Request) {
  const dest = request.headers.get("sec-fetch-dest");
  if (dest) return dest === "document" || dest === "iframe";
  return request.headers.get("accept")?.includes("text/html") ?? false;
}

/**
 * Authenticates every embedded request with its App Bridge session token
 * and exposes the result as `c.get("shopify")` to loaders, actions, and routes.
 */
export default defineMiddleware(async (c, next) => {
  const url = new URL(c.req.url);
  if (isPublic(url.pathname)) return next();

  const token = getSessionToken(c.req.raw);
  let admin: AdminContext | undefined;
  if (token) {
    try {
      admin = await authenticate(token, c.req.url);
    } catch (error) {
      if (!(error instanceof InvalidSessionTokenError)) throw error;
    }
  }

  if (!admin) {
    if (!isDocumentRequest(c.req.raw)) {
      // App Bridge retries the request once with a fresh token.
      c.header("X-Shopify-Retry-Invalid-Session-Request", "1");
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Page load without a valid token (e.g. a browser refresh after the
    // id_token expired). Bounce through App Bridge to get a fresh one.
    const shop = getShopify(c.req.url).utils.sanitizeShop(url.searchParams.get("shop") ?? "");
    if (!shop) {
      return c.text("Open this app from the Shopify admin.", 400);
    }
    url.searchParams.delete("id_token");
    const bounce = new URLSearchParams(url.searchParams);
    bounce.set("shopify-reload", `${url.pathname}?${url.searchParams}`);
    return c.redirect(`/auth/session-token?${bounce}`);
  }

  c.set("shopify", admin);
  c.set("shared", { shop: admin.shop });
  await next();
});
