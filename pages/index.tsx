import { useEffect, useState } from "react";
import { Link, useForm } from "@void/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useQuery } from "@tanstack/react-query";
import { adminGraphql } from "../src/shopify/admin-client";
import type { Props } from "./index.server";

// `#graphql` lets codegen find this query and generate its result type.
// `/* graphql */` turns on GraphQL syntax highlighting in editors like Zed.
const SHOP_INFO_QUERY = /* graphql */ `#graphql
  query ShopInfo {
    shop {
      currencyCode
      plan {
        publicDisplayName
      }
    }
  }
`;

export default function Home({ shop, products }: Props) {
  const shopify = useAppBridge();
  const form = useForm("/?createProduct", { title: "" });
  const [apiResult, setApiResult] = useState<string>();

  // Direct API access: App Bridge sends this straight to the Admin API.
  // `shopInfo.data` is fully typed, and the result is cached across pages.
  const shopInfo = useQuery({
    queryKey: ["shopInfo"],
    queryFn: () => adminGraphql(SHOP_INFO_QUERY),
  });

  useEffect(() => {
    if (form.recentlySuccessful) {
      shopify.toast.show("Product created");
      form.reset();
    }
  }, [form.recentlySuccessful]); // eslint-disable-line react-hooks/exhaustive-deps

  // Opens the product in the admin's product editor.
  function editProduct(id: string) {
    shopify.intents.invoke?.("edit:shopify/Product", { value: id });
  }

  // App Bridge adds the session token to same-origin fetch calls.
  async function callApiRoute() {
    const response = await fetch("/api/hello");
    const data = (await response.json()) as { shop: string; productCount: number };
    setApiResult(`${data.shop} has ${data.productCount} products.`);
  }

  return (
    <s-page heading="Void Shopify app">
      {/* Intents open admin workflows, like the product editor, from the app. */}
      <s-button slot="primary-action" onClick={() => shopify.intents.invoke?.("create:shopify/Product")}>
        Add product
      </s-button>

      <s-section heading="Page loader">
        <s-paragraph>
          This data was loaded on the server in <code>pages/index.server.ts</code> using the shop&apos;s
          offline access token.
        </s-paragraph>
        <s-paragraph>
          <s-text type="strong">{shop.name}</s-text> ({shop.myshopifyDomain})
        </s-paragraph>
      </s-section>

      <s-section heading="Page action">
        <s-stack gap="base">
          <s-paragraph>
            Submit a form to a server action. When it finishes, the loader re-runs and the list
            below updates.
          </s-paragraph>
          <form action={form.post}>
            <s-grid gridTemplateColumns="1fr auto" gap="base" alignItems="end">
              <s-text-field
                label="Product title"
                name="title"
                value={form.data.title}
                error={form.errors.title}
                onInput={(e) => form.setData("title", e.currentTarget.value)}
              ></s-text-field>
              <s-button type="submit" variant="primary" loading={form.pending}>
                Create product
              </s-button>
            </s-grid>
          </form>
          {products.length > 0 ? (
            <s-unordered-list>
              {products.map((product) => (
                <s-list-item key={product.id}>
                  <s-stack direction="inline" gap="small-200" alignItems="center">
                    {product.title} <s-badge>{product.status}</s-badge>
                    <s-button variant="tertiary" onClick={() => editProduct(product.id)}>
                      Edit
                    </s-button>
                  </s-stack>
                </s-list-item>
              ))}
            </s-unordered-list>
          ) : (
            <s-paragraph color="subdued">No products yet.</s-paragraph>
          )}
        </s-stack>
      </s-section>

      <s-section heading="API route">
        <s-stack gap="base">
          <s-paragraph>
            Call <code>routes/api/hello.ts</code>. The session token is checked by{" "}
            <code>middleware/02.authenticate.ts</code>.
          </s-paragraph>
          <s-button onClick={callApiRoute}>Call /api/hello</s-button>
          {apiResult && <s-paragraph>{apiResult}</s-paragraph>}
        </s-stack>
      </s-section>

      <s-section heading="Direct API access">
        <s-stack gap="base">
          <s-paragraph>
            Query the Admin API from the browser with TanStack Query. Leave this page and come
            back: the cached result shows instantly.
          </s-paragraph>
          <s-box padding="base" borderWidth="base" borderRadius="base" background="subdued">
            {shopInfo.data ? (
              <s-text>
                Currency: {shopInfo.data.shop.currencyCode} · Plan:{" "}
                {shopInfo.data.shop.plan.publicDisplayName}
              </s-text>
            ) : shopInfo.error ? (
              <s-text tone="critical">{shopInfo.error.message}</s-text>
            ) : (
              <s-spinner accessibilityLabel="Loading shop info" size="base"></s-spinner>
            )}
          </s-box>
          <s-button onClick={() => shopInfo.refetch()} loading={shopInfo.isFetching}>
            Refetch
          </s-button>
        </s-stack>
      </s-section>

      <s-section heading="Navigation">
        <s-paragraph>
          <Link href="/additional">Go to the additional page</Link> without a full page reload.
        </s-paragraph>
      </s-section>

      <s-section slot="aside" heading="App template specs">
        <s-paragraph>
          <s-text>Framework: </s-text>
          <s-link href="https://void.cloud" target="_blank">
            Void
          </s-link>
        </s-paragraph>
        <s-paragraph>
          <s-text>Interface: </s-text>
          <s-link
            href="https://shopify.dev/docs/api/app-home/using-polaris-components"
            target="_blank"
          >
            Polaris web components
          </s-link>
        </s-paragraph>
        <s-paragraph>
          <s-text>API: </s-text>
          <s-link href="https://shopify.dev/docs/api/admin-graphql" target="_blank">
            GraphQL
          </s-link>
        </s-paragraph>
        <s-paragraph>
          <s-text>Database: </s-text>
          <s-link href="https://orm.drizzle.team/" target="_blank">
            Drizzle
          </s-link>{" "}
          + Cloudflare D1
        </s-paragraph>
      </s-section>

      <s-section slot="aside" heading="Next steps">
        <s-unordered-list>
          <s-list-item>
            Build an{" "}
            <s-link
              href="https://shopify.dev/docs/apps/getting-started/build-app-example"
              target="_blank"
            >
              example app
            </s-link>
          </s-list-item>
          <s-list-item>
            Explore Shopify&apos;s API with{" "}
            <s-link href="https://shopify.dev/docs/apps/tools/graphiql-admin-api" target="_blank">
              GraphiQL
            </s-link>
          </s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}
