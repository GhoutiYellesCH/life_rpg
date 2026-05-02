import { useState } from "react";
import { useGetMe, useUpdateMe, useGetUserStats, getGetMeQueryKey, getGetUserStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Flame, Star, Trophy, Zap, Coins, Target, Sword, Heart, Edit3, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { data: user, isLoading: userLoading } = useGetMe();
  const { data: stats, isLoading: statsLoading } = useGetUserStats();
  const updateMe = useUpdateMe();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [usernameVal, setUsernameVal] = useState("");
  const [avatarVal, setAvatarVal] = useState("");

  function startEditUsername() { setUsernameVal(user?.username || ""); setEditingUsername(true); }
  function startEditAvatar() { setAvatarVal(user?.avatarName || ""); setEditingAvatar(true); }

  async function saveUsername() {
    try {
      await updateMe.mutateAsync({ data: { username: usernameVal } });
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetUserStatsQueryKey() });
      setEditingUsername(false);
      toast({ title: "Username updated!" });
    } catch { toast({ title: "Failed to update", variant: "destructive" }); }
  }

  async function saveAvatar() {
    try {
      await updateMe.mutateAsync({ data: { avatarName: avatarVal } });
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      setEditingAvatar(false);
      toast({ title: "Avatar name updated!" });
    } catch { toast({ title: "Failed to update", variant: "destructive" }); }
  }

  const isLoading = userLoading || statsLoading;

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-60 w-full" /><Skeleton className="h-40 w-full" /></div>;
  }

  const xpCurrentLevel = (user?.xp || 0) % 500;
  const xpPct = (xpCurrentLevel / 500) * 100;

  const PILLAR_DATA = stats ? [
    { label: "Sports", icon: Sword, color: "text-emerald-400", stats: stats.pillars.sports },
    { label: "Health", icon: Heart, color: "text-rose-400", stats: stats.pillars.health },
    { label: "Goals", icon: Target, color: "text-violet-400", stats: stats.pillars.goals },
    { label: "Finances", icon: Coins, color: "text-amber-400", stats: stats.pillars.finances },
  ] : [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-serif">Hero Profile</h1>
        <p className="text-muted-foreground mt-1">Your legend grows with every action.</p>
      </div>

      {/* Profile Card */}
      <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5">
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            <div className="relative">
              <div className={`w-24 h-24 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center shadow-xl shadow-primary/20 ${user?.hasAura ? "ring-4 ring-violet-400/60 ring-offset-2 ring-offset-background" : ""}`}>
                <Shield className="w-12 h-12 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-sm font-bold w-9 h-9 rounded-full flex items-center justify-center border-2 border-background">
                {user?.level}
              </div>
              {user?.hasAura && (
                <motion.div
                  className="absolute -inset-2 rounded-full border-2 border-violet-400/40"
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>

            <div className="flex-1 space-y-4">
              {/* Username */}
              <div>
                {editingUsername ? (
                  <div className="flex items-center gap-2">
                    <Input value={usernameVal} onChange={e => setUsernameVal(e.target.value)} className="max-w-xs text-xl font-bold" data-testid="input-username" />
                    <Button size="sm" onClick={saveUsername} disabled={updateMe.isPending}><Check className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingUsername(false)}><X className="w-4 h-4" /></Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold font-serif">{user?.username}</h2>
                    <Button size="sm" variant="ghost" onClick={startEditUsername} data-testid="button-edit-username"><Edit3 className="w-4 h-4" /></Button>
                  </div>
                )}
              </div>

              {/* Avatar Name */}
              <div>
                {editingAvatar ? (
                  <div className="flex items-center gap-2">
                    <Input value={avatarVal} onChange={e => setAvatarVal(e.target.value)} className="max-w-xs" placeholder="Avatar class name..." data-testid="input-avatar-name" />
                    <Button size="sm" onClick={saveAvatar} disabled={updateMe.isPending}><Check className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingAvatar(false)}><X className="w-4 h-4" /></Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{user?.avatarName}</span>
                    <Button size="sm" variant="ghost" onClick={startEditAvatar} data-testid="button-edit-avatar"><Edit3 className="w-3 h-3" /></Button>
                  </div>
                )}
              </div>

              {/* XP Bar */}
              <div className="space-y-1 max-w-sm">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Level {user?.level}</span>
                  <span>{user?.xp} / {(user?.level || 1) * 500} XP</span>
                </div>
                <Progress value={xpPct} className="h-3" />
                <p className="text-xs text-muted-foreground">{user?.xpToNextLevel} XP to Level {(user?.level || 1) + 1}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-amber-400/30 bg-amber-400/5">
          <CardContent className="p-4 text-center">
            <Coins className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-400">{user?.gold}</p>
            <p className="text-xs text-muted-foreground">Gold</p>
          </CardContent>
        </Card>
        <Card className="border-amber-400/30 bg-amber-400/5">
          <CardContent className="p-4 text-center">
            <Flame className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-400">{user?.streak}</p>
            <p className="text-xs text-muted-foreground">Current Streak</p>
          </CardContent>
        </Card>
        <Card className="border-violet-400/30 bg-violet-400/5">
          <CardContent className="p-4 text-center">
            <Star className="w-8 h-8 text-violet-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-violet-400">{user?.longestStreak}</p>
            <p className="text-xs text-muted-foreground">Best Streak</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 text-center">
            <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-primary">{stats?.totalQuestsCompleted}</p>
            <p className="text-xs text-muted-foreground">Quests Done</p>
          </CardContent>
        </Card>
      </div>

      {/* Pillar Summary */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Pillar Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {PILLAR_DATA.map(({ label, icon: Icon, color, stats: ps }) => (
              <div key={label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="font-medium">{label}</span>
                  </div>
                  <span className="text-muted-foreground">{ps.activeQuests} active • {ps.completedToday} today</span>
                </div>
                <Progress value={ps.progress * 100} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Aura Status */}
      {user?.hasAura && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-lg border border-violet-400/40 bg-violet-400/5 flex items-center gap-3"
        >
          <Shield className="w-6 h-6 text-violet-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-violet-400">Aura of the Devoted — Active</p>
            <p className="text-sm text-muted-foreground">Maintained a 7+ day streak. Your avatar radiates divine power.</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
