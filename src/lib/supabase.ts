import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// アプリ全体で使い回すSupabase接続クライアント
export const supabase = createClient(supabaseUrl, supabaseAnonKey);