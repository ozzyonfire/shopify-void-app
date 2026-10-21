import { defineHandler } from "void";
import { logger } from "void/log";
import { deleteSessionsByShop } from "../../../src/shopify/session-storage";
import { verifyWebhook } from "../../../src/shopify/webhooks";

export const POST = defineHandler(async (c) => {
  const webhook = await verifyWebhook(c);
  if (webhook instanceof Response) return webhook;

  logger.info("App uninstalled", { shop: webhook.shop });
  // Webhooks can be delivered more than once, so this must be idempotent.
  await deleteSessionsByShop(webhook.shop);
  return c.body(null, 200);
});
