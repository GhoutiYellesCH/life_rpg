import { useGetShopItems, useGetUserStats, usePurchaseItem, getGetInventoryQueryKey, getGetUserStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, ShieldCheck, Sword, Sparkles, Star, Swords, Package } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const RARITY_CONFIG = {
  common: { color: "text-slate-400", border: "border-slate-400/30", bg: "bg-slate-400/10", label: "Common" },
  rare: { color: "text-sky-400", border: "border-sky-400/30", bg: "bg-sky-400/10", label: "Rare" },
  epic: { color: "text-violet-400", border: "border-violet-400/30", bg: "bg-violet-400/10", label: "Epic" },
  legendary: { color: "text-amber-400", border: "border-amber-400/30", bg: "bg-amber-400/10", label: "Legendary" },
};

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  helmet: ShieldCheck,
  armor: ShieldCheck,
  weapon: Sword,
  accessory: Sparkles,
  mount: Star,
  aura: Swords,
};

export default function Shop() {
  const { data: items, isLoading } = useGetShopItems();
  const { data: stats } = useGetUserStats();
  const purchaseItem = usePurchaseItem();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  async function handlePurchase(id: number, cost: number, name: string) {
    if ((stats?.user.gold || 0) < cost) {
      toast({ title: "Insufficient Gold", description: "Complete more quests to earn Gold!", variant: "destructive" });
      return;
    }
    try {
      const result = await purchaseItem.mutateAsync({ data: { shopItemId: id } });
      queryClient.invalidateQueries({ queryKey: getGetInventoryQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetUserStatsQueryKey() });
      toast({ title: `${name} acquired!`, description: `Spent ${result.goldSpent} Gold. Remaining: ${result.remainingGold} Gold` });
    } catch {
      toast({ title: "Purchase failed", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif">Avatar Shop</h1>
          <p className="text-muted-foreground mt-1">Spend your Gold to equip your hero.</p>
        </div>
        {stats && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/10 border border-amber-400/30">
            <Coins className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-amber-400" data-testid="text-gold-balance">{stats.user.gold} Gold</span>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      )}

      {!isLoading && (!items || items.length === 0) && (
        <Card className="border-dashed border-border">
          <CardContent className="p-16 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="font-semibold font-serif">Shop is empty</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items?.map((item, i) => {
          const rarityConfig = RARITY_CONFIG[item.rarity as keyof typeof RARITY_CONFIG];
          const CategoryIcon = CATEGORY_ICONS[item.category] || Package;
          const canAfford = (stats?.user.gold || 0) >= item.goldCost;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className={`border ${rarityConfig?.border || "border-border"} hover:shadow-lg transition-all h-full flex flex-col`}
                data-testid={`shop-item-${item.id}`}
              >
                <CardContent className="p-4 flex flex-col flex-1">
                  <div className={`w-full aspect-square rounded-lg ${rarityConfig?.bg} flex items-center justify-center mb-3`}>
                    <CategoryIcon className={`w-12 h-12 ${rarityConfig?.color}`} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="font-semibold text-sm leading-tight">{item.name}</h3>
                      <Badge className={`${rarityConfig?.bg} ${rarityConfig?.color} border-0 text-xs flex-shrink-0`}>
                        {item.rarity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                    <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-center gap-1">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-amber-400">{item.goldCost}</span>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      variant={canAfford ? "default" : "outline"}
                      disabled={!canAfford || purchaseItem.isPending}
                      onClick={() => handlePurchase(item.id, item.goldCost, item.name)}
                      data-testid={`button-purchase-${item.id}`}
                    >
                      {canAfford ? "Purchase" : "Need More Gold"}
                    </Button>
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
