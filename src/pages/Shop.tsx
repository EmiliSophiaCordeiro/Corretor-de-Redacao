import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserStats } from "@/hooks/useUserStats";
import { useEquippedMascot } from "@/hooks/useEquippedMascot";
import Mascot from "@/components/Mascot";
import { Coins, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Item {
  id: string;
  code: string;
  name: string;
  category: string;
  rarity: string;
  price: number;
  preview_emoji: string | null;
  description: string | null;
  is_default: boolean;
}

interface InventoryRow {
  id: string;
  item_id: string;
  equipped: boolean;
}

const rarityClass: Record<string, string> = {
  common: "ring-rarity-common",
  rare: "ring-rarity-rare",
  epic: "ring-rarity-epic",
  legendary: "ring-rarity-legendary",
};

const equippableCategories = new Set(["hat", "glasses"]);

const Shop = () => {
  const { user } = useAuth();
  const { stats, refetch } = useUserStats();
  const { refetch: refetchEquipped } = useEquippedMascot();
  const [items, setItems] = useState<Item[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);

  const load = async () => {
    const { data } = await supabase.from("mascot_items").select("*").order("price");
    setItems(data || []);
    if (!user) return;
    const { data: inv } = await supabase
      .from("user_inventory")
      .select("id, item_id, equipped")
      .eq("user_id", user.id);
    setInventory((inv as InventoryRow[]) || []);
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const ownedMap = new Map(inventory.map((i) => [i.item_id, i]));

  const buy = async (item: Item) => {
    if (!user || !stats) return;
    if (stats.points < item.price) {
      toast.error("Pontos insuficientes");
      return;
    }
    const { error } = await supabase
      .from("user_inventory")
      .insert({ user_id: user.id, item_id: item.id });
    if (error) {
      toast.error("Erro ao comprar");
      return;
    }
    await supabase
      .from("user_stats")
      .update({ points: stats.points - item.price })
      .eq("user_id", user.id);
    await refetch();
    await load();
    toast.success(`${item.name} desbloqueado!`, { icon: item.preview_emoji || "🎉" });
  };

  const toggleEquip = async (item: Item) => {
    if (!user) return;
    const row = ownedMap.get(item.id);
    if (!row) return;

    if (row.equipped) {
      await supabase.from("user_inventory").update({ equipped: false }).eq("id", row.id);
      toast.success(`${item.name} removido`);
    } else {
      if (equippableCategories.has(item.category)) {
        // Unequip other items in same category
        const sameCategoryItemIds = items
          .filter((i) => i.category === item.category)
          .map((i) => i.id);
        await supabase
          .from("user_inventory")
          .update({ equipped: false })
          .eq("user_id", user.id)
          .in("item_id", sameCategoryItemIds);
      }
      await supabase.from("user_inventory").update({ equipped: true }).eq("id", row.id);
      toast.success(`${item.name} equipado!`, { icon: item.preview_emoji || "✨" });
    }
    await load();
    await refetchEquipped();
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <div className="flex items-center gap-4">
          <Mascot size={80} />
          <div>
            <h1 className="text-2xl font-display font-bold">Loja do Mascote</h1>
            <p className="text-sm text-muted-foreground">
              Customize sua coruja com pontos ganhos escrevendo.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full glass px-4 py-2">
          <Coins className="h-4 w-4 text-accent" />
          <span className="font-display font-bold">{stats?.points ?? 0}</span>
          <span className="text-xs text-muted-foreground">pontos</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items
          .filter((i) => !i.is_default)
          .map((item) => {
            const row = ownedMap.get(item.id);
            const isOwned = !!row;
            const isEquipped = !!row?.equipped;
            return (
              <div
                key={item.id}
                className={`rounded-2xl bg-card p-4 text-center transition-all hover:scale-[1.03] ${rarityClass[item.rarity]}`}
              >
                <div className="h-20 flex items-center justify-center text-4xl mb-2">
                  {item.preview_emoji}
                </div>
                <h3 className="font-display font-semibold text-sm">{item.name}</h3>
                <p
                  className={`text-[10px] uppercase tracking-widest font-mono-score rarity-${item.rarity}`}
                >
                  {item.rarity}
                </p>
                {!isOwned && (
                  <button
                    onClick={() => buy(item)}
                    className="mt-3 w-full rounded-full py-2 text-xs font-medium gradient-primary text-primary-foreground hover:scale-105 transition-all"
                  >
                    <span className="flex items-center justify-center gap-1">
                      <Coins className="h-3 w-3" /> {item.price}
                    </span>
                  </button>
                )}
                {isOwned && (
                  <button
                    onClick={() => toggleEquip(item)}
                    disabled={!equippableCategories.has(item.category)}
                    className={`mt-3 w-full rounded-full py-2 text-xs font-medium transition-all ${
                      isEquipped
                        ? "bg-accent text-accent-foreground glow-pink"
                        : equippableCategories.has(item.category)
                        ? "bg-primary/15 text-primary hover:bg-primary/25"
                        : "bg-success/20 text-success cursor-not-allowed"
                    }`}
                  >
                    {isEquipped ? (
                      <span className="flex items-center justify-center gap-1">
                        <Sparkles className="h-3 w-3" /> Equipado
                      </span>
                    ) : equippableCategories.has(item.category) ? (
                      <span className="flex items-center justify-center gap-1">
                        Equipar
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1">
                        <Check className="h-3 w-3" /> Possuído
                      </span>
                    )}
                  </button>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Shop;
