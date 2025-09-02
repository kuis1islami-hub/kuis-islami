// screens/LeaderboardScreen.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../supabaseClient";

type Attempt = {
  phone?: string | null;
  player_name?: string | null;
  total_points?: number | null;
  total_time_ms?: number | null;
  finished_at?: string | null;
};

type Row = {
  rank: number;
  name: string;
  phone: string;
  points: number;
  timeMs: number;
};

const PROFILE_KEY = "playerProfile";

export default function LeaderboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [mePhone, setMePhone] = useState<string>("");

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(PROFILE_KEY);
      if (raw) {
        try {
          const p = JSON.parse(raw);
          if (p?.phone) setMePhone(String(p.phone));
        } catch {}
      }
    })();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Ambil sejumlah attempts (mis. 500 terakhir) lalu kelompokkan best per phone di client
      const { data, error } = await supabase
        .from("attempts") // pastikan sesuai nama tabel kamu
        .select("phone, player_name, total_points, total_time_ms, finished_at")
        .order("finished_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      const attempts: Attempt[] = (data ?? []) as any;

      // Group by phone → ambil BEST (points DESC, time ASC)
      const bestByPhone = new Map<string, { name: string; points: number; timeMs: number }>();

      for (const a of attempts) {
        const phone = (a.phone ?? "").trim();
        if (!phone) continue;
        const name = (a.player_name ?? "Pemain").trim() || "Pemain";
        const points = Number(a.total_points ?? 0);
        const timeMs = Number(a.total_time_ms ?? 0);

        const prev = bestByPhone.get(phone);
        if (!prev) {
          bestByPhone.set(phone, { name, points, timeMs });
        } else {
          // pilih skor lebih tinggi; kalau sama → waktu lebih cepat
          if (
            points > prev.points ||
            (points === prev.points && timeMs > 0 && (prev.timeMs === 0 || timeMs < prev.timeMs))
          ) {
            bestByPhone.set(phone, { name, points, timeMs });
          }
        }
      }

      // Urutkan
      const sorted = Array.from(bestByPhone.entries())
        .map(([phone, v]) => ({ phone, ...v }))
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          return (a.timeMs || Infinity) - (b.timeMs || Infinity);
        });

      // Ranking & ambil top10
      const rankedAll = sorted.map((v, i) => ({
        rank: i + 1,
        name: v.name,
        phone: v.phone,
        points: v.points,
        timeMs: v.timeMs,
      }));

      setRows(rankedAll);
    } catch (e: any) {
      console.warn("Leaderboard error:", e?.message || e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  };

  const top10 = useMemo(() => rows.slice(0, 10), [rows]);

  const myRow = useMemo(() => {
    if (!mePhone) return null;
    return rows.find((r) => r.phone === mePhone) ?? null;
  }, [rows, mePhone]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Memuat leaderboard…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>🏆 Top 10 Papan Skor</Text>

      {top10.length === 0 ? (
        <View style={styles.card}>
          <Text style={{ color: "#555" }}>Belum ada data.</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {top10.map((r) => (
            <View
              key={`${r.rank}-${r.phone}`}
              style={[
                styles.row,
                r.phone === mePhone && { backgroundColor: "#ecfeff", borderColor: "#a5f3fc" },
              ]}
            >
              <Text style={[styles.rank, r.rank <= 3 && styles.rankTop]}>{r.rank}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {r.name || "Pemain"}
                </Text>
                <Text style={styles.small}>{r.phone}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.points}>{r.points} pts</Text>
                <Text style={styles.small}>{(r.timeMs / 1000).toFixed(1)} dtk</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <Text style={[styles.title, { marginTop: 20 }]}>📍 Peringkat Kamu</Text>
      {!myRow ? (
        <View style={styles.card}>
          <Text style={{ color: "#555" }}>
            Profil kamu belum tampil di papan skor. Selesaikan kuis untuk muncul di sini.
          </Text>
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: "#ecffec", borderColor: "#bbf7d0" }]}>
          <View style={styles.row}>
            <Text style={[styles.rank, styles.rankTop]}>{myRow.rank}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{myRow.name || "Kamu"}</Text>
              <Text style={styles.small}>{myRow.phone}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.points}>{myRow.points} pts</Text>
              <Text style={styles.small}>{(myRow.timeMs / 1000).toFixed(1)} dtk</Text>
            </View>
          </View>
        </View>
      )}

      <Text style={styles.note}>
        *Urutan berdasarkan poin tertinggi, waktu tercepat sebagai tie-breaker. Data diambil dari
        percobaan (attempts) terbaru.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 10 },

  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 8,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  rank: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    marginRight: 10,
    fontWeight: "800",
    lineHeight: 34,
  },
  rankTop: {
    backgroundColor: "#fde68a",
  },
  name: { fontSize: 16, fontWeight: "700" },
  small: { fontSize: 12, color: "#666" },
  points: { fontWeight: "800" },

  note: { fontSize: 12, color: "#666", marginTop: 10 },
});
