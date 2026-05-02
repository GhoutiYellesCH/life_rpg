import { pgTable, serial, integer, text, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const healthLogTypeEnum = pgEnum("health_log_type", ["workout", "meal", "sleep", "hydration"]);

export const healthLogsTable = pgTable("health_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  type: healthLogTypeEnum("type").notNull(),
  label: text("label").notNull(),
  value: real("value").notNull(),
  unit: text("unit").notNull(),
  xpEarned: integer("xp_earned").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHealthLogSchema = createInsertSchema(healthLogsTable).omit({ id: true, createdAt: true });
export type InsertHealthLog = z.infer<typeof insertHealthLogSchema>;
export type HealthLog = typeof healthLogsTable.$inferSelect;
