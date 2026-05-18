import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserStats } from "@/hooks/useUserStats";
import Mascot from "@/components/Mascot";
import { Coins, Check } from "lucide-react";
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

const rarityClass: Record<string, string> = {
  common: "ring-rarity-common",
  rare: "ring-rarity-rare",
  epic: "ring-rarity-epic",
  legendary: "ring-rarity-legendary",
};

const Shop = () => {
  const { user } = useAuth();
  const { stats, refetch } = useUserStats();
  const [items, setItems] = useState<Item[]>([]);
  const [owned, setOwned] = useState<Set<string>>(new Set());

  const load = async () => {
    const { data } = await supabase.from("mascot_items").select("*").order("price");
    setItems(data || []);
    if (!user) return;
    const { data: inv } = await supabase.from("user_inventory").select("item_id").eq("user_id", user.id);
    setOwned(new Set(inv?.map((i: any) => i.item_id) || []));
  };

  useEffect(() => { load(); }, [user?.id]);

  const buy = async (item: Item) => {
    if (!user || !stats) return;
    if (stats.points < item.price) {
      toast.error("Pontos insuficientes");
      return;
    }
    const { error } = await supabase.from("user_inventory").insert({ user_id: user.id, item_id: item.id });
    if (error) {
      toast.error("Erro ao comprar");
      return;
    }
    await supabase.from("user_stats").update({ points: stats.points - item.price }).eq("user_id", user.id);
    await refetch();
    setOwned((s) => new Set(s).add(item.id));
    toast.success(`${item.name} desbloqueado!`, { icon: item.preview_emoji || "🎉" });
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <div className="flex items-center gap-4">
          <Mascot size={80} hat="cap" glasses="round" />
          <div>
            <h1 className="text-2xl font-display font-bold">Loja do Mascote</h1>
            <p className="text-sm text-muted-foreground">Customize sua coruja com pontos ganhos escrevendo.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full glass px-4 py-2">
          <Coins className="h-4 w-4 text-accent" />
          <span className="font-display font-bold">{stats?.points ?? 0}</span>
          <span className="text-xs text-muted-foreground">pontos</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.filter((i) => !i.is_default).map((item) => {
          const isOwned = owned.has(item.id);
          return (
            <div key={item.id} className={`rounded-2xl bg-card p-4 text-center transition-all hover:scale-[1.03] ${rarityClass[item.rarity]}`}>
              <div className="h-20 flex items-center justify-center text-4xl mb-2">
                {item.preview_emoji}
              </div>
              <h3 className="font-display font-semibold text-sm">{item.name}</h3>
              <p className={`text-[10px] uppercase tracking-widest font-mono-score rarity-${item.rarity}`}>
                {item.rarity}
              </p>
              <button
                disabled={isOwned}
                onClick={() => buy(item)}
                className={`mt-3 w-full rounded-full py-2 text-xs font-medium transition-all ${
                  isOwned
                    ? "bg-success/20 text-success cursor-not-allowed"
                    : "gradient-primary text-primary-foreground hover:scale-105"
                }`}
              >
                {isOwned ? (
                  <span className="flex items-center justify-center gap-1"><Check className="h-3 w-3" /> Possuído</span>
                ) : (
                  <span className="flex items-center justify-center gap-1"><Coins className="h-3 w-3" /> {item.price}</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Shop;
