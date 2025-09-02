// screens/ProfileScreen.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackNavigationProp } from "@react-navigation/stack";
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
import type { RootStackParamList } from "../App";

type ProfileNavProp = StackNavigationProp<RootStackParamList, "Profile">;

type Props = {
  navigation: ProfileNavProp;
};

type Profile = {
  name: string;
  whatsapp: string;
};

const PROFILE_KEY = "playerProfile";

export default function ProfileScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PROFILE_KEY);
        if (raw) {
          const p: Profile = JSON.parse(raw);
          setProfile(p);
          setName(p.name);
          setWhatsapp(p.whatsapp);
        }
      } catch (e) {
        console.warn("Gagal load profil", e);
      }
    })();
  }, []);

  const saveProfile = async () => {
    if (!name || !whatsapp) {
      Alert.alert("Validasi", "Nama dan nomor WhatsApp wajib diisi!");
      return;
    }
    const p: Profile = { name, whatsapp };
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
      setProfile(p);
      Alert.alert("Tersimpan", "Profil berhasil disimpan.");
    } catch {
      Alert.alert("Error", "Gagal menyimpan profil.");
    }
  };

  const clearProfile = async () => {
    await AsyncStorage.removeItem(PROFILE_KEY);
    setProfile(null);
    setName("");
    setWhatsapp("");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>👤 Profil Saya</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Nama</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="cth: Budi"
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>No. WhatsApp</Text>
        <TextInput
          value={whatsapp}
          onChangeText={setWhatsapp}
          placeholder="cth: 08123456789"
          keyboardType="phone-pad"
          style={styles.input}
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
        <Text style={styles.saveText}>💾 Simpan</Text>
      </TouchableOpacity>

      {profile && (
        <TouchableOpacity style={styles.clearBtn} onPress={clearProfile}>
          <Text style={styles.clearText}>🗑 Hapus Profil</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.backText}>⬅️ Kembali</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#f8f9fa" },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  field: { marginBottom: 15 },
  label: { fontSize: 14, color: "#444", marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
  },
  saveBtn: {
    backgroundColor: "#0ea5e9",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  saveText: { color: "white", fontWeight: "700" },
  clearBtn: {
    backgroundColor: "#f87171",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  clearText: { color: "white", fontWeight: "700" },
  backBtn: {
    marginTop: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#0ea5e9",
    borderRadius: 10,
    alignItems: "center",
  },
  backText: { color: "#0ea5e9", fontWeight: "700" },
});
