import { HttpResponseError, RequestedTokenType, type Session } from "@shopify/shopify-api";
import { getShopify } from "./shopify";
import { deleteSession, loadSession, storeSession } from "./session-storage";

/** Refresh tokens a little early so a request never races the expiry. */
const EXPIRY_BUFFER_MS = 60_000;

export interface AdminContext {
  shop: string;
  session: Session;
  /** Runs an Admin GraphQL operation as the shop's offline session. */
  graphql: <T = unknown>(query: string, variables?: Record<string, unknown>) => Promise<T>;
}

/** Thrown when a session token is missing, malformed, or expired. */
export class InvalidSessionTokenError extends Error {
  constructor(cause?: unknown) {
    super("Invalid session token", { cause });
    this.name = "InvalidSessionTokenError";
  }
}

/**
 * Reads the App Bridge session token from the request.
 * - `Authorization: Bearer <token>`: added by App Bridge to every `fetch` the
 *   page makes, including Void client navigation and actions.
 * - `?id_token=<token>`: added by Shopify to the first iframe load.
 */
export function getSessionToken(request: Request): string | undefined {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) return header.slice("Bearer ".length);
  return new URL(request.url).searchParams.get("id_token") ?? undefined;
}

/**
 * Validates a session token and returns an admin context for the shop.
 * Uses the stored offline session when it's still valid, otherwise performs
 * token exchange and stores the new session.
 */
export async function authenticate(sessionToken: string, requestUrl: string): Promise<AdminContext> {
  const shopify = getShopify(requestUrl);

  let shop: string;
  try {
    const payload = await shopify.session.decodeSessionToken(sessionToken);
    shop = new URL(payload.dest).hostname;
  } catch (error) {
    throw new InvalidSessionTokenError(error);
  }

  let session = await loadSession(shopify.session.getOfflineId(shop));
  if (!session?.accessToken || session.isExpired(EXPIRY_BUFFER_MS)) {
    const result = await shopify.auth.tokenExchange({
      shop,
      sessionToken,
      requestedTokenType: RequestedTokenType.OfflineAccessToken,
      expiring: true,
    });
    session = result.session;
    await storeSession(session);
  }

  return { shop, session, graphql: createGraphql(session, requestUrl) };
}

/**
 * Loads a shop's offline session outside a merchant request (webhooks,
 * crons, queues). Refreshes the access token if it has expired.
 */
export async function getOfflineSession(shop: string): Promise<Session | undefined> {
  const shopify = getShopify();
  const session = await loadSession(shopify.session.getOfflineId(shop));
  if (!session) return undefined;
  if (!session.isExpired(EXPIRY_BUFFER_MS)) return session;
  if (!session.refreshToken) return undefined;

  const { session: refreshed } = await shopify.auth.refreshToken({
    shop,
    refreshToken: session.refreshToken,
  });
  await storeSession(refreshed);
  return refreshed;
}

export function createGraphql(session: Session, requestUrl?: string) {
  return async <T = unknown>(query: string, variables?: Record<string, unknown>): Promise<T> => {
    const client = new (getShopify(requestUrl).clients.Graphql)({ session });
    let response;
    try {
      response = await client.request<T>(query, { variables });
    } catch (error) {
      // The stored token was revoked. Drop it so the next request exchanges a new one.
      if (error instanceof HttpResponseError && error.response.code === 401) {
        await deleteSession(session.id);
      }
      throw error;
    }
    if (response.errors) {
      throw new Error(response.errors.message ?? "Shopify GraphQL request failed");
    }
    return response.data as T;
  };
}
