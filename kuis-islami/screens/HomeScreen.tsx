// screens/HomeScreen.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { RootStackParamList } from "../App";
import { supabase } from "../supabaseClient";

type HomeNav = StackNavigationProp<RootStackParamList, "Home">;

type Props = { navigation: HomeNav };

type Profile = { name: string; phone: string };

const PROFILE_KEY = "playerProfile";
const BEST_LOCAL_KEY = "bestLevelLocal"; // diset saat lulus level: 2 berarti level 1 lulus, dst.

const BANK_INFO = {
  bank: "BCA",
  name: "An. Kuis Islami",
  number: "1234567890",
};
const ANNOUNCEMENT = `Kuis berhadiah akan diumumkan di grup WhatsApp resmi. 
Pantau info terbaru dan jadwal babak berhadiah ya!`;

export default function HomeScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [editing, setEditing] = useState(false);
  const [bestLocal, setBestLocal] = useState<number>(1); // minimal 1
  const [bestServer, setBestServer] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const effectiveBest = useMemo(() => {
    // Prioritaskan yang lebih besar (server vs lokal)
    return Math.max(bestLocal || 1, bestServer || 1);
  }, [bestLocal, bestServer]);

  // Load profil & progres lokal
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PROFILE_KEY);
        if (raw) {
          const p = JSON.parse(raw) as Profile;
          setProfile(p);
          setName(p.name);
          setPhone(p.phone);
        }
        const b = await AsyncStorage.getItem(BEST_LOCAL_KEY);
        if (b) setBestLocal(Math.max(1, Number(b) || 1));
      } catch (e) {
        console.warn("Load local storage failed:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Tarik progres dari server (tabel 'best_level') jika punya profil
  const fetchBestFromServer = async (ph?: string) => {
    const phoneToUse = (ph ?? phone ?? profile?.phone ?? "").trim();
    if (!phoneToUse) {
      setBestServer(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("best_level") // pastikan nama tabel sesuai SQL kamu
        .select("phone,best_level")
        .eq("phone", phoneToUse)
        .maybeSingle();

      if (error) {
        console.warn("Best level server error:", error.message);
        setBestServer(null);
        return;
      }
      if (data?.best_level && Number(data.best_level) >= 1) {
        setBestServer(Number(data.best_level));
      } else {
        setBestServer(1);
      }
    } catch (e: any) {
      console.warn("Fetch best server failed:", e?.message || e);
      setBestServer(null);
    }
  };

  useEffect(() => {
    if (profile?.phone) fetchBestFromServer(profile.phone);
  }, [profile?.phone]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchBestFromServer();
    } finally {
      setRefreshing(false);
    }
  };

  const saveProfile = async () => {
    const nm = name.trim();
    const ph = phone.trim();

    if (nm.length < 2) {
      Alert.alert("Validasi", "Nama minimal 2 karakter.");
      return;
    }
    if (!/^\+?\d{8,15}$/.test(ph)) {
      Alert.alert(
        "Validasi",
        "No. WA tidak valid. Gunakan angka saja (8–15 digit), boleh diawali +."
      );
      return;
    }
    const p: Profile = { name: nm, phone: ph };
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
      setProfile(p);
      setEditing(false);
      // Coba sinkron best level dari server setelah simpan profil baru
      await fetchBestFromServer(ph);
      Alert.alert("Tersimpan", "Profil berhasil disimpan.");
    } catch (e) {
      Alert.alert("Gagal", "Tidak bisa menyimpan profil di perangkat.");
    }
  };

  const clearProfile = async () => {
    await AsyncStorage.removeItem(PROFILE_KEY);
    setProfile(null);
    setName("");
    setPhone("");
    setEditing(true);
  };

  const resetProgress = async () => {
    await AsyncStorage.setItem(BEST_LOCAL_KEY, "1");
    setBestLocal(1);
    Alert.alert("Reset", "Progres lokal direset ke Level 1.");
  };

  const canStartLevel = (level: number) => {
    // Hanya boleh mulai level (effectiveBest >= level)
    return effectiveBest >= level;
  };

  const startLevel = (level: number) => {
    if (!profile) {
      Alert.alert("Profil", "Silakan isi Nama & No. WA dulu.");
      setEditing(true);
      return;
    }
    if (!canStartLevel(level)) {
      Alert.alert(
        "Level Terkunci",
        `Selesaikan Level ${level - 1} terlebih dahulu untuk membuka Level ${level}.`
      );
      return;
    }
    navigation.navigate("Level", { level });
  };

  if (loading) {
    return (
      <View style={[styles.center, { padding: 24 }]}>
        <Text>Memuat…</Text>
      </View>
    );
  }

  // Form profil
  if (!profile || editing) {
    return (
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.header}>Kuis Islami</Text>
        <Text style={styles.subheader}>Isi data dulu ya 🙂</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Nama</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="cth: Budi"
            style={styles.input}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>No. WhatsApp</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="cth: 08123456789 atau +628123456789"
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={saveProfile}>
          <Text style={styles.primaryText}>Simpan</Text>
        </TouchableOpacity>

        {profile ? (
          <TouchableOpacity style={styles.linkBtn} onPress={() => setEditing(false)}>
            <Text style={styles.linkText}>Batal</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📌 Pengumuman</Text>
          <Text style={styles.cardText}>{ANNOUNCEMENT}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>💳 Rekening Dukungan</Text>
          <Text style={styles.cardText}>
            Bank: {BANK_INFO.bank}{"\n"}
            Nama: {BANK_INFO.name}{"\n"}
            No: {BANK_INFO.number}
          </Text>
        </View>
      </ScrollView>
    );
  }

  // Beranda: salam + pengumuman + rekening + daftar level
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.header}>Kuis Islami</Text>

      <View style={styles.card}>
        <Text style={styles.greet}>Assalamu’alaikum, {profile.name}</Text>
        <Text style={styles.phone}>WA: {profile.phone}</Text>
        <Text style={[styles.small, { marginTop: 6 }]}>
          Progres: Level tertinggi terbuka = <Text style={{ fontWeight: "800" }}>{effectiveBest}</Text>
        </Text>

        <View style={{ flexDirection: "row", marginTop: 10 }}>
          <TouchableOpacity style={styles.linkBtnRow} onPress={() => setEditing(true)}>
            <Text style={styles.linkText}>Ubah Profil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkBtnRow} onPress={clearProfile}>
            <Text style={styles.linkText}>Hapus Profil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkBtnRow} onPress={resetProgress}>
            <Text style={styles.linkText}>Reset Progres</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📌 Pengumuman</Text>
        <Text style={styles.cardText}>{ANNOUNCEMENT}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>💳 Rekening Dukungan</Text>
        <Text style={styles.cardText}>
          Bank: {BANK_INFO.bank}{"\n"}
          Nama: {BANK_INFO.name}{"\n"}
          No: {BANK_INFO.number}
        </Text>
      </View>

      {[1, 2, 3, 4, 5].map((lv) => {
        const enabled = canStartLevel(lv);
        return (
          <TouchableOpacity
            key={lv}
            style={[styles.levelBtn, !enabled && styles.levelBtnDisabled]}
            onPress={() => startLevel(lv)}
            disabled={!enabled}
          >
            <Text style={styles.levelText}>
              {enabled ? "Mulai" : "Terkunci"} Level {lv}
            </Text>
            {!enabled ? (
              <Text style={styles.small}>Selesaikan Level {lv - 1} dahulu</Text>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontSize: 28, fontWeight: "800", marginBottom: 8 },
  subheader: { fontSize: 16, color: "#555", marginBottom: 16 },

  field: { marginBottom: 12 },
  label: { fontSize: 14, color: "#666", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 16,
  },

  primaryBtn: {
    backgroundColor: "#0ea5e9",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryText: { color: "white", fontSize: 16, fontWeight: "700" },

  linkBtn: { paddingVertical: 10, alignItems: "center" },
  linkBtnRow: { paddingRight: 14 },
  linkText: { color: "#0ea5e9", fontSize: 14, fontWeight: "600" },

  card: {
    backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#eee",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", marginBottom: 6 },
  cardText: { color: "#333" },

  greet: { fontSize: 16, fontWeight: "600" },
  phone: { fontSize: 14, color: "#555", marginTop: 2 },
  small: { fontSize: 12, color: "#666" },

  levelBtn: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginTop: 12,
    backgroundColor: "#fff",
  },
  levelBtnDisabled: {
    backgroundColor: "#f4f4f5",
    borderColor: "#e5e7eb",
  },
  levelText: { fontSize: 18, fontWeight: "600" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
