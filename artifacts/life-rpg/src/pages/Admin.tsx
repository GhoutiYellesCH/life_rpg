import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Trash2, Edit3, Check, X, Plus, User, Scroll, Heart, Coins, Store, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/admin${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) throw new Error(`Admin API error: ${res.status}`);
  return res.json();
}

type DbUser = { id: number; username: string; avatarName: string; xp: number; gold: number; streak: number; longestStreak: number; hasAura: boolean; weeklyQuestsCompleted: number };
type DbQuest = { id: number; userId: number; title: string; pillar: string; questType: string; xpReward: number; goldReward: number; status: string; createdAt: string };
type DbShopItem = { id: number; name: string; description: string; goldCost: number; category: string; rarity: string };
type DbHealthLog = { id: number; userId: number; type: string; label: string; value: number; unit: string; xpEarned: number; createdAt: string };
type DbTransaction = { id: number; userId: number; category: string; description: string; amount: number; type: string; goldEarned: number; createdAt: string };
type DbGroupQuest = { id: number; title: string; pillar: string; targetValue: number; currentValue: number; status: string; memberCount: number };

function EditableField({ value, onSave }: { value: string | number; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(value));
  return editing ? (
    <span className="inline-flex items-center gap-1">
      <Input value={val} onChange={(e) => setVal(e.target.value)} className="h-7 w-28 text-xs" />
      <button onClick={() => { onSave(val); setEditing(false); }} className="text-emerald-400 hover:text-emerald-300"><Check className="w-3 h-3" /></button>
      <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
    </span>
  ) : (
    <button onClick={() => { setVal(String(value)); setEditing(true); }} className="group inline-flex items-center gap-1 hover:text-primary transition-colors">
      {value}
      <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary" />
    </button>
  );
}

function UsersTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: users, isLoading } = useQuery({ queryKey: ["admin", "users"], queryFn: () => adminFetch<DbUser[]>("/users") });
  const updateUser = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Record<string, unknown> }) => adminFetch(`/users/${id}`, { method: "PATCH", body: JSON.stringify(updates) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "users"] }); toast({ title: "User updated" }); },
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground text-left">
            <th className="pb-2 pr-4">ID</th>
            <th className="pb-2 pr-4">Username</th>
            <th className="pb-2 pr-4">XP</th>
            <th className="pb-2 pr-4">Gold</th>
            <th className="pb-2 pr-4">Streak</th>
            <th className="pb-2 pr-4">Best Streak</th>
            <th className="pb-2 pr-4">Aura</th>
            <th className="pb-2">Weekly Q.</th>
          </tr>
        </thead>
        <tbody>
          {users?.map((u) => (
            <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20">
              <td className="py-2 pr-4 text-muted-foreground">{u.id}</td>
              <td className="py-2 pr-4"><EditableField value={u.username} onSave={(v) => updateUser.mutate({ id: u.id, updates: { username: v } })} /></td>
              <td className="py-2 pr-4 text-primary font-mono"><EditableField value={u.xp} onSave={(v) => updateUser.mutate({ id: u.id, updates: { xp: v } })} /></td>
              <td className="py-2 pr-4 text-amber-400 font-mono"><EditableField value={u.gold} onSave={(v) => updateUser.mutate({ id: u.id, updates: { gold: v } })} /></td>
              <td className="py-2 pr-4 text-orange-400 font-mono"><EditableField value={u.streak} onSave={(v) => updateUser.mutate({ id: u.id, updates: { streak: v } })} /></td>
              <td className="py-2 pr-4 font-mono"><EditableField value={u.longestStreak} onSave={(v) => updateUser.mutate({ id: u.id, updates: { longestStreak: v } })} /></td>
              <td className="py-2 pr-4">
                <button onClick={() => updateUser.mutate({ id: u.id, updates: { hasAura: !u.hasAura } })} className={u.hasAura ? "text-violet-400" : "text-muted-foreground"}>
                  {u.hasAura ? "Active" : "None"}
                </button>
              </td>
              <td className="py-2 font-mono"><EditableField value={u.weeklyQuestsCompleted} onSave={(v) => updateUser.mutate({ id: u.id, updates: { weeklyQuestsCompleted: v } })} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuestsTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: quests, isLoading } = useQuery({ queryKey: ["admin", "quests"], queryFn: () => adminFetch<DbQuest[]>("/quests") });
  const deleteQuest = useMutation({
    mutationFn: (id: number) => adminFetch(`/quests/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "quests"] }); toast({ title: "Quest deleted" }); },
  });
  const updateQuest = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Record<string, unknown> }) => adminFetch(`/quests/${id}`, { method: "PATCH", body: JSON.stringify(updates) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "quests"] }); toast({ title: "Quest updated" }); },
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground text-left">
            <th className="pb-2 pr-3">ID</th><th className="pb-2 pr-3">Title</th><th className="pb-2 pr-3">Pillar</th>
            <th className="pb-2 pr-3">Type</th><th className="pb-2 pr-3">XP</th><th className="pb-2 pr-3">Gold</th>
            <th className="pb-2 pr-3">Status</th><th className="pb-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {quests?.map((q) => (
            <tr key={q.id} className="border-b border-border/50 hover:bg-muted/20">
              <td className="py-2 pr-3 text-muted-foreground">{q.id}</td>
              <td className="py-2 pr-3 max-w-[180px]"><EditableField value={q.title} onSave={(v) => updateQuest.mutate({ id: q.id, updates: { title: v } })} /></td>
              <td className="py-2 pr-3 capitalize">{q.pillar}</td>
              <td className="py-2 pr-3 capitalize">{q.questType}</td>
              <td className="py-2 pr-3 text-primary font-mono"><EditableField value={q.xpReward} onSave={(v) => updateQuest.mutate({ id: q.id, updates: { xpReward: v } })} /></td>
              <td className="py-2 pr-3 text-amber-400 font-mono"><EditableField value={q.goldReward} onSave={(v) => updateQuest.mutate({ id: q.id, updates: { goldReward: v } })} /></td>
              <td className="py-2 pr-3">
                <Badge variant="outline" className={`text-xs ${q.status === "completed" ? "text-emerald-400" : q.status === "expired" ? "text-rose-400" : "text-primary"}`}>{q.status}</Badge>
              </td>
              <td className="py-2">
                <Button size="sm" variant="ghost" className="text-rose-400 hover:text-rose-300 h-7 w-7 p-0" onClick={() => deleteQuest.mutate(q.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ShopTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [newItem, setNewItem] = useState({ name: "", description: "", goldCost: 50, category: "weapon", rarity: "common" });
  const [addOpen, setAddOpen] = useState(false);
  const { data: items, isLoading } = useQuery({ queryKey: ["admin", "shop"], queryFn: () => adminFetch<DbShopItem[]>("/shop") });
  const deleteItem = useMutation({
    mutationFn: (id: number) => adminFetch(`/shop/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "shop"] }); toast({ title: "Item deleted" }); },
  });
  const createItem = useMutation({
    mutationFn: (data: typeof newItem) => adminFetch("/shop", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "shop"] }); setAddOpen(false); setNewItem({ name: "", description: "", goldCost: 50, category: "weapon", rarity: "common" }); toast({ title: "Item created" }); },
  });
  const updateItem = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Record<string, unknown> }) => adminFetch(`/shop/${id}`, { method: "PATCH", body: JSON.stringify(updates) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "shop"] }); toast({ title: "Item updated" }); },
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="space-y-3">
      <Button size="sm" className="gap-1" onClick={() => setAddOpen(true)}><Plus className="w-3.5 h-3.5" />Add Item</Button>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-left">
              <th className="pb-2 pr-3">ID</th><th className="pb-2 pr-3">Name</th><th className="pb-2 pr-3">Category</th>
              <th className="pb-2 pr-3">Rarity</th><th className="pb-2 pr-3">Cost</th><th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item) => (
              <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20">
                <td className="py-2 pr-3 text-muted-foreground">{item.id}</td>
                <td className="py-2 pr-3"><EditableField value={item.name} onSave={(v) => updateItem.mutate({ id: item.id, updates: { name: v } })} /></td>
                <td className="py-2 pr-3 capitalize">{item.category}</td>
                <td className="py-2 pr-3 capitalize">{item.rarity}</td>
                <td className="py-2 pr-3 text-amber-400 font-mono"><EditableField value={item.goldCost} onSave={(v) => updateItem.mutate({ id: item.id, updates: { goldCost: v } })} /></td>
                <td className="py-2">
                  <Button size="sm" variant="ghost" className="text-rose-400 hover:text-rose-300 h-7 w-7 p-0" onClick={() => deleteItem.mutate(item.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Shop Item</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name" value={newItem.name} onChange={(e) => setNewItem(p => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Description" value={newItem.description} onChange={(e) => setNewItem(p => ({ ...p, description: e.target.value }))} />
            <div className="grid grid-cols-3 gap-2">
              <Input type="number" placeholder="Gold Cost" value={newItem.goldCost} onChange={(e) => setNewItem(p => ({ ...p, goldCost: Number(e.target.value) }))} />
              <select className="rounded-md border border-input bg-background px-2 text-sm" value={newItem.category} onChange={(e) => setNewItem(p => ({ ...p, category: e.target.value }))}>
                {["helmet","armor","weapon","accessory","mount","aura"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="rounded-md border border-input bg-background px-2 text-sm" value={newItem.rarity} onChange={(e) => setNewItem(p => ({ ...p, rarity: e.target.value }))}>
                {["common","rare","epic","legendary"].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <Button className="w-full" onClick={() => createItem.mutate(newItem)} disabled={!newItem.name}>Create Item</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HealthLogsTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: logs, isLoading } = useQuery({ queryKey: ["admin", "health-logs"], queryFn: () => adminFetch<DbHealthLog[]>("/health-logs") });
  const deleteLog = useMutation({
    mutationFn: (id: number) => adminFetch(`/health-logs/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "health-logs"] }); toast({ title: "Log deleted" }); },
  });
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground text-left">
            <th className="pb-2 pr-3">ID</th><th className="pb-2 pr-3">Type</th><th className="pb-2 pr-3">Label</th>
            <th className="pb-2 pr-3">Value</th><th className="pb-2 pr-3">XP</th><th className="pb-2 pr-3">Date</th><th className="pb-2">Del</th>
          </tr>
        </thead>
        <tbody>
          {logs?.map((l) => (
            <tr key={l.id} className="border-b border-border/50 hover:bg-muted/20">
              <td className="py-2 pr-3 text-muted-foreground">{l.id}</td>
              <td className="py-2 pr-3 capitalize">{l.type}</td>
              <td className="py-2 pr-3">{l.label}</td>
              <td className="py-2 pr-3 font-mono">{l.value} {l.unit}</td>
              <td className="py-2 pr-3 text-primary font-mono">+{l.xpEarned}</td>
              <td className="py-2 pr-3 text-muted-foreground text-xs">{new Date(l.createdAt).toLocaleDateString()}</td>
              <td className="py-2">
                <Button size="sm" variant="ghost" className="text-rose-400 hover:text-rose-300 h-7 w-7 p-0" onClick={() => deleteLog.mutate(l.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TransactionsTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: txs, isLoading } = useQuery({ queryKey: ["admin", "transactions"], queryFn: () => adminFetch<DbTransaction[]>("/transactions") });
  const deleteTx = useMutation({
    mutationFn: (id: number) => adminFetch(`/transactions/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "transactions"] }); toast({ title: "Transaction deleted" }); },
  });
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground text-left">
            <th className="pb-2 pr-3">ID</th><th className="pb-2 pr-3">Category</th><th className="pb-2 pr-3">Type</th>
            <th className="pb-2 pr-3">Amount</th><th className="pb-2 pr-3">Gold</th><th className="pb-2 pr-3">Date</th><th className="pb-2">Del</th>
          </tr>
        </thead>
        <tbody>
          {txs?.map((t) => (
            <tr key={t.id} className="border-b border-border/50 hover:bg-muted/20">
              <td className="py-2 pr-3 text-muted-foreground">{t.id}</td>
              <td className="py-2 pr-3">{t.category}</td>
              <td className="py-2 pr-3 capitalize">{t.type}</td>
              <td className={`py-2 pr-3 font-mono ${t.type === "expense" ? "text-rose-400" : "text-emerald-400"}`}>${t.amount.toFixed(2)}</td>
              <td className="py-2 pr-3 text-amber-400 font-mono">{t.goldEarned > 0 ? `+${t.goldEarned}` : "-"}</td>
              <td className="py-2 pr-3 text-muted-foreground text-xs">{new Date(t.createdAt).toLocaleDateString()}</td>
              <td className="py-2">
                <Button size="sm" variant="ghost" className="text-rose-400 hover:text-rose-300 h-7 w-7 p-0" onClick={() => deleteTx.mutate(t.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Admin() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-rose-400/10 border border-rose-400/30 flex items-center justify-center">
          <Shield className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-serif">Admin Panel</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Full database access — with great power comes great responsibility.</p>
        </div>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="users" className="gap-1.5 text-xs"><User className="w-3.5 h-3.5" />Users</TabsTrigger>
          <TabsTrigger value="quests" className="gap-1.5 text-xs"><Scroll className="w-3.5 h-3.5" />Quests</TabsTrigger>
          <TabsTrigger value="shop" className="gap-1.5 text-xs"><Store className="w-3.5 h-3.5" />Shop</TabsTrigger>
          <TabsTrigger value="health" className="gap-1.5 text-xs"><Heart className="w-3.5 h-3.5" />Health</TabsTrigger>
          <TabsTrigger value="finances" className="gap-1.5 text-xs"><Coins className="w-3.5 h-3.5" />Finances</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="border-rose-400/20">
            <CardHeader><CardTitle className="text-base">Users</CardTitle></CardHeader>
            <CardContent><UsersTab /></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="quests">
          <Card className="border-primary/20">
            <CardHeader><CardTitle className="text-base">All Quests</CardTitle></CardHeader>
            <CardContent><QuestsTab /></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="shop">
          <Card className="border-amber-400/20">
            <CardHeader><CardTitle className="text-base">Shop Items</CardTitle></CardHeader>
            <CardContent><ShopTab /></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="health">
          <Card className="border-emerald-400/20">
            <CardHeader><CardTitle className="text-base">Health Logs</CardTitle></CardHeader>
            <CardContent><HealthLogsTab /></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="finances">
          <Card className="border-amber-400/20">
            <CardHeader><CardTitle className="text-base">Transactions</CardTitle></CardHeader>
            <CardContent><TransactionsTab /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
