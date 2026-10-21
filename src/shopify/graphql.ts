import type { AdminOperations } from "@shopify/admin-api-client";

/**
 * Types for `#graphql` operations, looked up by the query string itself.
 *
 * `pnpm graphql-codegen` (also run in watch mode by `pnpm dev`) scans the
 * app for `#graphql` strings and registers each one's result and variable
 * types on `AdminOperations`. Operations it hasn't seen yet resolve to
 * `unknown`.
 */
export type ResultOf<Q extends string> = Q extends keyof AdminOperations
  ? AdminOperations[Q]["return"]
  : unknown;

export type VariablesOf<Q extends string> = Q extends keyof AdminOperations
  ? AdminOperations[Q]["variables"]
  : Record<string, unknown>;

/** Variables are optional when the operation doesn't require any. */
export type VariablesArg<Q extends string> =
  // eslint-disable-next-line @typescript-eslint/ban-types
  {} extends VariablesOf<Q> ? [variables?: VariablesOf<Q>] : [variables: VariablesOf<Q>];

/** A GraphQL response with top-level `errors`, or a non-2xx status. */
export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly errors: Array<{ message: string }> = [],
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}
