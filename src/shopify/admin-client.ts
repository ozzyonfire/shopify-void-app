import { API_VERSION } from "./api-version";
import { AdminApiError, type ResultOf, type VariablesArg } from "./graphql";

/**
 * Runs an Admin GraphQL operation from the browser through App Bridge
 * (direct API access). Results and variables are typed from the query
 * string by GraphQL codegen.
 *
 * Browser-only: `shopify:` URLs are handled by App Bridge's `fetch`.
 */
export async function adminGraphql<Q extends string>(
  query: Q,
  ...[variables]: VariablesArg<Q>
): Promise<ResultOf<Q>> {
  const response = await fetch(`shopify:admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) {
    throw new AdminApiError(`Admin API request failed with status ${response.status}`);
  }

  const json = (await response.json()) as {
    data?: ResultOf<Q>;
    errors?: Array<{ message: string }>;
  };
  if (json.errors?.length) {
    throw new AdminApiError(json.errors.map((error) => error.message).join("\n"), json.errors);
  }
  return json.data as ResultOf<Q>;
}
