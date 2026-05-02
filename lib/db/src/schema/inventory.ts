import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { shopItemsTable } from "./shop";

export const inventoryTable = pgTable("inventory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  shopItemId: integer("shop_item_id").notNull().references(() => shopItemsTable.id),
  equippedSlot: text("equipped_slot"),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
});

export const insertInventorySchema = createInsertSchema(inventoryTable).omit({ id: true, purchasedAt: true });
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventoryTable.$inferSelect;
