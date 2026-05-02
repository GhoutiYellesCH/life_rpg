import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().default("Hero"),
  avatarName: text("avatar_name").notNull().default("Warrior"),
  xp: integer("xp").notNull().default(0),
  gold: integer("gold").notNull().default(100),
  level: integer("level").notNull().default(1),
  streak: integer("streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  hasAura: boolean("has_aura").notNull().default(false),
  weeklyQuestsCompleted: integer("weekly_quests_completed").notNull().default(0),
  lastLoginDate: text("last_login_date"),
  lastMysteryBoxOpened: timestamp("last_mystery_box_opened"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
