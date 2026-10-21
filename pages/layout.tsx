import { useEffect, type ReactNode } from "react";
import { useRouter } from "@void/react";

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();

  // App Bridge fires `shopify:navigate` when a merchant clicks an app nav
  // link. Route it through Void's client router instead of a full reload.
  useEffect(() => {
    const onNavigate = (event: Event) => {
      const href = (event.target as HTMLElement | null)?.getAttribute("href");
      if (href) router.visit(href);
    };
    document.addEventListener("shopify:navigate", onNavigate);
    return () => document.removeEventListener("shopify:navigate", onNavigate);
  }, [router]);

  return (
    <>
      <s-app-nav>
        {/* `rel="home"` is an App Bridge nav attribute missing from Polaris' s-link types. */}
        <s-link href="/" {...{ rel: "home" }}>
          Home
        </s-link>
        <s-link href="/additional">Additional page</s-link>
      </s-app-nav>
      {children}
    </>
  );
}
