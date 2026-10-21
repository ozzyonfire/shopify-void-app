import type { SAppNavAttributes } from "@shopify/app-bridge-types";

// @shopify/app-bridge-types registers its elements on the global `JSX`
// namespace, but React 19 reads `React.JSX`. Bridge the ones we use.
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "s-app-nav": SAppNavAttributes;
    }
  }
}
