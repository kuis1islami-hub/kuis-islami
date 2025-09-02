// screens/LevelScreen.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { WebView } from "react-native-webview";
import type { RootStackParamList } from "../App";
import {
    finalizeSession,
    getQuestions,
    startSession,
    submitAnswer,
} from "../lib/api";

type LevelNav = StackNavigationProp<RootStackParamList, "Level">;

type Question = {
  id: number;
  text: string;
  options: string[];
  correct_index?: number;
};

type Props = {
  navigation: LevelNav;
  route: { params: { level: number } };
};

const PROFILE_KEY = "playerProfile";
const PROGRESS_KEY = "progress"; // { completedLevel: number }

// ====== KONFIG MEKANIK GAME ======
const QUESTION_SECONDS = 15; // countdown per soal
const REQUIRE_VIDEO_ON_WRONG = true; // wajib tampil video jika salah
const VIDEO_MIN_WATCH_SECONDS = 8; // minimal n detik sebelum bisa tutup
const MAX_MISTAKES_BEFORE_RESTART = 3; // jika salah >= n → ulang level
// =================================

function ytbToEmbed(url: string): string {
  // dukung format youtu.be/<id> atau youtube.com/watch?v=<id>
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1&rel=0`;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1&rel=0`;
    }
  } catch {}
  return url;
}

export default function LevelScreen({ navigation, route }: Props) {
  const level = route.params.level;

  const [started, setStarted] = useState(false); // layar "siap mulai?"
  const [loading, setLoading] = useState(false);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [idx, setIdx] = useState(0);
  const current = useMemo(() => questions[idx], [questions, idx]);

  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nowRef = useRef<number>(Date.now());

  const [answeredIndex, setAnsweredIndex] = useState<number | null>(null);
  const [correctIndex, setCorrectIndex] = useState<number | undefined>(undefined);

  // Video modal
  const [showVideo, setShowVideo] = useState(false);
  const [videoCountdown, setVideoCountdown] = useState(VIDEO_MIN_WATCH_SECONDS);

  // Final
  const [final, setFinal] = useState<null | {
    correct_count?: number;
    bonus_count?: number;
    total_points?: number;
    total_time_ms?: number;
  }>(null);

  // countdown per soal
  useEffect(() => {
    if (!started || !current || final) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(QUESTION_SECONDS);
    nowRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, idx, current, final]);

  async function handleStart() {
    try {
      setLoading(true);
      // ambil profil
      const raw = await AsyncStorage.getItem(PROFILE_KEY);
      const prof = raw ? JSON.parse(raw) : null;
      const nm = prof?.name?.trim();
      const ph = prof?.phone?.trim();
      if (!nm || !ph) {
        Alert.alert("Profil kosong", "Isi profil dulu di halaman awal.");
        navigation.goBack();
        return;
      }

      // start session
      const ss = await startSession({ level, name: nm, phone: ph });
      setSessionId(ss.session_id);

      // get questions
      const gq = await getQuestions({ sessionId: ss.session_id });
      setQuestions(gq.questions || []);
      setIdx(0);
      setAnsweredIndex(null);
      setCorrectIndex(undefined);

      // video url (level wise)
      if (gq.video_url) setVideoUrl(gq.video_url);
      setStarted(true);
    } catch (e: any) {
      Alert.alert("Gagal mulai", String(e?.message || e));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  async function onAnswer(i: number) {
    if (!sessionId || !current || answeredIndex != null) return;

    setAnsweredIndex(i);
    setCorrectIndex(current.correct_index);

    const elapsed = Date.now() - nowRef.current;

    try {
      const resp = await submitAnswer({
        sessionId,
        questionId: current.id,
        options: current.options,
        chosenIndex: i,
        elapsedMs: elapsed,
      });

      const isCorrect = !!resp.correct;
      // jika salah → tampilkan video
      if (!isCorrect && REQUIRE_VIDEO_ON_WRONG && videoUrl) {
        setShowVideo(true);
        setVideoCountdown(VIDEO_MIN_WATCH_SECONDS);
        // countdown untuk tombol close video
        const t = setInterval(() => {
          setVideoCountdown((s) => {
            if (s <= 1) {
              clearInterval(t);
              return 0;
            }
            return s - 1;
          });
        }, 1000);
      }

      // cek batas salah → ulang level
      const mistakes = Number((resp as any).mistakes_count ?? 0);
      if (!isCorrect && mistakes >= MAX_MISTAKES_BEFORE_RESTART) {
        Alert.alert(
          "Ulang Level",
          `Kamu sudah salah ${mistakes} kali. Level akan diulang.`,
          [{ text: "OK", onPress: () => navigation.replace("Level", { level }) }]
        );
        return;
      }

      // selesai?
      if (resp.finished) {
        const fr = await finalizeSession(sessionId);
        await updateProgressOnSuccess(level);
        setFinal(fr);
        return;
      }
    } catch (e: any) {
      Alert.alert("Gagal submit jawaban", String(e?.message || e));
    }
  }

  function nextQuestion() {
    // tutup video jika masih terbuka
    setShowVideo(false);
    // lanjut soal berikut
    setAnsweredIndex(null);
    setCorrectIndex(undefined);
    setIdx((x) => Math.min(x + 1, questions.length - 1));
  }

  async function updateProgressOnSuccess(doneLevel: number) {
    // simpan progress lokal untuk kunci level di Home
    const progRaw = await AsyncStorage.getItem(PROGRESS_KEY);
    const prog = progRaw ? JSON.parse(progRaw) : { completedLevel: 0 };
    if ((prog.completedLevel ?? 0) < doneLevel) {
      prog.completedLevel = doneLevel;
      await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(prog));
    }
  }

  // ====== RENDER ======
  if (!started) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>Level {level}</Text>
        <Text style={styles.subtitle}>
          Siap mulai menjawab 10 pertanyaan? Waktu akan berjalan ketika soal tampil.
        </Text>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: "#0ea5e9" }]}
          onPress={handleStart}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Mulai</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Batal</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Memuat soal…</Text>
      </SafeAreaView>
    );
  }

  if (final) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.title}>Selesai Level {level}!</Text>
          <Text>Benar: {final.correct_count ?? "-"}</Text>
          <Text>Bonus (&lt;5 detik): {final.bonus_count ?? "-"}</Text>
          <Text>Total Poin: {final.total_points ?? "-"}</Text>
          <Text>Total Waktu: {(final.total_time_ms ?? 0) / 1000}s</Text>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#0ea5e9", marginTop: 16 }]}
            onPress={() => navigation.replace("Home")}
          >
            <Text style={styles.btnText}>Kembali</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!current) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Tidak ada soal.</Text>
        <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Kembali</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isAnswered = answeredIndex != null;
  const correct = correctIndex ?? -1;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.rowBetween}>
          <Text style={{ fontSize: 14, color: "#555" }}>
            Soal {idx + 1} / {questions.length}
          </Text>
          <Text style={{ fontSize: 14, fontWeight: "800" }}>
            ⏱ {timeLeft}s
          </Text>
        </View>

        <Text style={{ fontSize: 20, fontWeight: "700", marginTop: 8 }}>
          {current.text}
        </Text>

        <View style={{ marginTop: 16 }}>
          {current.options.map((opt, i) => {
            let bg = "#fff";
            let border = "#ddd";
            if (isAnswered) {
              if (i === correct) {
                bg = "#dcfce7"; // hijau muda
                border = "#16a34a";
              } else if (i === answeredIndex && i !== correct) {
                bg = "#fee2e2"; // merah muda
                border = "#dc2626";
              }
            }
            return (
              <TouchableOpacity
                key={i}
                disabled={isAnswered}
                onPress={() => onAnswer(i)}
                style={[styles.optionBtn, { backgroundColor: bg, borderColor: border }]}
              >
                <Text style={{ fontSize: 16 }}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isAnswered && idx < questions.length - 1 && (
          <TouchableOpacity style={[styles.btn, { marginTop: 8 }]} onPress={nextQuestion}>
            <Text style={styles.btnText}>Soal berikutnya</Text>
          </TouchableOpacity>
        )}
        {isAnswered && idx === questions.length - 1 && (
          <Text style={{ marginTop: 8, fontStyle: "italic", color: "#666" }}>
            Menunggu penyelesaian… (otomatis setelah submit soal terakhir)
          </Text>
        )}

        <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Keluar</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* VIDEO saat salah */}
      <Modal visible={showVideo} animationType="slide" onRequestClose={() => {}}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            {videoUrl ? (
              <WebView
                source={{ uri: ytbToEmbed(videoUrl) }}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
              />
            ) : (
              <View style={styles.center}>
                <Text>Tidak ada video.</Text>
              </View>
            )}
          </View>

          <View style={{ padding: 12, borderTopWidth: 1, borderColor: "#eee" }}>
            <TouchableOpacity
              style={[
                styles.btn,
                {
                  backgroundColor: videoCountdown === 0 ? "#0ea5e9" : "#94a3b8",
                },
              ]}
              disabled={videoCountdown !== 0}
              onPress={nextQuestion}
            >
              <Text style={styles.btnText}>
                {videoCountdown === 0 ? "Tutup & Lanjut" : `Tutup (${videoCountdown})`}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 6 },
  subtitle: { color: "#555", textAlign: "center", marginBottom: 10, paddingHorizontal: 20 },
  btn: {
    backgroundColor: "#0ea5e9",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "800" },
  linkBtn: { paddingVertical: 10, alignItems: "center" },
  linkText: { color: "#0ea5e9", fontSize: 14, fontWeight: "700" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  optionBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
});
