import { Router, type IRouter } from "express";
import { db, usersTable, activityLogTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ensureUser, DEFAULT_USER_ID } from "./users";

const router: IRouter = Router();

const WEEKLY_QUESTS_REQUIRED = 5;

router.get("/mystery-box/status", async (req, res) => {
  try {
    const user = await ensureUser();
    const available = user.weeklyQuestsCompleted >= WEEKLY_QUESTS_REQUIRED;
    res.json({
      available,
      weeklyQuestsCompleted: user.weeklyQuestsCompleted,
      weeklyQuestsRequired: WEEKLY_QUESTS_REQUIRED,
      nextAvailableAt: null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/mystery-box/open", async (req, res) => {
  try {
    const user = await ensureUser();

    if (user.weeklyQuestsCompleted < WEEKLY_QUESTS_REQUIRED) {
      return res.status(400).json({ error: "Not enough weekly quests completed" });
    }

    const rewardTypes = ["gold", "xp", "booster"] as const;
    const rewardType = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];

    let goldAmount: number | null = null;
    let xpAmount: number | null = null;
    let boosterType: string | null = null;
    let message = "";

    if (rewardType === "gold") {
      goldAmount = Math.floor(Math.random() * 150) + 50;
      message = `Fortune favors the brave! You found ${goldAmount} Gold coins gleaming in the mystery chest.`;
      await db.update(usersTable).set({ gold: user.gold + goldAmount, weeklyQuestsCompleted: 0 }).where(eq(usersTable.id, DEFAULT_USER_ID));
    } else if (rewardType === "xp") {
      xpAmount = Math.floor(Math.random() * 200) + 100;
      message = `Ancient wisdom flows through you! You gained ${xpAmount} XP from the enchanted tome.`;
      await db.update(usersTable).set({ xp: user.xp + xpAmount, weeklyQuestsCompleted: 0 }).where(eq(usersTable.id, DEFAULT_USER_ID));
    } else {
      boosterType = "2x XP for next 3 quests";
      message = `A powerful enchantment surrounds you! The next 3 quests reward double XP.`;
      await db.update(usersTable).set({ weeklyQuestsCompleted: 0 }).where(eq(usersTable.id, DEFAULT_USER_ID));
    }

    await db.insert(activityLogTable).values({
      userId: DEFAULT_USER_ID,
      type: "mystery_box",
      title: "Mystery Box Opened!",
      description: message,
      xpEarned: xpAmount,
      goldEarned: goldAmount,
    });

    res.json({ rewardType, goldAmount, xpAmount, itemName: null, boosterType, message });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
