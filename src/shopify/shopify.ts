import "@shopify/shopify-api/adapters/cf-worker";
import { ApiVersion, LogSeverity, shopifyApi, type Shopify } from "@shopify/shopify-api";
import { env } from "void/env";

export const API_VERSION = ApiVersion.October26;

let instance: Shopify | undefined;
let instanceHost: string | undefined;

/**
 * Returns the configured Shopify API library instance.
 *
 * Built lazily because `void/env` is only bound once a request is running.
 * `requestUrl` is used as the app host when SHOPIFY_APP_URL isn't set
 * (handy in dev, where the tunnel URL changes every run).
 */
export function getShopify(requestUrl?: string): Shopify {
  const appUrl = new URL(env.SHOPIFY_APP_URL ?? requestUrl ?? "https://localhost");
  if (instance && instanceHost === appUrl.host) return instance;

  instance = shopifyApi({
    apiKey: env.SHOPIFY_API_KEY,
    apiSecretKey: env.SHOPIFY_API_SECRET,
    scopes: env.SCOPES ? env.SCOPES.split(",") : undefined,
    hostName: appUrl.host,
    hostScheme: appUrl.protocol === "http:" ? "http" : "https",
    apiVersion: API_VERSION,
    isEmbeddedApp: true,
    ...(env.SHOP_CUSTOM_DOMAIN ? { customShopDomains: [env.SHOP_CUSTOM_DOMAIN] } : {}),
    logger: { level: import.meta.env.DEV ? LogSeverity.Info : LogSeverity.Error },
  });
  instanceHost = appUrl.host;
  return instance;
}
