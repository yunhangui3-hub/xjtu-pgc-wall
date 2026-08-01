import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// The site is statically hosted, but notes are always fetched in the browser.
// Explicitly bypass the browser HTTP cache so a restored tab or a Cloudflare
// deployment can never reuse an old PostgREST response.
const noStoreFetch = (input, init = {}) => fetch(input, {
  ...init,
  cache: "no-store",
});

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: { fetch: noStoreFetch },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;
