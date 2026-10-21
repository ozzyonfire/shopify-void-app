# Shopify App Template - Void

A starter template for building an **embedded Shopify app** with [Void](https://void.cloud): React pages with server loaders and actions, built on Vite and deployed to Cloudflare Workers.

It's the Void counterpart to Shopify's official [React Router template](https://github.com/Shopify/shopify-app-template-react-router) and to [shopify-next-app](https://github.com/ozzyonfire/shopify-next-app). It gives you the same setup — App Bridge, Polaris web components, token-exchange auth, session storage and webhooks — without needing a Node server or a separate database.

> **Status:** community template, not maintained by Shopify. Built on Void 0.10.

## What's included

- **Void pages (React 19)**: server-rendered pages with co-located loaders and actions, plus client-side navigation.
- **Token exchange auth**: no OAuth redirects. App Bridge session tokens are exchanged for expiring offline access tokens, and those tokens are refreshed automatically.
- **Cloudflare D1 + Drizzle**: sessions are stored in D1. There's no database to run locally.
- **App Bridge + Polaris web components**: loaded from Shopify's CDN and fully typed (`s-page`, `s-section`, `s-button`, …).
- **Direct API access**: query the Admin API from the browser with `fetch("shopify:admin/api/...")`.
- **Webhooks**: HMAC-verified handlers for `app/uninstalled`, `app/scopes_update`, and the mandatory compliance topics.
- **One-command deploys** to Cloudflare with `void deploy`, plus an optional GitHub Actions workflow.

The home page demos each piece: a server loader, a form action, an API route, a direct Admin API call, App Bridge intents, and client-side navigation.

## Requirements

- Node.js 22+
- [pnpm](https://pnpm.io)
- A [Shopify Partner account](https://partners.shopify.com/signup) and a [development store](https://shopify.dev/docs/apps/tools/development-stores)
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli) (installed as a dev dependency)

## Getting started

Create a new app from this template with the Shopify CLI:

```shell
shopify app init --template https://github.com/ozzyonfire/shopify-void-app --package-manager pnpm
cd <your-app>
pnpm dev
```

Or click **Use this template** on GitHub, clone your copy, then:

```shell
pnpm install
pnpm config:link   # create or link your app in the Partner Dashboard
pnpm dev
```

`pnpm dev` runs `shopify app dev`, which starts a tunnel, applies pending D1 migrations, and runs `scripts/dev.mjs`. That script copies your app credentials from the CLI into `.env.local` (gitignored) and starts Vite. This step is needed because Void reads worker env values from `.env` files, not from the shell.

Press `p` in the CLI to open the app in your dev store.

## How it works

### Request flow

1. Shopify loads the app in the admin iframe with `?shop=...&id_token=...`.
2. `middleware/01.embedded-app.ts` adds the App Bridge and Polaris scripts, the Inter font, the `shopify-api-key` meta tag, and a `frame-ancestors` CSP.
3. `middleware/02.authenticate.ts` reads the session token (from `id_token` or the `Authorization` header), validates it, and loads the shop's offline session from D1, running token exchange when needed. The result is available as `c.get("shopify")`.
4. After the first load, App Bridge adds `Authorization: Bearer <token>` to every `fetch`, including Void's client navigation and form actions, so every request is authenticated the same way.

When there's no valid token:

- **Page loads** redirect to `/auth/session-token`, which lets App Bridge fetch a fresh token and reload the page.
- **fetch requests** get a `401` with `X-Shopify-Retry-Invalid-Session-Request`, so App Bridge retries them once with a new token.

### Using the Admin API

In any loader, action, or route:

```ts
export const loader = defineHandler(async (c) => {
  const { shop, session, graphql } = c.get("shopify");
  const data = await graphql<{ shop: { name: string } }>(`#graphql
    query { shop { name } }
  `);
  return { name: data.shop.name };
});
```

Outside a merchant request (webhooks, crons, queues), use `getOfflineSession(shop)` from `src/shopify/authenticate.ts`. It refreshes the access token when it has expired.

### UI

Pages use [Polaris web components](https://shopify.dev/docs/api/app-home/polaris-web-components). They're global custom elements, so there's nothing to import. Use `useAppBridge()` from `@shopify/app-bridge-react` for App Bridge APIs like toasts and intents.

The app nav is `<s-app-nav>` in `pages/layout.tsx`. Nav clicks are routed through Void's client router, so they don't reload the page.

## Project structure

```
pages/                  UI (React). `*.server.ts` files hold loaders and actions
  layout.tsx            App nav (`s-app-nav`) + `shopify:navigate` → Void router
  index.tsx             Demos: loader, action, API route, direct API, intents, navigation
  additional.tsx
routes/
  api/hello.ts          Authenticated API route example
  auth/session-token.ts Session token bounce page
  webhooks/             Webhook handlers
middleware/             Embedded-app headers + authentication
src/shopify/            Shopify API setup, auth, session storage, webhooks
db/schema.ts            Drizzle schema (sessions table)
db/migrations/          SQL migrations
env.ts                  Typed env vars
scripts/dev.mjs         Dev command used by the Shopify CLI
shopify.app.toml        App config: scopes, webhooks, direct API access
```

## Database

Sessions live in D1. To change the schema, edit `db/schema.ts`, then:

```shell
pnpm db:generate   # write a migration to db/migrations/
pnpm db:migrate    # apply it locally
```

`void deploy` applies pending migrations to the production database.

## GraphQL types

`.graphqlrc.ts` is set up for [`@shopify/api-codegen-preset`](https://www.npmjs.com/package/@shopify/api-codegen-preset). Operations tagged with `#graphql` in `pages/`, `routes/`, `src/`, and `middleware/` are picked up. Install `@graphql-codegen/cli` and run `pnpm graphql-codegen` to generate types into `src/types/`.

## Deployment

1. Deploy the worker:

   ```shell
   pnpm exec void secret put SHOPIFY_API_SECRET
   pnpm run deploy:worker
   ```

   Set `SHOPIFY_API_KEY` and `SHOPIFY_APP_URL` (your deployed URL) in `.env.production` or as secrets. `void deploy` fails if a required value is missing.

2. Point the app at it: set `application_url` in `shopify.app.toml` to the deployed URL, then run `pnpm run deploy` to push app config, webhooks, and extensions.

To deploy on every push to `main`, set a `VOID_PROJECT` repository variable. `.github/workflows/void-deploy.yml` skips until it's set.

To deploy to your own Cloudflare account instead of the Void platform, see `void deploy --backend cloudflare` in the Void docs.

## Resources

- [Shopify app docs](https://shopify.dev/docs/apps/getting-started)
- [Token exchange](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/token-exchange)
- [App Bridge](https://shopify.dev/docs/api/app-home)
- [Polaris web components](https://shopify.dev/docs/api/app-home/polaris-web-components)
- [Void docs](https://void.cloud) (also bundled at `node_modules/void/docs/`)
