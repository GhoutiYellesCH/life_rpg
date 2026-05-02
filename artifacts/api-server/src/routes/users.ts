import { Router, type IRouter } from "express";
import { db, usersTable, questsTable, healthLogsTable, transactionsTable } from "@workspace/db";
import { eq, sql, and, gte } from "drizzle-orm";

const router: IRouter = Router();

const DEFAULT_USER_ID = 1;

const XP_PER_LEVEL = 500;

function calcLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

function calcXpToNextLevel(xp: number): number {
  const level = calcLevel(xp);
  return level * XP_PER_LEVEL - xp;
}

async function ensureUser() {
  const existing = await db.select().from(usersTable).where(eq(usersTable.id, DEFAULT_USER_ID)).limit(1);
  if (existing.length === 0) {
    await db.insert(usersTable).values({ id: DEFAULT_USER_ID, username: "Hero", avatarName: "Warrior" });
  }
  return db.select().from(usersTable).where(eq(usersTable.id, DEFAULT_USER_ID)).limit(1).then(r => r[0]);
}

router.get("/users/me", async (req, res) => {
  try {
    const user = await ensureUser();
    const level = calcLevel(user.xp);
    const xpToNextLevel = calcXpToNextLevel(user.xp);
    res.json({ ...user, level, xpToNextLevel });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/users/me", async (req, res) => {
  try {
    const { username, avatarName } = req.body;
    await ensureUser();
    const updates: Partial<typeof usersTable.$inferInsert> = {};
    if (username) updates.username = username;
    if (avatarName) updates.avatarName = avatarName;
    const updated = await db.update(usersTable).set(updates).where(eq(usersTable.id, DEFAULT_USER_ID)).returning();
    const user = updated[0];
    const level = calcLevel(user.xp);
    const xpToNextLevel = calcXpToNextLevel(user.xp);
    res.json({ ...user, level, xpToNextLevel });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users/me/stats", async (req, res) => {
  try {
    const user = await ensureUser();
    const level = calcLevel(user.xp);
    const xpToNextLevel = calcXpToNextLevel(user.xp);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pillars = ["sports", "health", "goals", "finances"] as const;
    const pillarStats: Record<string, { activeQuests: number; completedToday: number; totalXpEarned: number; progress: number }> = {};

    for (const pillar of pillars) {
      const activeQuests = await db.select({ count: sql<number>`count(*)` })
        .from(questsTable)
        .where(and(eq(questsTable.userId, DEFAULT_USER_ID), eq(questsTable.pillar, pillar), eq(questsTable.status, "active")));
      
      const completedToday = await db.select({ count: sql<number>`count(*)` })
        .from(questsTable)
        .where(and(
          eq(questsTable.userId, DEFAULT_USER_ID),
          eq(questsTable.pillar, pillar),
          eq(questsTable.status, "completed"),
          gte(questsTable.completedAt, today)
        ));

      const totalCompleted = await db.select({ count: sql<number>`count(*)` })
        .from(questsTable)
        .where(and(eq(questsTable.userId, DEFAULT_USER_ID), eq(questsTable.pillar, pillar), eq(questsTable.status, "completed")));

      const totalActive = Number(activeQuests[0].count);
      const totalDone = Number(totalCompleted[0].count);
      const progress = totalActive + totalDone > 0 ? totalDone / (totalActive + totalDone) : 0;

      pillarStats[pillar] = {
        activeQuests: totalActive,
        completedToday: Number(completedToday[0].count),
        totalXpEarned: totalDone * 50,
        progress: Math.round(progress * 100) / 100,
      };
    }

    const totalQuestsCompleted = await db.select({ count: sql<number>`count(*)` })
      .from(questsTable)
      .where(and(eq(questsTable.userId, DEFAULT_USER_ID), eq(questsTable.status, "completed")));

    const boosterMultiplier = user.streak >= 3 ? 1.5 : 1.0;
    const activeBooster = user.streak >= 3 ? `${user.streak}-day streak: 1.5x XP` : null;

    res.json({
      user: { ...user, level, xpToNextLevel },
      pillars: pillarStats,
      totalQuestsCompleted: Number(totalQuestsCompleted[0].count),
      activeBooster,
      boosterMultiplier,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { ensureUser, calcLevel, calcXpToNextLevel, DEFAULT_USER_ID, XP_PER_LEVEL };
export default router;
