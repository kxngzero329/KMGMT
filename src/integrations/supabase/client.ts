// Browser configuration comes from public build-time environment variables.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';
import { getPublicSupabaseConfig } from './public-config';

const { url: SUPABASE_URL, key: publicKey } = getPublicSupabaseConfig(
  import.meta.env["VITE_SUPABASE_URL"],
  import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"],
);
export const SUPABASE_PUBLISHABLE_KEY = publicKey;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: brokeredPreviewStorage(),
    persistSession: true,
    autoRefreshToken: true,
  }
});
