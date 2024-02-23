import { defineConfig } from "drizzle-kit";

// import path from "node:path";
// import { fileURLToPath } from "node:url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

export default defineConfig({
	schema: "./src/schema.ts",
	out: "./migrations",
	driver: "d1",
	dbCredentials: {
		wranglerConfigPath: "wrangler.toml",
		dbName: "shy-butterfly-78ad",
	},
});
