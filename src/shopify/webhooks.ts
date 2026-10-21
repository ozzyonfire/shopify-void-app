import type { CloudContext } from "void";
import { getShopify } from "./shopify";

export interface Webhook {
  topic: string;
  shop: string;
  apiVersion: string;
  webhookId?: string;
  payload: unknown;
}

/**
 * Verifies a webhook's HMAC and parses it. Returns a 401 response when the
 * request didn't come from Shopify.
 */
export async function verifyWebhook(c: CloudContext): Promise<Webhook | Response> {
  const rawBody = await c.req.text();
  const result = await getShopify(c.req.url).webhooks.validate({
    rawBody,
    rawRequest: c.req.raw,
  });

  if (!result.valid) {
    return c.text("Unauthorized", 401);
  }

  return {
    topic: result.topic,
    shop: result.domain,
    apiVersion: result.apiVersion,
    webhookId: "webhookId" in result ? result.webhookId : undefined,
    payload: rawBody ? JSON.parse(rawBody) : null,
  };
}
