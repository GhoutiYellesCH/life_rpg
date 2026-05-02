import { Router, type IRouter } from "express";
import { db, healthLogsTable, usersTable, activityLogTable } from "@workspace/db";
import { eq, and, gte, desc } from "drizzle-orm";
import { ensureUser, DEFAULT_USER_ID } from "./users";

const router: IRouter = Router();

const XP_BY_TYPE: Record<string, number> = {
  workout: 40,
  meal: 20,
  sleep: 30,
  hydration: 10,
};

router.get("/health-logs", async (req, res) => {
  try {
    await ensureUser();
    const { type, limit } = req.query as { type?: string; limit?: string };
    const limitNum = parseInt(limit || "20");

    let query = db.select().from(healthLogsTable)
      .where(eq(healthLogsTable.userId, DEFAULT_USER_ID))
      .orderBy(desc(healthLogsTable.createdAt))
      .limit(limitNum);

    const logs = await query;
    const filtered = type ? logs.filter(l => l.type === type) : logs;
    res.json(filtered);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/health-logs", async (req, res) => {
  try {
    const user = await ensureUser();
    const { type, label, value, unit, notes } = req.body;

    const xpEarned = XP_BY_TYPE[type] || 20;

    const [log] = await db.insert(healthLogsTable).values({
      userId: DEFAULT_USER_ID,
      type,
      label,
      value,
      unit,
      xpEarned,
      notes,
    }).returning();

    // Update streak logic
    const today = new Date().toISOString().split("T")[0];
    const lastLogin = user.lastLoginDate;
    let newStreak = user.streak;
    let boosterActivated = false;

    if (lastLogin !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (lastLogin === yesterdayStr) {
        newStreak = user.streak + 1;
      } else if (!lastLogin) {
        newStreak = 1;
      } else {
        // Streak broken — remove aura
        newStreak = 1;
        await db.update(usersTable).set({ hasAura: false }).where(eq(usersTable.id, DEFAULT_USER_ID));
      }

      if (newStreak >= 3) boosterActivated = true;
      // Award aura on 7-day streak
      const hasAura = newStreak >= 7;

      await db.update(usersTable).set({
        xp: user.xp + xpEarned,
        streak: newStreak,
        longestStreak: Math.max(user.longestStreak, newStreak),
        lastLoginDate: today,
        hasAura,
      }).where(eq(usersTable.id, DEFAULT_USER_ID));
    } else {
      await db.update(usersTable).set({ xp: user.xp + xpEarned })
        .where(eq(usersTable.id, DEFAULT_USER_ID));
    }

    await db.insert(activityLogTable).values({
      userId: DEFAULT_USER_ID,
      type: "health_log",
      pillar: "health",
      title: `Logged ${label}`,
      description: `${value} ${unit} — earned ${xpEarned} XP`,
      xpEarned,
    });

    res.status(201).json({
      log,
      xpEarned,
      streakUpdated: true,
      newStreak,
      boosterActivated,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
