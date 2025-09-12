import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// Prefer Replit PostgreSQL database over other configurations
function getDatabaseUrl(): string {
  // If we have Replit PG variables, use them to construct the URL
  if (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE) {
    return `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE}?sslmode=require`;
  }
  
  // Fallback to DATABASE_URL if available (ensure it has SSL)
  if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL;
    return url.includes('sslmode=') ? url : `${url}?sslmode=require`;
  }
  
  throw new Error("No database configuration found. Ensure database is provisioned.");
}

const databaseUrl = getDatabaseUrl();
const client = postgres(databaseUrl);
export const db = drizzle(client, { schema });
