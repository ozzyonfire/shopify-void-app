// Dev command run by `shopify app dev` (see shopify.web.toml).
//
// The Shopify CLI passes app credentials as shell env vars. Void only gives
// the worker values that come from .env files (shell vars are ignored so your
// shell never leaks into the worker). This copies the CLI's values into
// .env.local, removes them from the shell env, then starts Vite.
//
// It also runs GraphQL codegen in watch mode, so `#graphql` operations get
// typed results as you edit them.
import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const ENV_FILE = ".env.local";
const START = "# >>> shopify app dev: managed block <<<";
const END = "# >>> end shopify app dev <<<";

const values = {
  SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SCOPES,
  SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL || process.env.APP_URL || process.env.HOST,
};

const lines = Object.entries(values)
  .filter(([, value]) => value)
  .map(([key, value]) => `${key}=${value}`);

if (lines.length > 0) {
  const existing = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8") : "";
  const block = `${START}\n${lines.join("\n")}\n${END}\n`;
  const pattern = new RegExp(`${START}[\\s\\S]*?${END}\\n?`);
  const next = pattern.test(existing)
    ? existing.replace(pattern, block)
    : `${existing}${existing && !existing.endsWith("\n") ? "\n" : ""}${block}`;
  writeFileSync(ENV_FILE, next);
}

const childEnv = { ...process.env };
for (const key of Object.keys(values)) delete childEnv[key];

const require = createRequire(import.meta.url);
const bin = (pkg, path) => join(dirname(require.resolve(`${pkg}/package.json`)), path);

const vite = spawn(process.execPath, [bin("vite", "bin/vite.js"), "dev"], {
  stdio: "inherit",
  env: childEnv,
});
const codegen = spawn(process.execPath, [bin("@graphql-codegen/cli", "esm/bin.js"), "--watch"], {
  stdio: "inherit",
  env: childEnv,
});
codegen.on("exit", (code) => {
  if (code) console.warn(`GraphQL codegen exited with code ${code}. Run \`pnpm graphql-codegen\` to retry.`);
});

vite.on("exit", (code, signal) => {
  codegen.kill();
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    codegen.kill(signal);
    vite.kill(signal);
  });
}
