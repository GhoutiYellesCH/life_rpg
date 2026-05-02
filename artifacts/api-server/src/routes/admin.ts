import { Router, type IRouter } from "express";
import { db, usersTable, questsTable, healthLogsTable, transactionsTable, shopItemsTable, inventoryTable, groupQuestsTable, activityLogTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

/* ── Users ─────────────────────────────────────────────────── */
router.get("/users", async (req, res) => {
  try {
    const users = await db.select().from(usersTable);
    res.json(users);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const { username, avatarName, xp, gold, streak, longestStreak, hasAura, weeklyQuestsCompleted } = req.body as Record<string, unknown>;
    const updates: Partial<typeof usersTable.$inferInsert> = {};
    if (username !== undefined) updates.username = username as string;
    if (avatarName !== undefined) updates.avatarName = avatarName as string;
    if (xp !== undefined) updates.xp = Number(xp);
    if (gold !== undefined) updates.gold = Number(gold);
    if (streak !== undefined) updates.streak = Number(streak);
    if (longestStreak !== undefined) updates.longestStreak = Number(longestStreak);
    if (hasAura !== undefined) updates.hasAura = Boolean(hasAura);
    if (weeklyQuestsCompleted !== undefined) updates.weeklyQuestsCompleted = Number(weeklyQuestsCompleted);
    const result = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
    res.json(result[0] ?? null);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── Quests ─────────────────────────────────────────────────── */
router.get("/quests", async (req, res) => {
  try {
    const quests = await db.select().from(questsTable).orderBy(questsTable.createdAt);
    res.json(quests);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/quests/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const allowed: (keyof typeof questsTable.$inferInsert)[] = ["title", "description", "pillar", "questType", "xpReward", "goldReward", "status"];
    const updates: Partial<typeof questsTable.$inferInsert> = {};
    for (const key of allowed) {
      if ((req.body as Record<string, unknown>)[key] !== undefined) {
        (updates as Record<string, unknown>)[key] = (req.body as Record<string, unknown>)[key];
      }
    }
    const result = await db.update(questsTable).set(updates).where(eq(questsTable.id, id)).returning();
    res.json(result[0] ?? null);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/quests/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    await db.delete(questsTable).where(eq(questsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── Shop Items ─────────────────────────────────────────────── */
router.get("/shop", async (req, res) => {
  try {
    const items = await db.select().from(shopItemsTable);
    res.json(items);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/shop", async (req, res) => {
  try {
    const { name, description, goldCost, category, rarity } = req.body as Record<string, unknown>;
    const result = await db.insert(shopItemsTable).values({
      name: name as string,
      description: description as string,
      goldCost: Number(goldCost),
      category: category as any,
      rarity: (rarity ?? "common") as any,
    }).returning();
    res.status(201).json(result[0]);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/shop/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const allowed: (keyof typeof shopItemsTable.$inferInsert)[] = ["name", "description", "goldCost", "category", "rarity"];
    const updates: Partial<typeof shopItemsTable.$inferInsert> = {};
    for (const key of allowed) {
      if ((req.body as Record<string, unknown>)[key] !== undefined) {
        (updates as Record<string, unknown>)[key] = (req.body as Record<string, unknown>)[key];
      }
    }
    const result = await db.update(shopItemsTable).set(updates).where(eq(shopItemsTable.id, id)).returning();
    res.json(result[0] ?? null);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/shop/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    await db.delete(shopItemsTable).where(eq(shopItemsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── Health Logs ─────────────────────────────────────────────── */
router.get("/health-logs", async (req, res) => {
  try {
    const logs = await db.select().from(healthLogsTable).orderBy(healthLogsTable.createdAt);
    res.json(logs);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/health-logs/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    await db.delete(healthLogsTable).where(eq(healthLogsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── Transactions ────────────────────────────────────────────── */
router.get("/transactions", async (req, res) => {
  try {
    const txs = await db.select().from(transactionsTable).orderBy(transactionsTable.createdAt);
    res.json(txs);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/transactions/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    await db.delete(transactionsTable).where(eq(transactionsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── Group Quests ────────────────────────────────────────────── */
router.get("/group-quests", async (req, res) => {
  try {
    const gq = await db.select().from(groupQuestsTable).orderBy(groupQuestsTable.createdAt);
    res.json(gq);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/group-quests/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    await db.delete(groupQuestsTable).where(eq(groupQuestsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── Activity Log ─────────────────────────────────────────────── */
router.get("/activity", async (req, res) => {
  try {
    const events = await db.select().from(activityLogTable).orderBy(activityLogTable.createdAt);
    res.json(events);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/activity/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    await db.delete(activityLogTable).where(eq(activityLogTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
