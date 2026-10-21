import { defineConfig, type HmrOptions } from "vite";
import { voidPlugin } from "void";
import { voidReact } from "@void/react/plugin";

// `shopify app dev` serves the app through a tunnel and passes its URL in HOST.
const appUrl = process.env.HOST || process.env.APP_URL || "http://localhost";
const host = new URL(appUrl).hostname;

const hmr: HmrOptions =
  host === "localhost"
    ? { protocol: "ws", host: "localhost", port: 64999, clientPort: 64999 }
    : {
        protocol: "wss",
        host,
        port: Number(process.env.FRONTEND_PORT) || 8002,
        clientPort: 443,
      };

export default defineConfig({
  server: {
    port: Number(process.env.PORT || 3000),
    allowedHosts: [host],
    cors: { preflightContinue: true },
    hmr,
  },
  plugins: [voidPlugin(), voidReact()],
});
