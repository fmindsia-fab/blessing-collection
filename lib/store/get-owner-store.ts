import { cache } from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const getOwnerStore = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_user_id", user.id)
    .single();

  if (error || !data) {
    redirect("/cadastro");
  }

  return data;
});
