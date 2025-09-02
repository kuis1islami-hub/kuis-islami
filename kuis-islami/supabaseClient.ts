// supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// Ambil variabel dari .env
const supabaseUrl: string = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey: string = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase ENV tidak ditemukan. Pastikan file .env berisi:");
  console.warn("EXPO_PUBLIC_SUPABASE_URL=...");
  console.warn("EXPO_PUBLIC_SUPABASE_ANON_KEY=...");
}

// Buat client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,   // ✅ session login tetap tersimpan
    autoRefreshToken: true, // ✅ refresh token otomatis
  },
});

// Helper untuk cek koneksi
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from("questions").select("id").limit(1);
    if (error) throw error;
    console.log("✅ Supabase terkoneksi. Contoh data:", data);
  } catch (err) {
    console.error("❌ Gagal konek Supabase:", err);
  }
}
