import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import questsRouter from "./quests";
import healthLogsRouter from "./healthLogs";
import transactionsRouter from "./transactions";
import shopRouter from "./shop";
import groupQuestsRouter from "./groupQuests";
import mysteryBoxRouter from "./mysteryBox";
import activityRouter from "./activity";
import adminRouter from "./admin";
import { requireAuth, requireAdmin } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);

router.use(requireAuth);

router.use(usersRouter);
router.use(questsRouter);
router.use(healthLogsRouter);
router.use(transactionsRouter);
router.use(shopRouter);
router.use(groupQuestsRouter);
router.use(mysteryBoxRouter);
router.use(activityRouter);

router.use("/admin", requireAdmin, adminRouter);

export default router;
