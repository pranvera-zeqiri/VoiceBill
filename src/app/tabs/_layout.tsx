import { Tabs, useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#FB923C',
        tabBarInactiveTintColor: '#A8A29E',
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      {/* 1. Ballina (Shtëpiza) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ballina',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconCircle, focused && styles.activeBg]}>
              <View style={styles.houseContainer}>
                <View style={styles.houseRoof} />
                <View style={[styles.houseBody, { borderColor: focused ? '#1C1917' : '#A8A29E' }]} />
              </View>
            </View>
          ),
        }}
      />

      {/* 2. Faturat (Dokumenti) */}
      <Tabs.Screen
        name="add-bill"
        options={{
          title: 'Faturat',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconCircle, focused && styles.activeBg]}>
              <View style={[styles.docOutline, { borderColor: focused ? '#1C1917' : '#A8A29E' }]}>
                <View style={[styles.docLine, { backgroundColor: focused ? '#1C1917' : '#A8A29E' }]} />
                <View style={[styles.docLineShort, { backgroundColor: focused ? '#1C1917' : '#A8A29E' }]} />
              </View>
            </View>
          ),
        }}
      />

      {/* 3. Butoni Portokallor në Qendër (Mikrofoni identik si në foto) */}
      <Tabs.Screen
        name="center-mic"
        options={{
          title: '',
          tabBarButton: () => (
            <TouchableOpacity 
              style={styles.middleButtonWrapper} 
              activeOpacity={0.9}
              onPress={() => router.push('../invoice')}
            >
              <View style={styles.middleCircle}>
                <View style={styles.micCapsule} />
                <View style={styles.micArch} />
                <View style={styles.micBaseLine} />
                <View style={styles.micBaseStand} />
              </View>
            </TouchableOpacity>
          ),
        }}
      />

      {/* 4. Klientët (Grupi i njerëzve) */}
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Klientët',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconCircle, focused && styles.activeBg]}>
              <View style={styles.usersContainer}>
                <View style={[styles.userHead, { borderColor: focused ? '#1C1917' : '#A8A29E' }]} />
                <View style={[styles.userBody, { borderColor: focused ? '#1C1917' : '#A8A29E' }]} />
              </View>
            </View>
          ),
        }}
      />

      {/* 5. Profili (Ikona e përdoruesit) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profili',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconCircle, focused && styles.activeBg]}>
              <View style={styles.profileContainer}>
                <View style={[styles.profileHead, { borderColor: focused ? '#1C1917' : '#A8A29E' }]} />
                <View style={[styles.profileBody, { borderColor: focused ? '#1C1917' : '#A8A29E' }]} />
              </View>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    borderRadius: 30,
    borderTopWidth: 0,
    height: 68,
    paddingBottom: 6,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: -2,
  },
  iconCircle: {
    width: 36,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeBg: {
    backgroundColor: '#FFEDD5',
  },

  // Stili i Shtëpizës (Ballina)
  houseContainer: { width: 18, height: 16, alignItems: 'center', justifyContent: 'flex-end' },
  houseRoof: { 
    width: 0, height: 0, 
    borderLeftWidth: 9, borderRightWidth: 9, borderBottomWidth: 8, 
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#1C1917',
    marginBottom: -1 
  },
  houseBody: { width: 12, height: 9, borderWidth: 1.5, borderTopWidth: 0, borderRadius: 1 },

  // Stili i Dokumentit (Faturat)
  docOutline: { width: 14, height: 16, borderWidth: 1.5, borderRadius: 2, padding: 2, justifyContent: 'space-around' },
  docLine: { width: 8, height: 1.5, borderRadius: 1 },
  docLineShort: { width: 5, height: 1.5, borderRadius: 1 },

  // Stili i Mikrofonit në qendër
  middleButtonWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', top: -18 },
  middleCircle: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: '#FB923C',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#FB923C', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  micCapsule: { width: 6, height: 12, borderWidth: 1.5, borderColor: '#1C1917', borderRadius: 3, backgroundColor: 'transparent' },
  micArch: { width: 12, height: 7, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, borderWidth: 1.5, borderTopWidth: 0, borderColor: '#1C1917', marginTop: -3 },
  micBaseLine: { width: 1.5, height: 4, backgroundColor: '#1C1917' },
  micBaseStand: { width: 8, height: 1.5, backgroundColor: '#1C1917', borderRadius: 1 },

  // Stili i Klientëve
  usersContainer: { width: 18, height: 16, alignItems: 'center', justifyContent: 'center' },
  userHead: { width: 6, height: 6, borderRadius: 3, borderWidth: 1.5, marginBottom: 2 },
  userBody: { width: 14, height: 6, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderWidth: 1.5, borderBottomWidth: 0 },

  // Stili i Profilit
  profileContainer: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  profileHead: { width: 7, height: 7, borderRadius: 3.5, borderWidth: 1.5, marginBottom: 2 },
  profileBody: { width: 14, height: 7, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderWidth: 1.5, borderBottomWidth: 0 },
});