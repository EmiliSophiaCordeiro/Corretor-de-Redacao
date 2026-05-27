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
    const { data } = await supabase
      .from("user_inventory")
      .select("equipped, mascot_items(code, category)")
      .eq("user_id", user.id)
      .eq("equipped", true);
    const next: EquippedMascot = { hat: "none", glasses: "none" };
    (data || []).forEach((row: any) => {
      const code = row.mascot_items?.code;
      if (codeToHat[code]) next.hat = codeToHat[code];
      if (codeToGlasses[code]) next.glasses = codeToGlasses[code];
    });
    setEquipped(next);
  }, [user?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { equipped, refetch };
};
