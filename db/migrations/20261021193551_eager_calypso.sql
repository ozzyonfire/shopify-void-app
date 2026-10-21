CREATE TABLE `shopify_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`shop` text NOT NULL,
	`state` text DEFAULT '' NOT NULL,
	`is_online` integer DEFAULT false NOT NULL,
	`scope` text,
	`access_token` text NOT NULL,
	`expires` integer,
	`refresh_token` text,
	`refresh_token_expires` integer,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `shopify_sessions_shop_idx` ON `shopify_sessions` (`shop`);