import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ImageBackground,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Text as SvgText,
  Rect,
  Circle,
} from 'react-native-svg';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography } from '../../../theme';
import { API_URL } from '@env';
import { TransferStatusIcon } from './TransferStatusIcon';

const { width } = Dimensions.get('window');

// --- Profile Header ---
interface ProfileHeaderProps {
  userName: string;
  storagePercentage: number;
  profileImageUrl?: string;
  onProfileClick: () => void;
  onNotificationClick: () => void;
  navigation?: any;
}

export const ProfileHeader = React.memo<ProfileHeaderProps>(
  ({
    userName,
    storagePercentage,
    profileImageUrl,
    onProfileClick,
    onNotificationClick,
  }) => {
    const navigation: any = useNavigation();
    return (
      <View style={styles.headerContainer}>
        <View style={styles.profileRow}>
          <TouchableOpacity
            onPress={onProfileClick}
            style={styles.profileContainer}
          >
            {/* Real Storage Ring */}
            <Svg height="64" width="64" style={styles.svgRing}>
              <Circle
                cx="32"
                cy="32"
                r="30"
                stroke="#E8F5E9"
                strokeWidth="4"
                fill="none"
              />
              <Circle
                cx="32"
                cy="32"
                r="30"
                stroke="#4CAF50"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 30}`}
                strokeDashoffset={`${
                  2 *
                  Math.PI *
                  30 *
                  (1 - Math.min(Math.max(storagePercentage, 0), 1))
                }`}
                strokeLinecap="round"
                transform="rotate(-90 32 32)"
              />
            </Svg>
            <View style={styles.avatarContainer}>
              {profileImageUrl ? (
                <Image
                  source={{
                    uri: profileImageUrl.startsWith('http')
                      ? profileImageUrl
                      : `${API_URL.replace('/api', '')}${profileImageUrl}`,
                  }}
                  style={styles.avatar}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {userName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.userInfo}>
            <Text style={styles.greeting}>HI, {userName}</Text>
            <Text style={styles.storageText}>
              Storage Used: {Math.round(storagePercentage * 100)}%
            </Text>
          </View>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButtonWrapper}
              onPress={() => navigation.navigate('Activities')}
            >
              <MaterialIcons name="swap-vert" size={24} color={Colors.black} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButtonWrapper}
              onPress={onNotificationClick}
            >
              <MaterialIcons
                name="notifications-none"
                size={24}
                color={Colors.black}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  },
);

// --- Gradient Heading ---
export const GradientHeading = React.memo(() => {
  const text = 'Save With V8id Cloud';
  const fontSize = width * 0.08;
  const clampedFontSize = Math.min(Math.max(fontSize, 20), 32);

  return (
    <View style={styles.gradientHeadingContainer}>
      <Svg height={clampedFontSize * 1.5} width="100%">
        <Defs>
          <SvgGradient id="grad" x1="0" y1="0" x2="100%" y2="0">
            <Stop
              offset="0"
              stopColor={Colors.purple.vibrant}
              stopOpacity="1"
            />
            <Stop
              offset="0.5"
              stopColor={Colors.purple.indigo}
              stopOpacity="1"
            />
            <Stop
              offset="1"
              stopColor={Colors.purple.vibrantAlt}
              stopOpacity="1"
            />
          </SvgGradient>
        </Defs>
        <SvgText
          fill="url(#grad)"
          stroke="none"
          fontSize={clampedFontSize}
          fontWeight="bold"
          x="0"
          y={clampedFontSize}
        >
          {text}
        </SvgText>
      </Svg>
    </View>
  );
});

// --- Quick Access Card ---
interface QuickAccessCardProps {
  onOptionClick: (option: string) => void;
}

// @ts-ignore
const bg2 = require('../../../assets/images/bg2.jpg');

export const QuickAccessCard: React.FC<QuickAccessCardProps> = ({
  onOptionClick,
}) => {
  const navigation = useNavigation(); // Added useNavigation hook
  return (
    <View style={styles.cardContainer}>
      <View style={{ width: '100%', borderRadius: 24, overflow: 'hidden' }}>
        <ImageBackground
          source={bg2}
          style={styles.quickAccessGradient}
          resizeMode="cover"
        >
          {/* Subtle Overlay */}
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: 'rgba(255,255,255,0.1)',
            }}
          />

          <View
            style={{
              marginBottom: 10,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: Colors.black,
              }}
            >
              Quick Access Items
            </Text>
          </View>

          <View style={styles.quickAccessRow}>
            <QuickAccessItem
              name="Images"
              icon="image"
              color="#4CAF50"
              size="2.4 GB"
              onClick={() => onOptionClick('Images')}
            />
            <QuickAccessItem
              name="Videos"
              icon="video-library"
              color="#E91E63"
              size="4.2 GB"
              onClick={() => onOptionClick('Videos')}
            />
            <QuickAccessItem
              name="Docs"
              icon="description"
              color="#FFC107"
              size="1.2 GB"
              onClick={() => onOptionClick('Docs')}
            />
            <QuickAccessItem
              name="Files"
              icon="file-present"
              color="#7C3AED"
              size="850 MB"
              onClick={() => {
                if (onOptionClick) {
                  onOptionClick('Files');
                }
                // @ts-ignore
                navigation.navigate('Files');
              }}
            />
          </View>
        </ImageBackground>
      </View>
    </View>
  );
};

const QuickAccessItem = ({ name, icon, color, size, onClick }: any) => (
  <TouchableOpacity style={styles.quickAccessItem} onPress={onClick}>
    <View style={styles.iconCircle}>
      <MaterialIcons name={icon} size={28} color={color} />
    </View>
    <Text style={styles.quickAccessText}>{name}</Text>
    <Text style={styles.quickAccessSize}>{size}</Text>
  </TouchableOpacity>
);

// --- Filter Chip ---
interface FilterChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected,
  onClick,
}) => (
  <TouchableOpacity
    style={[styles.chip, selected && styles.chipSelected]}
    onPress={onClick}
  >
    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// --- File Summary Chip --- (Inferred)
interface FileSummaryChipProps {
  fileCount: number;
  folderCount: number;
}
export const FileSummaryChip: React.FC<FileSummaryChipProps> = ({
  fileCount,
  folderCount,
}) => (
  <View style={styles.summaryChip}>
    <Text style={styles.summaryText}>
      {fileCount} Files • {folderCount} Folders
    </Text>
  </View>
);

// --- Viewed Links Card --- (Inferred)
interface ViewedLinksCardProps {
  onSeeAllClick: () => void;
}
export const ViewedLinksCard: React.FC<ViewedLinksCardProps> = ({
  onSeeAllClick,
}) => (
  <View style={styles.promoCard}>
    <View style={styles.promoContent}>
      <Text style={styles.promoTitle}>Shared Links</Text>
      <Text style={styles.promoSubtitle}>Manage your shared content</Text>
    </View>
    <TouchableOpacity onPress={onSeeAllClick}>
      <Text style={styles.promoAction}>See All</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 10,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileContainer: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svgRing: {
    position: 'absolute',
  },
  ring: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 44,
    height: 44,
  },
  avatarText: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.bold,
    color: '#2E7D32',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  storageText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray,
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButtonWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    marginLeft: 10,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.purple.vibrant,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  gradientHeadingContainer: {
    marginVertical: 4,
  },
  cardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    marginVertical: 8,
  },
  quickAccessGradient: {
    backgroundColor: '#DDD6F0',
    padding: 18,
    borderRadius: 24,
  },
  quickAccessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickAccessItem: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 28,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickAccessText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: '#2D2D3A',
    fontWeight: 'bold',
  },
  quickAccessSize: {
    fontSize: 10,
    marginTop: 2,
    color: '#64748B',
    fontWeight: '500',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: '#FAF5FF', // 0.1 alpha purple
    borderColor: Colors.purple.vibrant,
  },
  chipText: {
    fontSize: 14,
    color: Colors.gray,
  },
  chipTextSelected: {
    color: Colors.purple.vibrant,
    fontFamily: Typography.fontFamily.bold,
  },
  summaryChip: {
    backgroundColor: '#e7ebf1ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  summaryText: {
    fontSize: 12,
    color: Colors.gray,
    fontWeight: '500',
  },
  promoCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E1B4B',
  },
  promoSubtitle: {
    fontSize: 13,
    color: '#4338CA',
  },
  promoAction: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.purple.indigo,
  },
});
