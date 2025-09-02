// app/(tabs)/index.tsx
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../supabaseClient.js'; // sesuaikan path

type Row = {
  id: number;
  level: number;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correct: 'A'|'B'|'C'|'D';
  youtube_link?: string | null;
};

const TABLE_NAME = 'questions'; // ganti kalau nama tabelmu beda

export default function HomeTab() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErrorMsg('');

      // ambil contoh 5 baris dulu untuk tes (nanti kita ubah jadi 10 acak per level)
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('id, level, text, optionA, optionB, optionC, optionD, correct, youtube_link')
        .limit(5);

      if (error) {
        setErrorMsg(error.message);
        setRows([]);
      } else {
        setRows((data as Row[]) ?? []);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Mengambil data dari Supabase…</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Error mengambil data</Text>
        <Text style={{ color: 'red', marginBottom: 8 }}>{errorMsg}</Text>
        <Text>Cek: URL & anon key, nama tabel ({TABLE_NAME}), dan policy SELECT (RLS).</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tes Supabase (5 baris pertama)</Text>
      {rows.length === 0 ? (
        <Text>Tidak ada data. Pastikan CSV sudah ter-import.</Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.q}>❓ {item.text}</Text>
              <Text>A. {item.optionA}</Text>
              <Text>B. {item.optionB}</Text>
              <Text>C. {item.optionC}</Text>
              <Text>D. {item.optionD}</Text>
              <Text style={{ marginTop: 6, color: 'green' }}>Jawaban benar: {item.correct}</Text>
              {item.youtube_link ? (
                <Text style={{ marginTop: 4, opacity: 0.7 }}>YouTube: {item.youtube_link}</Text>
              ) : null}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  card: { padding: 12, borderRadius: 8, backgroundColor: '#f3f3f3', marginBottom: 10 },
  q: { fontWeight: '700', marginBottom: 6 }
});
