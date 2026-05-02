import { useGetInventory, useGetUserStats } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, ShieldCheck, Sword, Sparkles, Star, Swords, Coins } from "lucide-react";
import { motion } from "framer-motion";

const RARITY_CONFIG = {
  common: { color: "text-slate-400", border: "border-slate-400/30", bg: "bg-slate-400/10" },
  rare: { color: "text-sky-400", border: "border-sky-400/30", bg: "bg-sky-400/10" },
  epic: { color: "text-violet-400", border: "border-violet-400/30", bg: "bg-violet-400/10" },
  legendary: { color: "text-amber-400", border: "border-amber-400/30", bg: "bg-amber-400/10" },
};

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  helmet: ShieldCheck,
  armor: ShieldCheck,
  weapon: Sword,
  accessory: Sparkles,
  mount: Star,
  aura: Swords,
};

export default function Inventory() {
  const { data: items, isLoading } = useGetInventory();
  const { data: stats } = useGetUserStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif">Inventory</h1>
          <p className="text-muted-foreground mt-1">Your hero's collected gear and treasures.</p>
        </div>
        {stats && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/10 border border-amber-400/30">
            <Coins className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-amber-400">{stats.user.gold} Gold available</span>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      )}

      {!isLoading && (!items || items.length === 0) && (
        <Card className="border-dashed border-border">
          <CardContent className="p-16 text-center">
            <Package className="w-20 h-20 mx-auto mb-4 text-muted-foreground/20" />
            <p className="font-semibold text-lg font-serif">Your inventory is empty</p>
            <p className="text-muted-foreground text-sm mt-2">Visit the shop to spend your Gold on powerful gear.</p>
          </CardContent>
        </Card>
      )}

      {items && items.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">{items.length} item{items.length !== 1 ? "s" : ""} in collection</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((inv, i) => {
              const item = inv.shopItem;
              const rarityConfig = RARITY_CONFIG[item.rarity as keyof typeof RARITY_CONFIG];
              const CategoryIcon = CATEGORY_ICONS[item.category] || Package;
              return (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`border ${rarityConfig?.border || "border-border"} hover:shadow-md transition-all`} data-testid={`inventory-item-${inv.id}`}>
                    <CardContent className="p-4 text-center">
                      <div className={`w-16 h-16 rounded-full ${rarityConfig?.bg} flex items-center justify-center mx-auto mb-3`}>
                        <CategoryIcon className={`w-8 h-8 ${rarityConfig?.color}`} />
                      </div>
                      <h3 className="font-semibold text-sm">{item.name}</h3>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <Badge className={`${rarityConfig?.bg} ${rarityConfig?.color} border-0 text-xs`}>{item.rarity}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 capitalize">{item.category}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Acquired {new Date(inv.purchasedAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
