import { defineConfig } from "kysely-ctl";
import { db } from "./src/lib/database/index.js";

export default defineConfig({
  kysely: db,
  migrations: {
    migrationFolder: "migrations",
  },
});
