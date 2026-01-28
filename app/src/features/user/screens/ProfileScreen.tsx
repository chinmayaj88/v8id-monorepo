import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { logoutUser } from '../../auth/store/authSlice';
import { Colors } from '../../../theme/colors';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '@env';

import EditProfileSheet from '../components/EditProfileSheet';

const ProfileScreen = () => {
  const navigation: any = useNavigation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const [showEditSheet, setShowEditSheet] = React.useState(false);

  // Mock data if user is incomplete (should fetch from DB/API in real scenario)
  const userName = user
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`.trim() ||
      user.email
    : 'Guest';

  // Initials logic
  const initials = useMemo(() => {
    if (!userName) return 'U';
    const parts = userName.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return userName.slice(0, 2).toUpperCase();
  }, [userName]);

  const handleLogout = () => {
    dispatch(logoutUser())
      .unwrap()
      .then(() => {
        // Navigation handled automatically by RootNavigator based on auth state
      })
      .catch(() => {
        // Handle error if needed
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={20} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowEditSheet(true)}
          >
            <MaterialIcons name="edit" size={20} color={Colors.black} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <ProfileCard
          userName={userName || ''}
          userEmail={user?.email || ''}
          initials={initials}
          avatarUrl={user?.avatarUrl}
        />

        {/* Plan Card */}
        <PlanCard
          planName="V8id Cloud Basic"
          isFree={true}
          usedGB={0.0}
          totalGB={10.0}
          onClick={() => {
            // @ts-ignore
            navigation.navigate('Storage');
          }}
        />

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <AccountMenuItem
            icon="photo-camera"
            iconColor="#2196F3"
            title="Camera Uploads"
            subtitle="Auto-backup your photos"
            onClick={() => {}}
          />
          <AccountMenuItem
            icon="desktop-windows"
            iconColor="#2196F3"
            title="Link your desktop"
            subtitle="Sync files with your computer"
            onClick={() => {}}
          />
          <AccountMenuItem
            icon="delete-outline"
            iconColor="#9C27B0"
            title="Trash"
            subtitle="Restore deleted files"
            onClick={() => {
              // @ts-ignore
              navigation.navigate('Trash');
            }}
          />
          <AccountMenuItem
            icon="security"
            iconColor={Colors.purple.vibrant}
            title="Active Sessions"
            subtitle="Manage your logged-in devices"
            onClick={() => {
              // @ts-ignore
              navigation.navigate('ActiveSessions');
            }}
          />
          <AccountMenuItem
            icon="storage"
            iconColor="#4CAF50"
            title="Storage Details"
            subtitle="0.0 GB of 10 GB used"
            onClick={() => {
              // @ts-ignore
              navigation.navigate('Storage');
            }}
          />
          <AccountMenuItem
            icon="lock"
            iconColor="#FFC107"
            title="Security Settings"
            subtitle="Password and 2FA"
            onClick={() => {}}
          />
        </View>

        {/* Logout */}
        <LogoutButton onClick={handleLogout} />
      </ScrollView>

      <EditProfileSheet
        visible={showEditSheet}
        onClose={() => setShowEditSheet(false)}
      />
    </SafeAreaView>
  );
};

// --- Sub-components ---

const ProfileCard = ({ userName, userEmail, initials, avatarUrl }: any) => (
  <View style={styles.profileCard}>
    <View style={styles.avatarWrapper}>
      <View
        style={[
          styles.avatarBorder,
          { borderColor: '#7CB342' /* Green Gradient mock */ },
        ]}
      >
        <View style={styles.avatarInner}>
          {avatarUrl ? (
            <Image
              source={{
                uri: avatarUrl.startsWith('http')
                  ? avatarUrl
                  : `${API_URL.replace('/api', '')}${avatarUrl}`,
              }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarText}>{initials}</Text>
          )}
        </View>
      </View>
    </View>
    <Text style={styles.userName}>{userName}</Text>
    <Text style={styles.userEmail}>{userEmail}</Text>
  </View>
);

const PlanCard = ({ planName, isFree, usedGB, totalGB, onClick }: any) => (
  <View style={styles.planCard}>
    <View style={styles.planRow}>
      <View style={styles.planIconContainer}>
        <MaterialIcons name="cloud" size={28} color={Colors.purple.vibrant} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.planLabel}>Your Plan</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.planName}>{planName}</Text>
          {isFree && (
            <View style={styles.freeBadge}>
              <Text style={styles.freeText}>Free</Text>
            </View>
          )}
        </View>
        <Text style={styles.planSubtitle}>Manage your plan details here.</Text>
      </View>
    </View>

    <TouchableOpacity style={styles.manageButton} onPress={onClick}>
      <Text style={styles.manageButtonText}>Manage Your Plan</Text>
      <View style={styles.arrowCircle}>
        <MaterialIcons name="arrow-forward" size={16} color="white" />
      </View>
    </TouchableOpacity>
  </View>
);

const AccountMenuItem = ({
  icon,
  iconColor,
  title,
  subtitle,
  onClick,
}: any) => (
  <TouchableOpacity
    style={[styles.menuItem, { backgroundColor: `${iconColor}10` }]}
    onPress={onClick}
  >
    <View
      style={[styles.menuIconContainer, { backgroundColor: `${iconColor}20` }]}
    >
      <MaterialIcons name={icon} size={22} color={iconColor} />
    </View>
    <View style={{ flex: 1, paddingHorizontal: 12 }}>
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.menuSubtitle}>{subtitle}</Text>
    </View>
    <MaterialIcons name="chevron-right" size={24} color={Colors.gray} />
  </TouchableOpacity>
);

const LogoutButton = ({ onClick }: any) => (
  <TouchableOpacity style={styles.logoutButton} onPress={onClick}>
    <MaterialIcons name="logout" size={22} color="#E91E63" />
    <Text style={styles.logoutText}>Log Out</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  avatarBorder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 84,
    height: 84,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.purple.vibrant,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.gray,
  },
  planCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  planRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  planIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.purple.subtleTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planLabel: {
    fontSize: 13,
    color: Colors.gray,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginRight: 8,
  },
  freeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  freeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4CAF50',
  },
  planSubtitle: {
    fontSize: 13,
    color: Colors.gray,
    marginTop: 2,
  },
  manageButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  manageButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.black,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    gap: 8,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.black,
  },
  menuSubtitle: {
    fontSize: 12,
    color: Colors.gray,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCE4EC',
    borderColor: '#F8BBD0',
    borderWidth: 1,
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 64,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E91E63',
  },
});

export default ProfileScreen;
