import { useState } from "react";
import { useGetQuests, useCreateQuest, useCompleteQuest, useDeleteQuest, getGetQuestsQueryKey, getGetUserStatsQueryKey, getGetActivityFeedQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Sword, Heart, Target, Coins, Plus, CheckCircle, Clock, Trash2, Trophy, Zap } from "lucide-react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const PILLAR_CONFIG = {
  sports: { icon: Sword, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30", label: "Sports" },
  health: { icon: Heart, color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/30", label: "Health" },
  goals: { icon: Target, color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/30", label: "Goals" },
  finances: { icon: Coins, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30", label: "Finances" },
};

type QuestForm = {
  title: string;
  description: string;
  pillar: string;
  questType: string;
  xpReward: number;
  goldReward: number;
};

export default function Quests() {
  const [filterPillar, setFilterPillar] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [completionReward, setCompletionReward] = useState<{ xp: number; gold: number; leveledUp: boolean; newLevel?: number | null } | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params: Record<string, string> = {};
  if (filterPillar !== "all") params.pillar = filterPillar;
  if (filterStatus !== "all") params.status = filterStatus;

  const { data: quests, isLoading } = useGetQuests(params as any);
  const createQuest = useCreateQuest();
  const completeQuest = useCompleteQuest();
  const deleteQuest = useDeleteQuest();

  const form = useForm<QuestForm>({
    defaultValues: { title: "", description: "", pillar: "sports", questType: "challenge", xpReward: 50, goldReward: 10 },
  });

  async function onSubmit(data: QuestForm) {
    try {
      await createQuest.mutateAsync({
        data: {
          title: data.title,
          description: data.description,
          pillar: data.pillar as any,
          questType: data.questType as any,
          xpReward: Number(data.xpReward),
          goldReward: Number(data.goldReward),
        },
      });
      queryClient.invalidateQueries({ queryKey: getGetQuestsQueryKey(params as any) });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Quest created!", description: "A new challenge awaits your kingdom." });
    } catch {
      toast({ title: "Failed to create quest", variant: "destructive" });
    }
  }

  async function handleComplete(id: number) {
    try {
      const result = await completeQuest.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getGetQuestsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetUserStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetActivityFeedQueryKey() });
      setCompletionReward({ xp: result.xpEarned, gold: result.goldEarned, leveledUp: result.leveledUp, newLevel: result.newLevel });
    } catch {
      toast({ title: "Could not complete quest", variant: "destructive" });
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteQuest.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getGetQuestsQueryKey() });
      toast({ title: "Quest removed" });
    } catch {
      toast({ title: "Failed to delete quest", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif">Quest Log</h1>
          <p className="text-muted-foreground mt-1">Every quest completed strengthens the Kingdom.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-create-quest">
              <Plus className="w-4 h-4" /> New Quest
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif">Forge a New Quest</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quest Title</FormLabel>
                    <FormControl><Input placeholder="Conquer the morning run..." {...field} data-testid="input-quest-title" /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea placeholder="What must be done..." {...field} /></FormControl>
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="pillar" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pillar</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger data-testid="select-pillar"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="sports">Sports</SelectItem>
                          <SelectItem value="health">Health</SelectItem>
                          <SelectItem value="goals">Goals</SelectItem>
                          <SelectItem value="finances">Finances</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="questType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="challenge">Challenge</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="xpReward" render={({ field }) => (
                    <FormItem>
                      <FormLabel>XP Reward</FormLabel>
                      <FormControl><Input type="number" min={1} {...field} data-testid="input-xp-reward" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="goldReward" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gold Reward</FormLabel>
                      <FormControl><Input type="number" min={0} {...field} data-testid="input-gold-reward" /></FormControl>
                    </FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full" disabled={createQuest.isPending}>
                  {createQuest.isPending ? "Creating..." : "Forge Quest"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filterPillar} onValueChange={setFilterPillar}>
          <SelectTrigger className="w-36" data-testid="select-filter-pillar">
            <SelectValue placeholder="All Pillars" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pillars</SelectItem>
            <SelectItem value="sports">Sports</SelectItem>
            <SelectItem value="health">Health</SelectItem>
            <SelectItem value="goals">Goals</SelectItem>
            <SelectItem value="finances">Finances</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36" data-testid="select-filter-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      )}

      {!isLoading && quests?.length === 0 && (
        <Card className="border-dashed border-border">
          <CardContent className="p-12 text-center">
            <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="font-semibold text-lg font-serif">No quests found</p>
            <p className="text-muted-foreground text-sm mt-1">Your kingdom awaits — forge your first quest.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <AnimatePresence>
          {quests?.map((quest) => {
            const cfg = PILLAR_CONFIG[quest.pillar as keyof typeof PILLAR_CONFIG];
            const Icon = cfg?.icon || Target;
            return (
              <motion.div
                key={quest.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className={`border ${cfg?.border || "border-border"} hover:shadow-md transition-all`} data-testid={`quest-item-${quest.id}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full ${cfg?.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon className={`w-5 h-5 ${cfg?.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{quest.title}</h3>
                          <Badge variant="outline" className="text-xs capitalize">{quest.questType}</Badge>
                          {quest.status === "completed" && <Badge className="bg-emerald-400/10 text-emerald-400 border-emerald-400/30 text-xs">Completed</Badge>}
                          {quest.status === "expired" && <Badge variant="destructive" className="text-xs">Expired</Badge>}
                        </div>
                        {quest.description && <p className="text-sm text-muted-foreground mt-1">{quest.description}</p>}
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-primary font-medium flex items-center gap-1"><Zap className="w-3 h-3" />{quest.xpReward} XP</span>
                          <span className="text-sm text-amber-400 font-medium flex items-center gap-1"><Coins className="w-3 h-3" />{quest.goldReward} Gold</span>
                          {quest.expiresAt && quest.status === "active" && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />Expires {new Date(quest.expiresAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {quest.status === "active" && (
                          <Button size="sm" onClick={() => handleComplete(quest.id)} disabled={completeQuest.isPending} data-testid={`button-complete-quest-${quest.id}`}>
                            Complete
                          </Button>
                        )}
                        {quest.status === "completed" && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(quest.id)} data-testid={`button-delete-quest-${quest.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Completion Reward Overlay */}
      <AnimatePresence>
        {completionReward && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCompletionReward(null)}
          >
            <motion.div
              className="bg-card border border-primary/50 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl shadow-primary/20"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 12 }}
            >
              <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              {completionReward.leveledUp && (
                <div className="text-2xl font-bold font-serif text-primary mb-2">Level Up!</div>
              )}
              <h3 className="text-xl font-bold font-serif mb-4">Quest Complete!</h3>
              <div className="flex justify-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">+{completionReward.xp}</p>
                  <p className="text-xs text-muted-foreground">XP Earned</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-400">+{completionReward.gold}</p>
                  <p className="text-xs text-muted-foreground">Gold Earned</p>
                </div>
              </div>
              <Button className="mt-6 w-full" onClick={() => setCompletionReward(null)}>Claim!</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
