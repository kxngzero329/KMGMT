import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/integrations/supabase/types.ts";

export type Env = (name: string) => string | undefined;
export interface PaymentDependencies {
  env: Env;
  supabase: SupabaseClient<Database>;
}
