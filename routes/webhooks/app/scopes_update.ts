import { defineHandler } from "void";
import { updateScopeForShop } from "../../../src/shopify/session-storage";
import { verifyWebhook } from "../../../src/shopify/webhooks";

export const POST = defineHandler(async (c) => {
  const webhook = await verifyWebhook(c);
  if (webhook instanceof Response) return webhook;

  const { current } = webhook.payload as { current: string[] };
  await updateScopeForShop(webhook.shop, current.join(","));
  return c.body(null, 200);
});
