import { Router, type IRouter } from "express";
import { db, shopItemsTable, inventoryTable, usersTable, activityLogTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { ensureUser, DEFAULT_USER_ID } from "./users";

const router: IRouter = Router();

router.get("/shop", async (_req, res) => {
  try {
    const items = await db.select().from(shopItemsTable);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/inventory", async (req, res) => {
  try {
    await ensureUser();
    const items = await db.select({
      id: inventoryTable.id,
      shopItemId: inventoryTable.shopItemId,
      equippedSlot: inventoryTable.equippedSlot,
      purchasedAt: inventoryTable.purchasedAt,
      shopItem: {
        id: shopItemsTable.id,
        name: shopItemsTable.name,
        description: shopItemsTable.description,
        goldCost: shopItemsTable.goldCost,
        category: shopItemsTable.category,
        rarity: shopItemsTable.rarity,
        imageUrl: shopItemsTable.imageUrl,
      },
    }).from(inventoryTable)
      .innerJoin(shopItemsTable, eq(inventoryTable.shopItemId, shopItemsTable.id))
      .where(eq(inventoryTable.userId, DEFAULT_USER_ID));

    res.json(items);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/inventory/purchase", async (req, res) => {
  try {
    const user = await ensureUser();
    const { shopItemId } = req.body;

    const [item] = await db.select().from(shopItemsTable).where(eq(shopItemsTable.id, shopItemId));
    if (!item) return res.status(404).json({ error: "Item not found" });
    if (user.gold < item.goldCost) return res.status(400).json({ error: "Not enough Gold" });

    const [invItem] = await db.insert(inventoryTable).values({
      userId: DEFAULT_USER_ID,
      shopItemId: item.id,
    }).returning();

    await db.update(usersTable).set({ gold: user.gold - item.goldCost }).where(eq(usersTable.id, DEFAULT_USER_ID));

    await db.insert(activityLogTable).values({
      userId: DEFAULT_USER_ID,
      type: "purchase",
      title: `Purchased: ${item.name}`,
      description: `Spent ${item.goldCost} Gold on a ${item.rarity} item`,
      goldEarned: -item.goldCost,
    });

    const fullItem = {
      id: invItem.id,
      shopItemId: invItem.shopItemId,
      equippedSlot: invItem.equippedSlot,
      purchasedAt: invItem.purchasedAt,
      shopItem: item,
    };

    res.json({
      inventoryItem: fullItem,
      goldSpent: item.goldCost,
      remainingGold: user.gold - item.goldCost,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
