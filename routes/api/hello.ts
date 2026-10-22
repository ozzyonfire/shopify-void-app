import { defineHandler } from "void";

/**
 * Example API route. App Bridge adds the session token to `fetch` calls
 * from the app, and `middleware/02.authenticate.ts` verifies it, so
 * `c.get("shopify")` is always set here.
 */
export const GET = defineHandler(async (c) => {
  const { shop, graphql } = c.get("shopify");

  const data = await graphql(/* graphql */ `#graphql
    query ProductsCount {
      productsCount {
        count
      }
    }
  `);

  return { shop, productCount: data.productsCount?.count ?? 0 };
});
