import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const pillarEnum = pgEnum("pillar", ["sports", "health", "goals", "finances"]);
export const questTypeEnum = pgEnum("quest_type", ["daily", "weekly", "challenge"]);
export const questStatusEnum = pgEnum("quest_status", ["active", "completed", "expired"]);

export const questsTable = pgTable("quests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  title: text("title").notNull(),
  description: text("description"),
  pillar: pillarEnum("pillar").notNull(),
  questType: questTypeEnum("quest_type").notNull().default("challenge"),
  xpReward: integer("xp_reward").notNull().default(50),
  goldReward: integer("gold_reward").notNull().default(10),
  deadline: timestamp("deadline"),
  expiresAt: timestamp("expires_at"),
  status: questStatusEnum("status").notNull().default("active"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuestSchema = createInsertSchema(questsTable).omit({ id: true, createdAt: true });
export type InsertQuest = z.infer<typeof insertQuestSchema>;
export type Quest = typeof questsTable.$inferSelect;
