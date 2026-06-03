import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function WebRightSidebar() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={{ width: 350 }}>
        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={20} color={colors.textDim} />
          <TextInput 
            placeholder="Search JPM" 
            placeholderTextColor={colors.textDim}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    paddingLeft: 24,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  trendItem: {
    marginBottom: 16,
  },
  trendCategory: {
    fontSize: 13,
    marginBottom: 2,
  },
  trendName: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  trendStats: {
    fontSize: 13,
  }
});
