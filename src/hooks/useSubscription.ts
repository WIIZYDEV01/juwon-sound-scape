import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSubscription(userId: string | undefined) {
  return useQuery({
    queryKey: ["subscription", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });
}

/** True when the user has an active/trialing premium-style plan. */
export function isPremium(sub: any): boolean {
  if (!sub) return false;
  const status = String(sub.status ?? "").toLowerCase();
  const plan = String(sub.plan ?? sub.plan_name ?? sub.tier ?? "").toLowerCase();
  const active =
    status === "active" ||
    status === "trialing" ||
    status === "premium" ||
    status === "paid";
  const premiumPlan =
    plan.includes("premium") ||
    plan.includes("pro") ||
    plan.includes("plus") ||
    plan === "paid";
  return active && (premiumPlan || status === "premium" || !plan);
}
