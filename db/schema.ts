import { sqliteTable, text, integer, index } from "void/schema-d1";
import { sql } from "void/db";

/**
 * Shopify sessions (offline access tokens, one per shop).
 * Created by token exchange in `src/shopify/authenticate.ts`.
 */
export const shopifySessions = sqliteTable(
  "shopify_sessions",
  {
    id: text("id").primaryKey(),
    shop: text("shop").notNull(),
    state: text("state").notNull().default(""),
    isOnline: integer("is_online", { mode: "boolean" }).notNull().default(false),
    scope: text("scope"),
    accessToken: text("access_token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }),
    refreshToken: text("refresh_token"),
    refreshTokenExpires: integer("refresh_token_expires", { mode: "timestamp_ms" }),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [index("shopify_sessions_shop_idx").on(t.shop)],
);
