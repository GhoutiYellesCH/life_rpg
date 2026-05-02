import { useState } from "react";
import { useGetGroupQuests, useCreateGroupQuest, useContributeToGroupQuest, getGetGroupQuestsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Sword, Heart, Target, Coins, Trophy } from "lucide-react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const PILLAR_CONFIG = {
  sports: { icon: Sword, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30" },
  health: { icon: Heart, color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/30" },
  goals: { icon: Target, color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/30" },
  finances: { icon: Coins, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30" },
};

type CreateForm = { title: string; description: string; pillar: string; targetValue: number; unit: string };
type ContributeForm = { value: number };

export default function GroupQuests() {
  const [createOpen, setCreateOpen] = useState(false);
  const [contributeId, setContributeId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: quests, isLoading } = useGetGroupQuests();
  const createGroupQuest = useCreateGroupQuest();
  const contribute = useContributeToGroupQuest();

  const createForm = useForm<CreateForm>({
    defaultValues: { title: "", description: "", pillar: "sports", targetValue: 100, unit: "km" },
  });

  const contributeForm = useForm<ContributeForm>({ defaultValues: { value: 0 } });

  async function onCreate(data: CreateForm) {
    try {
      await createGroupQuest.mutateAsync({
        data: { title: data.title, description: data.description, pillar: data.pillar as any, targetValue: Number(data.targetValue), unit: data.unit },
      });
      queryClient.invalidateQueries({ queryKey: getGetGroupQuestsQueryKey() });
      setCreateOpen(false);
      createForm.reset();
      toast({ title: "Group quest created!", description: "Rally your allies!" });
    } catch {
      toast({ title: "Failed to create group quest", variant: "destructive" });
    }
  }

  async function onContribute(data: ContributeForm) {
    if (!contributeId) return;
    try {
      await contribute.mutateAsync({ id: contributeId, data: { value: Number(data.value) } });
      queryClient.invalidateQueries({ queryKey: getGetGroupQuestsQueryKey() });
      setContributeId(null);
      contributeForm.reset();
      toast({ title: "Contribution added!", description: "The quest grows closer to completion." });
    } catch {
      toast({ title: "Contribution failed", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif">Guild Quests</h1>
          <p className="text-muted-foreground mt-1">United the Kingdom conquers the impossible.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-create-group-quest">
              <Plus className="w-4 h-4" /> Create Guild Quest
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif">Rally the Guild</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreate)} className="space-y-4">
                <FormField control={createForm.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quest Title</FormLabel>
                    <FormControl><Input placeholder="Run 100km together..." {...field} data-testid="input-group-quest-title" /></FormControl>
                  </FormItem>
                )} />
                <FormField control={createForm.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Input placeholder="Details..." {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={createForm.control} name="pillar" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pillar</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="sports">Sports</SelectItem>
                        <SelectItem value="health">Health</SelectItem>
                        <SelectItem value="goals">Goals</SelectItem>
                        <SelectItem value="finances">Finances</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={createForm.control} name="targetValue" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target</FormLabel>
                      <FormControl><Input type="number" min={1} {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={createForm.control} name="unit" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl><Input placeholder="km, meals, $..." {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full" disabled={createGroupQuest.isPending}>
                  {createGroupQuest.isPending ? "Creating..." : "Raise the Banner"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}</div>}

      {!isLoading && (!quests || quests.length === 0) && (
        <Card className="border-dashed border-border">
          <CardContent className="p-16 text-center">
            <Users className="w-20 h-20 mx-auto mb-4 text-muted-foreground/20" />
            <p className="font-semibold text-lg font-serif">No guild quests yet</p>
            <p className="text-muted-foreground text-sm mt-2">Create a quest and rally your allies to the cause.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {quests?.map((quest, i) => {
          const cfg = PILLAR_CONFIG[quest.pillar as keyof typeof PILLAR_CONFIG];
          const Icon = cfg?.icon || Target;
          const progressPct = Math.min(quest.progress * 100, 100);
          return (
            <motion.div key={quest.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className={`border ${cfg?.border || "border-border"} hover:shadow-md transition-all`} data-testid={`group-quest-${quest.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${cfg?.bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${cfg?.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{quest.title}</h3>
                        {quest.description && <p className="text-sm text-muted-foreground">{quest.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{quest.pillar}</Badge>
                      {quest.status === "completed" && <Badge className="bg-emerald-400/10 text-emerald-400 border-emerald-400/30">Completed</Badge>}
                      {quest.status === "failed" && <Badge variant="destructive">Failed</Badge>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">
                        {quest.currentValue} / {quest.targetValue} {quest.unit}
                        <span className="text-muted-foreground ml-2">({Math.round(progressPct)}%)</span>
                      </span>
                    </div>
                    <Progress value={progressPct} className="h-3" />
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{quest.memberCount} member{quest.memberCount !== 1 ? "s" : ""}</span>
                      {quest.deadline && <span>• Ends {new Date(quest.deadline).toLocaleDateString()}</span>}
                    </div>
                    {quest.status === "active" && (
                      <Button size="sm" onClick={() => { setContributeId(quest.id); }} data-testid={`button-contribute-${quest.id}`}>
                        Contribute
                      </Button>
                    )}
                    {quest.status === "completed" && <Trophy className="w-5 h-5 text-amber-400" />}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Contribute Dialog */}
      <Dialog open={contributeId !== null} onOpenChange={(o) => !o && setContributeId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Contribute to Quest</DialogTitle>
          </DialogHeader>
          <Form {...contributeForm}>
            <form onSubmit={contributeForm.handleSubmit(onContribute)} className="space-y-4">
              <FormField control={contributeForm.control} name="value" render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Contribution</FormLabel>
                  <FormControl><Input type="number" step="0.1" min={0} placeholder="How much are you contributing?" {...field} data-testid="input-contribution" /></FormControl>
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={contribute.isPending}>
                {contribute.isPending ? "Adding..." : "Add Contribution"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
