import { pgTable, serial, integer, text, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { pillarEnum } from "./quests";

export const groupQuestStatusEnum = pgEnum("group_quest_status", ["active", "completed", "failed"]);

export const groupQuestsTable = pgTable("group_quests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  pillar: pillarEnum("pillar").notNull(),
  targetValue: real("target_value").notNull(),
  currentValue: real("current_value").notNull().default(0),
  unit: text("unit").notNull(),
  deadline: timestamp("deadline"),
  status: groupQuestStatusEnum("status").notNull().default("active"),
  createdById: integer("created_by_id").references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGroupQuestSchema = createInsertSchema(groupQuestsTable).omit({ id: true, createdAt: true });
export type InsertGroupQuest = z.infer<typeof insertGroupQuestSchema>;
export type GroupQuest = typeof groupQuestsTable.$inferSelect;
