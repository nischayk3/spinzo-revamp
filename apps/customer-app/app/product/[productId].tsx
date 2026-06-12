import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function ProductScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Product</Text>
      <Text style={styles.subtitle}>Product ID: {productId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280' },
});
