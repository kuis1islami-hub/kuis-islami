import { createClient } from '@supabase/supabase-js'

// Ganti dengan data dari Supabase kamu
const SUPABASE_URL = 'https://tvkcnaclgfmubgaoequj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2a2NuYWNsZ2ZtdWJnYW9lcXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NTY0MTEsImV4cCI6MjA3MTIzMjQxMX0.j-w5Ilek1T_nz9MIDXO9vv0ZyMIs486a0fPMpBRPxbs'

// Buat client Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
