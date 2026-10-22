import { defineHandler, defineHead, type InferProps } from "void";
import { ValidationError } from "void/handler";
import * as v from "valibot";

export type Props = InferProps<typeof loader>;

/** Runs on the server for every GET. The return value becomes page props. */
export const loader = defineHandler(async (c) => {
  const { graphql } = c.get("shopify");

  // `data` is typed from the query by GraphQL codegen.
  const data = await graphql(/* graphql */ `#graphql
    query Home {
      shop {
        name
        myshopifyDomain
      }
      products(first: 5, sortKey: CREATED_AT, reverse: true) {
        nodes {
          id
          title
          status
        }
      }
    }
  `);

  return { shop: data.shop, products: data.products.nodes };
});

export const head = defineHead<Props>(() => ({ title: "Home" }));

export const actions = {
  /** `useForm("/?createProduct")`. Returning nothing re-runs the loader. */
  createProduct: defineHandler.withValidator({
    body: v.object({
      title: v.pipe(v.string(), v.trim(), v.minLength(1, "Enter a product title")),
    }),
  })(async (c, { body }) => {
    const { graphql } = c.get("shopify");

    const data = await graphql(
      /* graphql */ `#graphql
        mutation CreateProduct($product: ProductCreateInput!) {
          productCreate(product: $product) {
            product {
              id
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      { product: { title: body.title } },
    );

    const [error] = data.productCreate?.userErrors ?? [];
    if (error) throw new ValidationError({ title: error.message });
  }),
};
