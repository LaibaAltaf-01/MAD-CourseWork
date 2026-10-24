import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function TaskCard({ item, onDelete }) {
  if (!item) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.text}>{item.name}</Text>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.id)}>
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  text: {
    fontSize: 16,
    color: '#000',
  },
  deleteBtn: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});