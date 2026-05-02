import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const activityTypeEnum = pgEnum("activity_type", [
  "quest_complete",
  "health_log",
  "transaction",
  "level_up",
  "purchase",
  "mystery_box",
  "group_quest",
]);

export const activityLogTable = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  type: activityTypeEnum("type").notNull(),
  pillar: text("pillar"),
  title: text("title").notNull(),
  description: text("description"),
  xpEarned: integer("xp_earned"),
  goldEarned: integer("gold_earned"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogTable).omit({ id: true, createdAt: true });
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogTable.$inferSelect;
