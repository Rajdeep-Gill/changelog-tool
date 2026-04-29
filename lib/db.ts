import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

import * as schema from "@/db/schema"

type DB = ReturnType<typeof drizzle<typeof schema>>

const globalForDb = globalThis as unknown as { changelogsDb: DB | undefined }

export function getDb(): DB {
  if (globalForDb.changelogsDb) {
    return globalForDb.changelogsDb
  }
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is not set")
  }
  const sql = neon(url)
  const instance = drizzle(sql, { schema })
  globalForDb.changelogsDb = instance
  return instance
}
