// components/LevelScreen.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  finalizeSession,
  getQuestions,
  startSession,
  submitAnswer,
} from "../lib/api"; // ✅ ganti ke lib/api

type Props = {
  level: number;
  onExit: () => void;
};

type Question = {
  id: number;
  text: string;
  options: string[];
  correct_index?: number;
};

const PROFILE_KEY = "playerProfile";

export default function LevelScreen({ level, onExit }: Props) {
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [fin, setFin] = useState<null | {
    correct_count?: number;
    bonus_count?: number;
    total_points?: number;
    total_time_ms?: number;
  }>(null);

  const nowRef = useRef<number>(Date.now());
  const current = useMemo(() => questions[idx], [questions, idx]);

  // Start session + ambil soal
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PROFILE_KEY);
        const prof = raw ? JSON.parse(raw) : null;
        const nm = prof?.name?.trim();
        const ph = prof?.phone?.trim();

        if (!nm || !ph) {
          Alert.alert("Profil kosong", "Isi Nama & Nomor WA dulu di halaman awal.");
          onExit();
          return;
        }

        // 1) start_session
        const ss = await startSession({ level, name: nm, phone: ph });
        setSessionId(ss.session_id);

        // 2) get_questions
        const gq = await getQuestions({ sessionId: ss.session_id });
        setQuestions(gq.questions || []);
        setIdx(0);
        nowRef.current = Date.now();
      } catch (e: any) {
        Alert.alert("Gagal mulai level", String(e?.message || e));
        onExit();
      } finally {
        setLoading(false);
      }
    })();
  }, [level, onExit]);

  async function answer(choiceIndex: number) {
    if (!sessionId || !current) return;
    try {
      const elapsed = Date.now() - nowRef.current;

      await submitAnswer({
        sessionId,
        questionId: current.id,
        options: current.options,
        chosenIndex: choiceIndex,
        elapsedMs: elapsed,
      });

      const next = idx + 1;
      if (next < questions.length) {
        setIdx(next);
        nowRef.current = Date.now();
      } else {
        const fr = await finalizeSession(sessionId);
        setFin(fr);
      }
    } catch (e: any) {
      Alert.alert("Gagal submit jawaban", String(e?.message || e));
    }
  }

  // Loading
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Memulai level {level}…</Text>
      </SafeAreaView>
    );
  }

  // Hasil akhir
  if (fin) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", marginBottom: 10 }}>
            Selesai Level {level}!
          </Text>
          <Text>Benar: {fin.correct_count ?? "-"}</Text>
          <Text>Bonus (&lt;5 detik): {fin.bonus_count ?? "-"}</Text>
          <Text>Total Poin: {fin.total_points ?? "-"}</Text>
          <Text>Total Waktu: {(fin.total_time_ms ?? 0) / 1000}s</Text>

          <TouchableOpacity
            onPress={onExit}
            style={{
              backgroundColor: "#0ea5e9",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              marginTop: 16,
            }}
          >
            <Text style={{ color: "white", fontWeight: "800" }}>Kembali</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Tidak ada soal
  if (!current) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Tidak ada soal.</Text>
        <TouchableOpacity onPress={onExit} style={{ marginTop: 12 }}>
          <Text style={{ color: "#0ea5e9" }}>Kembali</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Layar soal
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 14, color: "#555" }}>
          Soal {idx + 1} / {questions.length}
        </Text>
        <Text style={{ fontSize: 20, fontWeight: "700", marginTop: 8 }}>
          {current.text}
        </Text>

        <View style={{ marginTop: 16 }}>
          {current.options.map((opt, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => answer(i)}
              style={{
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 12,
                paddingVertical: 14,
                paddingHorizontal: 12,
                marginBottom: 10,
              }}
            >
              <Text style={{ fontSize: 16 }}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={onExit} style={{ marginTop: 8, alignSelf: "center" }}>
          <Text style={{ color: "#0ea5e9", fontWeight: "700" }}>Keluar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
