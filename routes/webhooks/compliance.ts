import { defineHandler } from "void";
import { logger } from "void/log";
import { verifyWebhook } from "../../src/shopify/webhooks";

/**
 * Mandatory privacy (GDPR) webhooks. Required for App Store apps.
 * https://shopify.dev/docs/apps/build/privacy-law-compliance
 */
export const POST = defineHandler(async (c) => {
  const webhook = await verifyWebhook(c);
  if (webhook instanceof Response) return webhook;

  switch (webhook.topic) {
    case "customers/data_request":
    case "CUSTOMERS_DATA_REQUEST":
      // Send the customer's stored data to the store owner.
      break;
    case "customers/redact":
    case "CUSTOMERS_REDACT":
      // Delete the customer's data.
      break;
    case "shop/redact":
    case "SHOP_REDACT":
      // Delete the shop's data (sent 48 hours after uninstall).
      break;
  }

  logger.info("Compliance webhook received", { topic: webhook.topic, shop: webhook.shop });
  return c.body(null, 200);
});
