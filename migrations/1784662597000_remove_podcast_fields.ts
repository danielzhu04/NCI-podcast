import { sql } from "kysely"

export async function up(db) {
  await db.schema
    .withSchema("app")
    .alterTable("podcast_jobs")
    .dropColumn("paper_title")
    .execute()

  await db.schema
    .withSchema("app")
    .alterTable("podcast_jobs")
    .dropColumn("paper_text")
    .execute()

  await db.schema
    .withSchema("app")
    .alterTable("podcast_jobs")
    .dropColumn("description")
    .execute()

  await db.schema
    .withSchema("app")
    .alterTable("podcast_jobs")
    .dropColumn("tags")
    .execute()
}

export async function down(db) {
  await db.schema
    .withSchema("app")
    .alterTable("podcast_jobs")
    .addColumn("paper_title", "text")
    .execute()

  await db.schema
    .withSchema("app")
    .alterTable("podcast_jobs")
    .addColumn("paper_text", "text")
    .execute()

  await db.schema
    .withSchema("app")
    .alterTable("podcast_jobs")
    .addColumn("description", "text")
    .execute()

  await db.schema
    .withSchema("app")
    .alterTable("podcast_jobs")
    .addColumn("tags", "jsonb")
    .execute()
}