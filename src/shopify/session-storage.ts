import { Session } from "@shopify/shopify-api";
import { db, eq } from "void/db";
import { shopifySessions } from "@schema";

type Row = typeof shopifySessions.$inferSelect;

function toSession(row: Row): Session {
  return new Session({
    id: row.id,
    shop: row.shop,
    state: row.state,
    isOnline: row.isOnline,
    scope: row.scope ?? undefined,
    accessToken: row.accessToken,
    expires: row.expires ?? undefined,
    refreshToken: row.refreshToken ?? undefined,
    refreshTokenExpires: row.refreshTokenExpires ?? undefined,
  });
}

export async function storeSession(session: Session) {
  const values = {
    shop: session.shop,
    state: session.state ?? "",
    isOnline: session.isOnline,
    scope: session.scope ?? null,
    accessToken: session.accessToken ?? "",
    expires: session.expires ?? null,
    refreshToken: session.refreshToken ?? null,
    refreshTokenExpires: session.refreshTokenExpires ?? null,
    updatedAt: new Date().toISOString(),
  };
  await db
    .insert(shopifySessions)
    .values({ id: session.id, ...values })
    .onConflictDoUpdate({ target: shopifySessions.id, set: values });
}

export async function loadSession(id: string): Promise<Session | undefined> {
  const [row] = await db.select().from(shopifySessions).where(eq(shopifySessions.id, id));
  return row ? toSession(row) : undefined;
}

export async function deleteSession(id: string) {
  await db.delete(shopifySessions).where(eq(shopifySessions.id, id));
}

export async function deleteSessionsByShop(shop: string) {
  await db.delete(shopifySessions).where(eq(shopifySessions.shop, shop));
}

export async function updateScopeForShop(shop: string, scope: string) {
  await db
    .update(shopifySessions)
    .set({ scope, updatedAt: new Date().toISOString() })
    .where(eq(shopifySessions.shop, shop));
}
