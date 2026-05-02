import { Router, type IRouter } from "express";
import { db, questsTable, usersTable, activityLogTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { ensureUser, calcLevel, calcXpToNextLevel, DEFAULT_USER_ID, XP_PER_LEVEL } from "./users";

const router: IRouter = Router();

router.get("/quests", async (req, res) => {
  try {
    await ensureUser();
    const { pillar, status } = req.query as { pillar?: string; status?: string };
    
    let conditions = [eq(questsTable.userId, DEFAULT_USER_ID)];
    if (pillar) conditions.push(eq(questsTable.pillar, pillar as any));
    if (status) conditions.push(eq(questsTable.status, status as any));
    
    const quests = await db.select().from(questsTable).where(and(...conditions)).orderBy(questsTable.createdAt);
    res.json(quests);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/quests/daily", async (req, res) => {
  try {
    await ensureUser();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyQuests = await db.select().from(questsTable).where(
      and(
        eq(questsTable.userId, DEFAULT_USER_ID),
        eq(questsTable.questType, "daily"),
        gte(questsTable.expiresAt, today),
        lte(questsTable.expiresAt, tomorrow),
      )
    );
    res.json(dailyQuests);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/quests", async (req, res) => {
  try {
    await ensureUser();
    const { title, description, pillar, questType, xpReward, goldReward, deadline } = req.body;
    
    let expiresAt: Date | undefined;
    if (questType === "daily") {
      expiresAt = new Date();
      expiresAt.setHours(23, 59, 59, 999);
    } else if (questType === "weekly") {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    const [quest] = await db.insert(questsTable).values({
      userId: DEFAULT_USER_ID,
      title,
      description,
      pillar,
      questType: questType || "challenge",
      xpReward: xpReward || 50,
      goldReward: goldReward || 10,
      deadline: deadline ? new Date(deadline) : undefined,
      expiresAt,
      status: "active",
    }).returning();

    res.status(201).json(quest);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/quests/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, status, xpReward, goldReward, deadline } = req.body;
    
    const updates: Partial<typeof questsTable.$inferInsert> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (xpReward !== undefined) updates.xpReward = xpReward;
    if (goldReward !== undefined) updates.goldReward = goldReward;
    if (deadline !== undefined) updates.deadline = new Date(deadline);

    const [updated] = await db.update(questsTable).set(updates).where(
      and(eq(questsTable.id, id), eq(questsTable.userId, DEFAULT_USER_ID))
    ).returning();

    if (!updated) return res.status(404).json({ error: "Quest not found" });
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/quests/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(questsTable).where(and(eq(questsTable.id, id), eq(questsTable.userId, DEFAULT_USER_ID)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/quests/:id/complete", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await ensureUser();
    
    const [quest] = await db.select().from(questsTable).where(
      and(eq(questsTable.id, id), eq(questsTable.userId, DEFAULT_USER_ID))
    );
    if (!quest) return res.status(404).json({ error: "Quest not found" });
    if (quest.status !== "active") return res.status(400).json({ error: "Quest is not active" });

    const boosterMultiplier = user.streak >= 3 ? 1.5 : 1.0;
    const boosterApplied = user.streak >= 3;
    const xpEarned = Math.round(quest.xpReward * boosterMultiplier);
    const goldEarned = quest.goldReward;

    const [updatedQuest] = await db.update(questsTable).set({
      status: "completed",
      completedAt: new Date(),
    }).where(eq(questsTable.id, id)).returning();

    const newXp = user.xp + xpEarned;
    const newGold = user.gold + goldEarned;
    const oldLevel = calcLevel(user.xp);
    const newLevel = calcLevel(newXp);
    const leveledUp = newLevel > oldLevel;

    await db.update(usersTable).set({
      xp: newXp,
      gold: newGold,
      weeklyQuestsCompleted: user.weeklyQuestsCompleted + 1,
    }).where(eq(usersTable.id, DEFAULT_USER_ID));

    await db.insert(activityLogTable).values({
      userId: DEFAULT_USER_ID,
      type: "quest_complete",
      pillar: quest.pillar,
      title: `Completed quest: ${quest.title}`,
      description: `Earned ${xpEarned} XP and ${goldEarned} Gold`,
      xpEarned,
      goldEarned,
    });

    if (leveledUp) {
      await db.insert(activityLogTable).values({
        userId: DEFAULT_USER_ID,
        type: "level_up",
        title: `Level Up! Reached Level ${newLevel}`,
        description: `You have become more powerful! Kingdom grows stronger.`,
        xpEarned: 0,
        goldEarned: 0,
      });
    }

    res.json({
      quest: updatedQuest,
      xpEarned,
      goldEarned,
      leveledUp,
      newLevel: leveledUp ? newLevel : null,
      boosterApplied,
      boosterMultiplier,
      newUserXp: newXp,
      newUserGold: newGold,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
