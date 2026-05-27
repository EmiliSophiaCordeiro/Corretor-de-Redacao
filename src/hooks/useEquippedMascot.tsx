import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface EquippedMascot {
  hat: "none" | "cap" | "crown" | "graduation";
  glasses: "none" | "round" | "sun";
}

const codeToHat: Record<string, EquippedMascot["hat"]> = {
  hat_cap: "cap",
  hat_crown: "crown",
  hat_graduation: "graduation",
};

const codeToGlasses: Record<string, EquippedMascot["glasses"]> = {
  glasses_round: "round",
  glasses_sun: "sun",
};

export const useEquippedMascot = () => {
  const { user } = useAuth();
  const [equipped, setEquipped] = useState<EquippedMascot>({ hat: "none", glasses: "none" });

  const refetch = useCallback(async () => {
    if (!user) return;
    const { data: inv } = await supabase
      .from("user_inventory")
      .select("item_id")
      .eq("user_id", user.id)
      .eq("equipped", true);
    const itemIds = (inv || []).map((r: any) => r.item_id);
    if (itemIds.length === 0) {
      setEquipped({ hat: "none", glasses: "none" });
      return;
    }
    const { data: itemsData } = await supabase
      .from("mascot_items")
      .select("code, category")
      .in("id", itemIds);
    const next: EquippedMascot = { hat: "none", glasses: "none" };
    (itemsData || []).forEach((it: any) => {
      if (codeToHat[it.code]) next.hat = codeToHat[it.code];
      if (codeToGlasses[it.code]) next.glasses = codeToGlasses[it.code];
    });
    setEquipped(next);
  }, [user?.id]);


  useEffect(() => {
    refetch();
  }, [refetch]);

  return { equipped, refetch };
};
