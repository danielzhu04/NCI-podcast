import { sql } from "kysely"

/**
 * Create podcast job table
 */
export async function up(db) {

  await db.schema
    .createSchema("app")
    .ifNotExists()
    .execute()

  await db.schema
    .withSchema("app")
    .createTable("podcast_jobs")
    .addColumn("id", "uuid", col =>
      col.primaryKey()
        .defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("user_id", "uuid")
    .addColumn("paper_title", "text", col =>
      col.notNull()
    )
    .addColumn("paper_text", "text", col =>
      col.notNull()
    )
    .addColumn("description", "text")
    .addColumn("publication_url", "text")
    .addColumn("tool_url", "text")
    .addColumn("image_url", "text")
    .addColumn("tags", "jsonb")
    .addColumn("status", "text", col =>
      col.notNull()
        .defaultTo("queued")
    )
    .addColumn("result_url", "text")
    .addColumn("error", "text")
    .addColumn("created_at", "timestamptz", col =>
      col.notNull()
        .defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", col =>
      col.notNull()
        .defaultTo(sql`now()`)
    )
    .execute()
}


export async function down(db) {

  await db.schema
    .withSchema("app")
    .dropTable("podcast_jobs")
    .execute()

}
