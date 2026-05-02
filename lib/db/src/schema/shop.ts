import { pgTable, serial, text, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shopCategoryEnum = pgEnum("shop_category", ["helmet", "armor", "weapon", "accessory", "mount", "aura"]);
export const shopRarityEnum = pgEnum("shop_rarity", ["common", "rare", "epic", "legendary"]);

export const shopItemsTable = pgTable("shop_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  goldCost: integer("gold_cost").notNull(),
  category: shopCategoryEnum("category").notNull(),
  rarity: shopRarityEnum("rarity").notNull().default("common"),
  imageUrl: text("image_url"),
});

export const insertShopItemSchema = createInsertSchema(shopItemsTable).omit({ id: true });
export type InsertShopItem = z.infer<typeof insertShopItemSchema>;
export type ShopItem = typeof shopItemsTable.$inferSelect;
