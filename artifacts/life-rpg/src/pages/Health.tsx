import { useState } from "react";
import { useGetHealthLogs, useCreateHealthLog, useGetUserStats, getGetHealthLogsQueryKey, getGetUserStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Dumbbell, Utensils, Moon, Droplets, Plus, Flame, Shield, Zap } from "lucide-react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const TYPE_CONFIG = {
  workout: { icon: Dumbbell, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30", label: "Workout", defaultUnit: "minutes" },
  meal: { icon: Utensils, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30", label: "Meal", defaultUnit: "servings" },
  sleep: { icon: Moon, color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/30", label: "Sleep", defaultUnit: "hours" },
  hydration: { icon: Droplets, color: "text-sky-400", bg: "bg-sky-400/10", border: "border-sky-400/30", label: "Hydration", defaultUnit: "liters" },
};

type LogForm = { type: string; label: string; value: number; unit: string; notes: string };

export default function Health() {
  const [filterType, setFilterType] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: stats } = useGetUserStats();
  const { data: logs, isLoading } = useGetHealthLogs({ limit: 30 });
  const createLog = useCreateHealthLog();

  const form = useForm<LogForm>({
    defaultValues: { type: "workout", label: "", value: 0, unit: "minutes", notes: "" },
  });

  const watchType = form.watch("type");
  const cfg = TYPE_CONFIG[watchType as keyof typeof TYPE_CONFIG];

  async function onSubmit(data: LogForm) {
    try {
      const result = await createLog.mutateAsync({
        data: {
          type: data.type as any,
          label: data.label,
          value: Number(data.value),
          unit: data.unit,
          notes: data.notes || undefined,
        },
      });
      queryClient.invalidateQueries({ queryKey: getGetHealthLogsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetUserStatsQueryKey() });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Activity logged!",
        description: `Earned ${result.xpEarned} XP${result.streakUpdated ? ` • Streak: ${result.newStreak} days` : ""}${result.boosterActivated ? " • Booster activated!" : ""}`,
      });
    } catch {
      toast({ title: "Failed to log activity", variant: "destructive" });
    }
  }

  const filtered = logs?.filter(l => filterType === "all" || l.type === filterType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif">Health Tracker</h1>
          <p className="text-muted-foreground mt-1">Every healthy action fortifies the Kingdom.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-log-health">
              <Plus className="w-4 h-4" /> Log Activity
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif">Log Health Activity</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Type</FormLabel>
                    <Select onValueChange={(v) => { field.onChange(v); form.setValue("unit", TYPE_CONFIG[v as keyof typeof TYPE_CONFIG]?.defaultUnit || ""); }} defaultValue={field.value}>
                      <FormControl><SelectTrigger data-testid="select-activity-type"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="workout">Workout</SelectItem>
                        <SelectItem value="meal">Meal</SelectItem>
                        <SelectItem value="sleep">Sleep</SelectItem>
                        <SelectItem value="hydration">Hydration</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="label" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl><Input placeholder="e.g., Morning run, Protein breakfast..." {...field} data-testid="input-health-label" /></FormControl>
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="value" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl><Input type="number" step="0.1" min={0} {...field} data-testid="input-health-value" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="unit" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl><Input placeholder="km, hours, liters..." {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl><Input placeholder="How did it go?" {...field} /></FormControl>
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createLog.isPending}>
                  {createLog.isPending ? "Logging..." : "Log Activity"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-amber-400/30 bg-amber-400/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Flame className="w-8 h-8 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-amber-400">{stats.user.streak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-violet-400/30 bg-violet-400/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Shield className="w-8 h-8 text-violet-400" />
              <div>
                <p className="text-2xl font-bold text-violet-400">{stats.user.longestStreak}</p>
                <p className="text-xs text-muted-foreground">Best Streak</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Zap className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-primary">{stats.pillars.health.totalXpEarned}</p>
                <p className="text-xs text-muted-foreground">Health XP</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-rose-400/30 bg-rose-400/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Heart className="w-8 h-8 text-rose-400" />
              <div>
                <p className="text-2xl font-bold text-rose-400">{stats.pillars.health.completedToday}</p>
                <p className="text-xs text-muted-foreground">Done Today</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Aura Banner */}
      {stats?.user.hasAura && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg border border-violet-400/50 bg-violet-400/10 flex items-center gap-3"
        >
          <Shield className="w-6 h-6 text-violet-400" />
          <div>
            <p className="font-semibold text-violet-400">Aura of the Devoted is Active!</p>
            <p className="text-sm text-muted-foreground">7-day streak maintained — your avatar radiates with power.</p>
          </div>
        </motion.div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40" data-testid="select-health-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="workout">Workout</SelectItem>
            <SelectItem value="meal">Meal</SelectItem>
            <SelectItem value="sleep">Sleep</SelectItem>
            <SelectItem value="hydration">Hydration</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered?.length || 0} entries</span>
      </div>

      {isLoading && <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>}

      {!isLoading && (!filtered || filtered.length === 0) && (
        <Card className="border-dashed border-border">
          <CardContent className="p-12 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="font-semibold font-serif">No activities logged yet</p>
            <p className="text-muted-foreground text-sm mt-1">Every healthy choice is an act of protecting the realm.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {filtered?.map((log) => {
          const cfg = TYPE_CONFIG[log.type as keyof typeof TYPE_CONFIG];
          const Icon = cfg?.icon || Heart;
          return (
            <motion.div key={log.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={`border ${cfg?.border || "border-border"}`} data-testid={`health-log-${log.id}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full ${cfg?.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${cfg?.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{log.label}</span>
                      <Badge variant="outline" className="text-xs capitalize">{log.type}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span>{log.value} {log.unit}</span>
                      {log.notes && <span>• {log.notes}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-primary font-semibold">+{log.xpEarned} XP</p>
                    <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
