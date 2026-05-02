import { Router, type IRouter } from "express";
import { db, transactionsTable, usersTable, activityLogTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { ensureUser, DEFAULT_USER_ID } from "./users";

const router: IRouter = Router();

router.get("/transactions", async (req, res) => {
  try {
    await ensureUser();
    const { limit, type } = req.query as { limit?: string; type?: string };
    const limitNum = parseInt(limit || "20");

    let all = await db.select().from(transactionsTable)
      .where(eq(transactionsTable.userId, DEFAULT_USER_ID))
      .orderBy(desc(transactionsTable.createdAt))
      .limit(limitNum);

    if (type) all = all.filter(t => t.type === type);
    res.json(all);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/transactions", async (req, res) => {
  try {
    const user = await ensureUser();
    const { category, description, amount, type } = req.body;

    // Gold earned only from savings
    const goldEarned = type === "saving" ? Math.floor(amount / 10) : 0;

    const [tx] = await db.insert(transactionsTable).values({
      userId: DEFAULT_USER_ID,
      category,
      description,
      amount,
      type,
      goldEarned,
    }).returning();

    if (goldEarned > 0) {
      await db.update(usersTable).set({ gold: user.gold + goldEarned }).where(eq(usersTable.id, DEFAULT_USER_ID));
    }

    await db.insert(activityLogTable).values({
      userId: DEFAULT_USER_ID,
      type: "transaction",
      pillar: "finances",
      title: `${type === "saving" ? "Saved" : type === "income" ? "Earned" : "Spent"}: ${category}`,
      description: `$${amount.toFixed(2)}${goldEarned > 0 ? ` — earned ${goldEarned} Gold` : ""}`,
      goldEarned: goldEarned || null,
    });

    res.status(201).json(tx);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/transactions/summary", async (req, res) => {
  try {
    await ensureUser();

    const all = await db.select().from(transactionsTable)
      .where(eq(transactionsTable.userId, DEFAULT_USER_ID));

    const income = all.filter(t => t.type === "income");
    const expenses = all.filter(t => t.type === "expense");
    const savings = all.filter(t => t.type === "saving");

    const totalIncome = income.reduce((s, t) => s + t.amount, 0);
    const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
    const totalSavings = savings.reduce((s, t) => s + t.amount, 0);
    const savingsRate = totalIncome > 0 ? totalSavings / totalIncome : 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = all.filter(t => new Date(t.createdAt) >= monthStart);
    const goldEarnedThisMonth = thisMonth.filter(t => t.type === "saving").reduce((s, t) => s + t.goldEarned, 0);

    // Category breakdown
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });
    const budgetCategories = Object.entries(expensesByCategory).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount);

    // Monthly trend (last 6 months)
    const months: { month: string; income: number; expenses: number; savings: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const label = d.toLocaleString("default", { month: "short" });
      const monthTx = all.filter(t => {
        const td = new Date(t.createdAt);
        return td >= d && td < nextD;
      });
      months.push({
        month: label,
        income: monthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
        expenses: monthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
        savings: monthTx.filter(t => t.type === "saving").reduce((s, t) => s + t.amount, 0),
      });
    }

    res.json({
      totalIncome,
      totalExpenses,
      totalSavings,
      savingsRate: Math.round(savingsRate * 100) / 100,
      goldEarnedThisMonth,
      budgetCategories,
      monthlyTrend: months,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
