import { useState } from "react";
import { useGetTransactions, useCreateTransaction, useGetTransactionSummary, getGetTransactionsQueryKey, getGetTransactionSummaryQueryKey, getGetUserStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, Plus, TrendingUp, TrendingDown, PiggyBank, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type TxForm = { category: string; description: string; amount: number; type: string };

const TYPE_CONFIG = {
  income: { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30", icon: ArrowUpCircle, label: "Income" },
  saving: { color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/30", icon: PiggyBank, label: "Saving" },
  expense: { color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/30", icon: ArrowDownCircle, label: "Expense" },
};

const CHART_COLORS = ["#a78bfa", "#34d399", "#f59e0b", "#f87171", "#60a5fa", "#fb923c"];

export default function Finances() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: transactions, isLoading } = useGetTransactions({ limit: 30 });
  const { data: summary } = useGetTransactionSummary();
  const createTx = useCreateTransaction();

  const form = useForm<TxForm>({
    defaultValues: { category: "", description: "", amount: 0, type: "expense" },
  });

  async function onSubmit(data: TxForm) {
    try {
      await createTx.mutateAsync({
        data: { category: data.category, description: data.description, amount: Number(data.amount), type: data.type as any },
      });
      queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetTransactionSummaryQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetUserStatsQueryKey() });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Transaction logged!", description: "Your ledger has been updated." });
    } catch {
      toast({ title: "Failed to log transaction", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif">Finance Ledger</h1>
          <p className="text-muted-foreground mt-1">Every Gold saved strengthens the treasury.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-transaction">
              <Plus className="w-4 h-4" /> Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif">Record Transaction</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger data-testid="select-tx-type"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="saving">Saving</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl><Input placeholder="Groceries, Salary, Rent..." {...field} data-testid="input-tx-category" /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl><Input placeholder="Details..." {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl><Input type="number" step="0.01" min={0} {...field} data-testid="input-tx-amount" /></FormControl>
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createTx.isPending}>
                  {createTx.isPending ? "Recording..." : "Record"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-emerald-400/30 bg-emerald-400/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-muted-foreground">Total Income</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400">${summary.totalIncome.toFixed(0)}</p>
            </CardContent>
          </Card>
          <Card className="border-rose-400/30 bg-rose-400/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-rose-400" />
                <span className="text-xs text-muted-foreground">Total Expenses</span>
              </div>
              <p className="text-2xl font-bold text-rose-400">${summary.totalExpenses.toFixed(0)}</p>
            </CardContent>
          </Card>
          <Card className="border-violet-400/30 bg-violet-400/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <PiggyBank className="w-4 h-4 text-violet-400" />
                <span className="text-xs text-muted-foreground">Saved</span>
              </div>
              <p className="text-2xl font-bold text-violet-400">${summary.totalSavings.toFixed(0)}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-400/30 bg-amber-400/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-muted-foreground">Gold This Month</span>
              </div>
              <p className="text-2xl font-bold text-amber-400">+{summary.goldEarnedThisMonth}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        {summary && summary.monthlyTrend.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Monthly Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={summary.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="income" fill="#34d399" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#f87171" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="savings" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 justify-center mt-2 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />Income</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />Expenses</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-violet-400 inline-block" />Savings</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Breakdown */}
        {summary && summary.budgetCategories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {summary.budgetCategories.slice(0, 6).map((cat, i) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{cat.category}</span>
                      <span className="text-muted-foreground">${cat.amount.toFixed(0)} ({cat.percentage}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.percentage}%` }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transaction List */}
      <div>
        <h2 className="font-semibold text-lg font-serif mb-3">Recent Transactions</h2>
        {isLoading && <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>}
        {!isLoading && (!transactions || transactions.length === 0) && (
          <Card className="border-dashed border-border">
            <CardContent className="p-12 text-center">
              <Coins className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="font-semibold font-serif">No transactions yet</p>
              <p className="text-muted-foreground text-sm">Log your income and spending to build the treasury.</p>
            </CardContent>
          </Card>
        )}
        <div className="space-y-2">
          {transactions?.map((tx) => {
            const cfg = TYPE_CONFIG[tx.type as keyof typeof TYPE_CONFIG];
            const Icon = cfg?.icon || Coins;
            return (
              <motion.div key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className={`border ${cfg?.border || "border-border"}`} data-testid={`tx-item-${tx.id}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-full ${cfg?.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${cfg?.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{tx.category}</span>
                        <Badge variant="outline" className="text-xs">{tx.type}</Badge>
                      </div>
                      {tx.description && <p className="text-xs text-muted-foreground truncate">{tx.description}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold ${tx.type === "expense" ? "text-rose-400" : "text-emerald-400"}`}>
                        {tx.type === "expense" ? "-" : "+"}${tx.amount.toFixed(2)}
                      </p>
                      {tx.goldEarned > 0 && <p className="text-xs text-amber-400">+{tx.goldEarned} Gold</p>}
                      <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
