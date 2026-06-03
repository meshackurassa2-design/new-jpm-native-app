import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useTheme } from '../../lib/theme';
import Svg, { Path } from 'react-native-svg';

export default function WebSidebar({ isTablet }: { isTablet?: boolean }) {
  const { colors } = useTheme();
  const pathname = usePathname();

  const NAV_ITEMS = [
    { label: 'Home', icon: 'home', iconOutline: 'home-outline', route: '/' },
    { label: 'Search', icon: 'search', iconOutline: 'search-outline', route: '/search' },
    { label: 'AI', icon: 'ai', iconOutline: 'ai', route: '/ai' },
    { label: 'Marketplace', icon: 'cart', iconOutline: 'cart-outline', route: '/marketplace' },
    { label: 'Messages', icon: 'chatbubble', iconOutline: 'chatbubble-outline', route: '/messages' },
    { label: 'Profile', icon: 'person', iconOutline: 'person-outline', route: '/profile' },
  ];

  return (
    <View style={[styles.container, isTablet && { alignItems: 'center' }]}>
      <View style={{ flex: 1, paddingTop: 16, width: isTablet ? 50 : 240 }}>
        {/* Logo */}
        <TouchableOpacity style={[styles.logoBtn, isTablet && { paddingHorizontal: 0, alignItems: 'center' }]} onPress={() => router.push('/')}>
          <Text style={[styles.logoText, { color: colors.text }, isTablet && { fontSize: 18 }]}>JPM</Text>
        </TouchableOpacity>

        <View style={{ marginTop: 24, gap: 12 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.route;
            return (
              <TouchableOpacity
                key={item.route}
                style={[styles.navItem, isTablet && { justifyContent: 'center', width: 50, paddingHorizontal: 0 }]}
                onPress={() => router.push(item.route as any)}
              >
                {item.icon === 'ai' ? (
                   <Svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={isActive ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
                     <Path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                     <Path d="M9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0z" />
                   </Svg>
                ) : (
                   <Ionicons 
                     name={isActive ? item.icon : item.iconOutline as any} 
                     size={28} 
                     color={colors.text} 
                   />
                )}
                {!isTablet && (
                  <Text style={[styles.navLabel, { color: colors.text }, isActive && { fontWeight: 'bold' }]}>
                    {item.label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity 
          style={[styles.postBtn, { backgroundColor: colors.primary }, isTablet && { width: 50, height: 50, borderRadius: 25, paddingHorizontal: 0 }]}
          onPress={() => router.push('/create-post')}
        >
          {isTablet ? (
             <Ionicons name="add" size={28} color="#fff" />
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  logoBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  navLabel: {
    fontSize: 20,
    marginLeft: 20,
  },
  postBtn: {
    marginTop: 24,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  postBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  }
});
