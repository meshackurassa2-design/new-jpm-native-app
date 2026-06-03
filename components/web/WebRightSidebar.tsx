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

        {/* What's Happening */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>What's happening</Text>
          
          <View style={styles.trendItem}>
            <Text style={[styles.trendCategory, { color: colors.textDim }]}>Trending in Tanzania</Text>
            <Text style={[styles.trendName, { color: colors.text }]}>#JPM</Text>
            <Text style={[styles.trendStats, { color: colors.textDim }]}>25.4K Posts</Text>
          </View>
          <View style={styles.trendItem}>
            <Text style={[styles.trendCategory, { color: colors.textDim }]}>Technology · Trending</Text>
            <Text style={[styles.trendName, { color: colors.text }]}>React Native Web</Text>
            <Text style={[styles.trendStats, { color: colors.textDim }]}>10.2K Posts</Text>
          </View>
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
