import { defineHandler, defineHead, type InferProps } from "void";
import { ValidationError } from "void/handler";
import * as v from "valibot";

export type Props = InferProps<typeof loader>;

interface HomeQuery {
  shop: { name: string; myshopifyDomain: string };
  products: { nodes: Array<{ id: string; title: string; status: string }> };
}

/** Runs on the server for every GET. The return value becomes page props. */
export const loader = defineHandler(async (c) => {
  const { graphql } = c.get("shopify");

  const data = await graphql<HomeQuery>(`#graphql
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

interface ProductCreateMutation {
  productCreate: {
    product: { id: string } | null;
    userErrors: Array<{ field: string[] | null; message: string }>;
  };
}

export const actions = {
  /** `useForm("/?createProduct")`. Returning nothing re-runs the loader. */
  createProduct: defineHandler.withValidator({
    body: v.object({
      title: v.pipe(v.string(), v.trim(), v.minLength(1, "Enter a product title")),
    }),
  })(async (c, { body }) => {
    const { graphql } = c.get("shopify");

    const data = await graphql<ProductCreateMutation>(
      `#graphql
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

    const [error] = data.productCreate.userErrors;
    if (error) throw new ValidationError({ title: error.message });
  }),
};
