// app/(tabs)/index.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LevelScreen from "../../components/LevelScreen";

type Profile = {
  name: string;
  phone: string;
};

const PROFILE_KEY = "playerProfile";

export default function HomeTab() {
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Load profile saat pertama kali
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
      } catch (e) {
        console.warn("Failed loading profile", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveProfile = async () => {
    const nm = name.trim();
    const ph = phone.trim();

    if (nm.length < 2) {
      Alert.alert("Validasi", "Nama minimal 2 karakter.");
      return;
    }
    // validasi nomor sederhana: hanya angka + opsional tanda + diawal
    if (!/^\+?\d{8,15}$/.test(ph)) {
      Alert.alert(
        "Validasi",
        "No. WA tidak valid. Gunakan angka saja, boleh diawali +, panjang 8–15 digit."
      );
      return;
    }

    const p: Profile = { name: nm, phone: ph };
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
      setProfile(p);
      setEditing(false);
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

  // Saat sedang bermain level
  if (activeLevel != null) {
    return (
      <LevelScreen
        level={activeLevel}
        onExit={() => setActiveLevel(null)}
        // ❌ jangan kirim prop "player" di sini
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 16 }}>Memuat…</Text>
      </View>
    );
  }

  // Form profil (saat belum ada profil atau sedang edit)
  if (!profile || editing) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
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
      </ScrollView>
    );
  }

  // Halaman utama: daftar level
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Kuis Islami</Text>
      <View style={styles.card}>
        <Text style={styles.greet}>Assalamu’alaikum, {profile.name}</Text>
        <Text style={styles.phone}>WA: {profile.phone}</Text>

        <TouchableOpacity style={styles.linkBtn} onPress={() => setEditing(true)}>
          <Text style={styles.linkText}>Ubah Profil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkBtn} onPress={clearProfile}>
          <Text style={styles.linkText}>Hapus Profil</Text>
        </TouchableOpacity>
      </View>

      {[1, 2, 3, 4, 5].map((lv) => (
        <TouchableOpacity key={lv} style={styles.levelBtn} onPress={() => setActiveLevel(lv)}>
          <Text style={styles.levelText}>Mulai Level {lv}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { fontSize: 28, fontWeight: "800", marginBottom: 8 },
  subheader: { fontSize: 16, color: "#555", marginBottom: 16 },
  field: { marginBottom: 12 },
  label: { fontSize: 14, color: "#666", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  linkText: { color: "#0ea5e9", fontSize: 14, fontWeight: "600" },

  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  greet: { fontSize: 16, fontWeight: "600" },
  phone: { fontSize: 14, color: "#555", marginTop: 2 },

  levelBtn: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  levelText: { fontSize: 18 },
});
