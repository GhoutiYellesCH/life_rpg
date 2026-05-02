import { useGetUserStats, useGetDailyQuests, useGetActivityFeed, useGetMysteryBoxStatus, useOpenMysteryBox, useCompleteQuest, getGetUserStatsQueryKey, getGetDailyQuestsQueryKey, getGetMysteryBoxStatusQueryKey, getGetActivityFeedQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Sword, Heart, Target, Coins, Flame, Star, Package, Zap, Trophy, CheckCircle, Clock, Activity, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const PILLAR_CONFIG = {
  sports: { icon: Sword, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30", glow: "shadow-emerald-400/20" },
  health: { icon: Heart, color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/30", glow: "shadow-rose-400/20" },
  goals: { icon: Target, color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/30", glow: "shadow-violet-400/20" },
  finances: { icon: Coins, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30", glow: "shadow-amber-400/20" },
};

function useCountdown(expiresAt: string | null | undefined) {
  if (!expiresAt) return null;
  const now = Date.now();
  const diff = new Date(expiresAt).getTime() - now;
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}

function QuestTimer({ expiresAt }: { expiresAt: string | null | undefined }) {
  const countdown = useCountdown(expiresAt);
  if (!countdown) return null;
  return (
    <span className="flex items-center gap-1 text-xs text-amber-400">
      <Clock className="w-3 h-3" /> {countdown}
    </span>
  );
}

function XpBar({ xp, xpToNextLevel, level }: { xp: number; xpToNextLevel: number; level: number }) {
  const total = xp % 500 + xpToNextLevel === 500 ? 500 : (xp % 500) + xpToNextLevel;
  const current = xp % 500;
  const pct = Math.min((current / total) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Level {level}</span>
        <span className="text-primary font-mono">{xp} XP</span>
        <span className="text-muted-foreground">Level {level + 1}</span>
      </div>
      <div className="h-3 w-full bg-muted rounded-full overflow-hidden relative">
        <motion.div
          className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full relative"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <div className="absolute inset-0 bg-white/20 rounded-full" />
        </motion.div>
      </div>
      <p className="text-xs text-center text-muted-foreground">{xpToNextLevel} XP to next level</p>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useGetUserStats();
  const { data: dailyQuests } = useGetDailyQuests();
  const { data: activity } = useGetActivityFeed({ limit: 8 });
  const { data: mysteryStatus } = useGetMysteryBoxStatus();
  const completeQuest = useCompleteQuest();
  const openBox = useOpenMysteryBox();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [boxOpen, setBoxOpen] = useState(false);
  const [reward, setReward] = useState<{ message: string; rewardType: string } | null>(null);

  async function handleCompleteQuest(id: number) {
    try {
      const result = await completeQuest.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getGetUserStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDailyQuestsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetActivityFeedQueryKey() });
      toast({
        title: result.leveledUp ? `Level Up! You reached Level ${result.newLevel}!` : "Quest Complete!",
        description: `+${result.xpEarned} XP, +${result.goldEarned} Gold${result.boosterApplied ? ` (${result.boosterMultiplier}x boost!)` : ""}`,
      });
    } catch {
      toast({ title: "Failed to complete quest", variant: "destructive" });
    }
  }

  async function handleOpenBox() {
    try {
      const result = await openBox.mutateAsync();
      setReward(result);
      setBoxOpen(true);
      queryClient.invalidateQueries({ queryKey: getGetUserStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMysteryBoxStatusQueryKey() });
    } catch {
      toast({ title: "Not enough quests completed this week", variant: "destructive" });
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground tracking-wide">
            Kingdom Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Your realm's fate depends on your actions today.</p>
        </div>
        {stats?.activeBooster && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400"
          >
            <Zap className="w-4 h-4" />
            <span className="font-semibold text-sm">{stats.activeBooster}</span>
          </motion.div>
        )}
      </div>

      {/* Hero Card */}
      {stats && (
        <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5 shadow-lg shadow-primary/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="relative">
                <div className={`w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center shadow-lg shadow-primary/30 ${stats.user.hasAura ? "ring-2 ring-violet-400 ring-offset-2 ring-offset-background" : ""}`}>
                  <Shield className="w-10 h-10 text-primary" />
                </div>
                {stats.user.hasAura && (
                  <motion.div
                    className="absolute -inset-1 rounded-full border-2 border-violet-400/50"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center border-2 border-background">
                  {stats.user.level}
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold font-serif">{stats.user.username}</h2>
                  <div className="flex items-center gap-1 text-amber-400">
                    <Flame className="w-4 h-4" />
                    <span className="font-semibold">{stats.user.streak} day streak</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    <Coins className="w-4 h-4" />
                    <span className="font-semibold">{stats.user.gold} Gold</span>
                  </div>
                </div>
                <XpBar xp={stats.user.xp} xpToNextLevel={stats.user.xpToNextLevel} level={stats.user.level} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pillar Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(Object.entries(stats.pillars) as [keyof typeof PILLAR_CONFIG, typeof stats.pillars.sports][]).map(([pillar, data]) => {
            const cfg = PILLAR_CONFIG[pillar];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={pillar}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className={`border ${cfg.border} ${cfg.bg} shadow-lg ${cfg.glow}`} data-testid={`pillar-card-${pillar}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                      <span className="font-semibold capitalize text-sm">{pillar}</span>
                    </div>
                    <div className="space-y-2">
                      <Progress value={data.progress * 100} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{data.completedToday} done today</span>
                        <span>{data.activeQuests} active</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Quests */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-lg font-bold font-serif text-foreground flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            Daily Quests
          </h2>
          {dailyQuests && dailyQuests.length === 0 && (
            <Card className="border-dashed border-border">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No daily quests yet</p>
                <p className="text-sm">Your kingdom awaits — create daily quests to begin your legend.</p>
              </CardContent>
            </Card>
          )}
          <div className="space-y-2">
            {dailyQuests?.map((quest) => {
              const cfg = PILLAR_CONFIG[quest.pillar as keyof typeof PILLAR_CONFIG];
              const Icon = cfg?.icon || Target;
              return (
                <motion.div
                  key={quest.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Card className={`border ${cfg?.border || "border-border"} hover:shadow-md transition-shadow`} data-testid={`quest-card-${quest.id}`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full ${cfg?.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${cfg?.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{quest.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-primary">+{quest.xpReward} XP</span>
                          <span className="text-xs text-amber-400">+{quest.goldReward} Gold</span>
                          <QuestTimer expiresAt={quest.expiresAt} />
                        </div>
                      </div>
                      {quest.status === "completed" ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-primary/50 text-primary hover:bg-primary/10 flex-shrink-0"
                          onClick={() => handleCompleteQuest(quest.id)}
                          disabled={completeQuest.isPending}
                          data-testid={`button-complete-${quest.id}`}
                        >
                          Complete
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Mystery Box */}
          {mysteryStatus && (
            <Card className="border-amber-400/30 bg-amber-400/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  Mystery Box
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={(mysteryStatus.weeklyQuestsCompleted / mysteryStatus.weeklyQuestsRequired) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {mysteryStatus.weeklyQuestsCompleted}/{mysteryStatus.weeklyQuestsRequired} weekly quests
                </p>
                <Button
                  className="w-full"
                  disabled={!mysteryStatus.available || openBox.isPending}
                  onClick={handleOpenBox}
                  data-testid="button-open-mystery-box"
                >
                  {mysteryStatus.available ? "Open Mystery Box!" : "Not Ready Yet"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Activity Feed */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {activity?.slice(0, 6).map((event) => (
                <div key={event.id} className="flex items-start gap-2 text-xs" data-testid={`activity-event-${event.id}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{event.title}</p>
                    {event.xpEarned && <span className="text-primary">+{event.xpEarned} XP</span>}
                  </div>
                </div>
              ))}
              {(!activity || activity.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-4">No activity yet. Start your legend!</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mystery Box Reward Modal */}
      <AnimatePresence>
        {boxOpen && reward && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setBoxOpen(false); setReward(null); }}
          >
            <motion.div
              className="bg-card border border-amber-400/50 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl shadow-amber-400/20"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Package className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-2xl font-bold font-serif text-amber-400 mb-2">Mystery Box!</h2>
              <p className="text-foreground leading-relaxed">{reward.message}</p>
              <Button className="mt-6 w-full" onClick={() => { setBoxOpen(false); setReward(null); }}>
                Claim Reward
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
