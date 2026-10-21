import { Link, useShared } from "@void/react";

export default function AdditionalPage() {
  const { shop } = useShared();

  return (
    <s-page heading="Additional page">
      <s-section heading="Multiple pages">
        <s-stack gap="base">
          <s-paragraph>
            To add a page, create a file in <code>pages/</code> and link to it from the{" "}
            <code>&lt;s-app-nav&gt;</code> in <code>pages/layout.tsx</code>.
          </s-paragraph>
          <s-paragraph>
            This page has no loader. It reads the shop from shared data set in{" "}
            <code>middleware/02.authenticate.ts</code>: <s-text type="strong">{shop}</s-text>
          </s-paragraph>
          <Link href="/">Back to home</Link>
        </s-stack>
      </s-section>
      <s-section slot="aside" heading="Resources">
        <s-unordered-list>
          <s-list-item>
            <s-link
              href="https://shopify.dev/docs/apps/design-guidelines/navigation#app-nav"
              target="_blank"
            >
              App nav best practices
            </s-link>
          </s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}
