// screens/LeaderboardScreen.tsx
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

type Player = {
  name: string;
  points: number;
  total_time: number;
};

export default function LeaderboardScreen() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [me, setMe] = useState<Player | null>(null);

  useEffect(() => {
    // sementara dummy data
    const data: Player[] = [
      { name: "Ahmad", points: 100, total_time: 120 },
      { name: "Budi", points: 95, total_time: 150 },
      { name: "Citra", points: 92, total_time: 130 },
    ];
    setPlayers(data);
    setMe({ name: "Saya", points: 90, total_time: 140 });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 Top 10 Leaderboard</Text>
      <FlatList
        data={players}
        keyExtractor={(item, idx) => idx.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={styles.rank}>{index + 1}</Text>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.points}>{item.points} pts</Text>
            <Text style={styles.time}>{item.total_time}s</Text>
          </View>
        )}
      />
      {me && (
        <View style={styles.meBox}>
          <Text style={styles.meText}>👤 {me.name}</Text>
          <Text style={styles.meText}>{me.points} pts</Text>
          <Text style={styles.meText}>{me.total_time}s</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 12, textAlign: "center" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#eee" },
  rank: { width: 30, fontWeight: "bold" },
  name: { flex: 1 },
  points: { width: 80, textAlign: "right" },
  time: { width: 80, textAlign: "right" },
  meBox: { marginTop: 20, padding: 12, borderWidth: 1, borderRadius: 8, borderColor: "#0ea5e9", backgroundColor: "#e0f2fe" },
  meText: { textAlign: "center", fontWeight: "600" },
});
