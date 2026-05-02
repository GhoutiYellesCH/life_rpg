import { Router, type IRouter } from "express";
import { db, activityLogTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { ensureUser, DEFAULT_USER_ID } from "./users";

const router: IRouter = Router();

router.get("/activity", async (req, res) => {
  try {
    await ensureUser();
    const { limit } = req.query as { limit?: string };
    const limitNum = parseInt(limit || "20");

    const events = await db.select().from(activityLogTable)
      .where(eq(activityLogTable.userId, DEFAULT_USER_ID))
      .orderBy(desc(activityLogTable.createdAt))
      .limit(limitNum);

    res.json(events);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
