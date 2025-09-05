// screens/HomeScreen.tsx
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useState } from "react";
import {
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { RootStackParamList } from "../App";

type HomeNav = StackNavigationProp<RootStackParamList, "Home">;
type Props = { navigation: HomeNav };

export default function HomeScreen({ navigation }: Props) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const handleStart = () => {
    if (!name || !whatsapp) {
      Alert.alert("Isi Data", "Nama dan nomor WhatsApp wajib diisi!");
      return;
    }
    navigation.navigate("Level", { level: 1 });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📖 Kuis Islami</Text>
      <Text style={styles.subtitle}>Masukkan data untuk mulai bermain</Text>

      <TextInput
        style={styles.input}
        placeholder="Nama Lengkap"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Nomor WhatsApp"
        value={whatsapp}
        onChangeText={setWhatsapp}
        keyboardType="phone-pad"
      />

      <Button title="Mulai Kuis" onPress={handleStart} />

      <TouchableOpacity
        style={styles.linkBtn}
        onPress={() => navigation.navigate("Leaderboard")}
      >
        <Text style={styles.linkText}>📊 Lihat Leaderboard</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkBtn}
        onPress={() => navigation.navigate("Profile")}
      >
        <Text style={styles.linkText}>👤 Profil Saya</Text>
      </TouchableOpacity>

      {/* Info Rekening */}
      <View style={styles.noticeBox}>
        <Text style={styles.noticeTitle}>💳 Dukung Kuis Islami</Text>
        <Text style={styles.noticeText}>
          Transfer ke rekening:{"\n"}
          BSI 123456789 a.n Kuis Islami
        </Text>
      </View>

      {/* Pengumuman */}
      <View style={styles.noticeBox}>
        <Text style={styles.noticeTitle}>📌 Pengumuman</Text>
        <Text style={styles.noticeText}>
          Kuis berhadiah akan diumumkan di grup WhatsApp resmi.
        </Text>
      </View>

      {/* Syarat & Ketentuan */}
      <View style={styles.noticeBox}>
        <Text style={styles.noticeTitle}>📜 Syarat & Ketentuan</Text>
        <Text style={styles.noticeText}>
          1. Peserta wajib mengisi data dengan benar. {"\n"}
          2. Nilai akan dihitung otomatis. {"\n"}
          3. Hadiah hanya untuk peserta terdaftar.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  subtitle: { textAlign: "center", marginBottom: 20, fontSize: 16 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 15 },
  linkBtn: { marginTop: 10, alignItems: "center" },
  linkText: { color: "blue", textDecorationLine: "underline" },
  noticeBox: { marginTop: 20, padding: 15, borderWidth: 1, borderColor: "#ccc", borderRadius: 10, backgroundColor: "#fff" },
  noticeTitle: { fontWeight: "bold", marginBottom: 5 },
  noticeText: { fontSize: 14, lineHeight: 20 },
});
