import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Text as SvgText,
  Rect,
} from 'react-native-svg';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../../theme/colors';

const { width } = Dimensions.get('window');

// --- Profile Header ---
interface ProfileHeaderProps {
  userName: string;
  storagePercentage: number;
  profileImageUrl?: string;
  onProfileClick: () => void;
  onNotificationClick: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userName,
  storagePercentage,
  profileImageUrl,
  onProfileClick,
  onNotificationClick,
}) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.profileRow}>
        <TouchableOpacity
          onPress={onProfileClick}
          style={styles.profileContainer}
        >
          {/* Ring Mockup */}
          <View style={[styles.ring, { borderColor: '#4CAF50' }]}>
            <View style={styles.avatarContainer}>
              {profileImageUrl ? (
                <Image
                  source={{ uri: profileImageUrl }}
                  style={styles.avatar}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {userName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <Text style={styles.greeting}>HI, {userName}</Text>
          <Text style={styles.storageText}>
            Storage Used: {Math.round(storagePercentage * 100)}%
          </Text>
        </View>

        <TouchableOpacity
          style={styles.notificationButton}
          onPress={onNotificationClick}
        >
          <MaterialIcons
            name="notifications-none"
            size={28}
            color={Colors.black}
          />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Gradient Heading ---
export const GradientHeading: React.FC = () => {
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
};

// --- Quick Access Card ---
interface QuickAccessCardProps {
  onOptionClick: (option: string) => void;
}

export const QuickAccessCard: React.FC<QuickAccessCardProps> = ({
  onOptionClick,
}) => {
  return (
    <View style={styles.cardContainer}>
      <View style={{ width: '100%', borderRadius: 24, overflow: 'hidden' }}>
        <View style={styles.quickAccessGradient}>
          <Svg
            height="100%"
            width="100%"
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <Defs>
              <SvgGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#DDD6F0" />
                <Stop offset="0.5" stopColor="#E8D4F0" />
                <Stop offset="1" stopColor="#D4C4E8" />
              </SvgGradient>
            </Defs>
            <Rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="url(#cardGrad)"
            />
          </Svg>

          <View style={styles.quickAccessRow}>
            <QuickAccessItem
              name="Images"
              icon="image"
              color="#4CAF50"
              onClick={() => onOptionClick('Images')}
            />
            <QuickAccessItem
              name="Videos"
              icon="video-library"
              color="#E91E63"
              onClick={() => onOptionClick('Videos')}
            />
            <QuickAccessItem
              name="Docs"
              icon="description"
              color="#FFC107"
              onClick={() => onOptionClick('Docs')}
            />
            <QuickAccessItem
              name="Folders"
              icon="folder-open"
              color="#7C3AED"
              onClick={() => onOptionClick('Folders')}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const QuickAccessItem = ({ name, icon, color, onClick }: any) => (
  <TouchableOpacity style={styles.quickAccessItem} onPress={onClick}>
    <View style={styles.iconCircle}>
      <MaterialIcons name={icon} size={28} color={color} />
    </View>
    <Text style={styles.quickAccessText}>{name}</Text>
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
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },
  storageText: {
    fontSize: 13,
    color: Colors.gray,
    marginTop: 2,
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
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
    backgroundColor: '#DDD6F0', // Simplified gradient color
    padding: 20,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickAccessText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2D2D3A',
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
    fontWeight: '600',
  },
  summaryChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  summaryText: {
    fontSize: 12,
    color: Colors.gray,
    fontWeight: '500',
  },
  promoCard: {
    backgroundColor: '#EEF2FF', // Indigo tint
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
