import { Router, type IRouter } from "express";
import { db, groupQuestsTable, activityLogTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { ensureUser, DEFAULT_USER_ID } from "./users";

const router: IRouter = Router();

function calcProgress(current: number, target: number): number {
  return target > 0 ? Math.min(Math.round((current / target) * 100) / 100, 1) : 0;
}

router.get("/group-quests", async (req, res) => {
  try {
    const quests = await db.select().from(groupQuestsTable);
    const result = quests.map(q => ({
      ...q,
      progress: calcProgress(q.currentValue, q.targetValue),
      memberCount: 1,
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/group-quests", async (req, res) => {
  try {
    await ensureUser();
    const { title, description, pillar, targetValue, unit, deadline } = req.body;
    const [quest] = await db.insert(groupQuestsTable).values({
      title,
      description,
      pillar,
      targetValue,
      unit,
      deadline: deadline ? new Date(deadline) : undefined,
      status: "active",
      createdById: DEFAULT_USER_ID,
    }).returning();

    res.status(201).json({ ...quest, progress: 0, memberCount: 1 });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/group-quests/:id/contribute", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { value } = req.body;

    const [quest] = await db.select().from(groupQuestsTable).where(eq(groupQuestsTable.id, id));
    if (!quest) return res.status(404).json({ error: "Group quest not found" });

    const newValue = Math.min(quest.currentValue + value, quest.targetValue);
    const status = newValue >= quest.targetValue ? "completed" : "active";

    const [updated] = await db.update(groupQuestsTable).set({
      currentValue: newValue,
      status: status as any,
    }).where(eq(groupQuestsTable.id, id)).returning();

    await db.insert(activityLogTable).values({
      userId: DEFAULT_USER_ID,
      type: "group_quest",
      pillar: quest.pillar,
      title: `Contributed to group quest: ${quest.title}`,
      description: `Added ${value} ${quest.unit}`,
    });

    res.json({ ...updated, progress: calcProgress(newValue, quest.targetValue), memberCount: 1 });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
