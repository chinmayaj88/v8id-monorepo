import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// @ts-ignore
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../../theme/colors';
import fileService, {
  StorageAnalyticsDTO,
} from '../../../services/api/fileService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AppModal from '../../../components/AppModal';

const { width } = Dimensions.get('window');

const StorageScreen = () => {
  const navigation = useNavigation();
  const [analytics, setAnalytics] = useState<StorageAnalyticsDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    description?: string;
    variant?: 'default' | 'danger';
  }>({
    visible: false,
    title: '',
  });

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await fileService.getStorageAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics', error);
      setModalConfig({
        visible: true,
        title: 'Error',
        description: 'Failed to load storage details.',
        variant: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatBytes = (bytes: string | number) => {
    const b = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (b === 0) return '0 B';
    const i = Math.floor(Math.log(b) / Math.log(1024));
    return `${(b / Math.pow(1024, i)).toFixed(2)} ${
      ['B', 'KB', 'MB', 'GB', 'TB'][i]
    }`;
  };

  // Circular Progress Component
  const CircularProgress = ({ percentage }: { percentage: number }) => {
    const size = 180;
    const strokeWidth = 15;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = Math.min(Math.max(percentage, 0), 100);
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <View style={styles.chartContainer}>
        <Svg width={size} height={size}>
          {/* Background Circle */}
          <Circle
            stroke="#E2E8F0"
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          {/* Progress Circle */}
          <Circle
            stroke={Colors.purple.vibrant}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.chartTextContainer}>
          <Text style={styles.chartPercentage}>{percentage.toFixed(1)}%</Text>
          <Text style={styles.chartLabel}>Used</Text>
        </View>
      </View>
    );
  };

  const renderBreakdownItem = (
    label: string,
    bytes: string,
    color: string,
    icon: string,
  ) => {
    return (
      <View style={styles.breakdownItem}>
        <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
          <MaterialIcons name={icon} size={24} color={color} />
        </View>
        <View style={styles.breakdownInfo}>
          <Text style={styles.breakdownLabel}>{label}</Text>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: color,
                  width: `${
                    analytics
                      ? (parseInt(bytes) / parseInt(analytics.totalQuota)) * 100
                      : 0
                  }%`,
                },
              ]}
            />
          </View>
        </View>
        <Text style={styles.breakdownValue}>{formatBytes(bytes)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.title}>Storage</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.purple.vibrant} />
          </View>
        ) : analytics ? (
          <>
            {/* Overview Card */}
            <View style={styles.overviewCard}>
              <Text style={styles.overviewTitle}>Storage Overview</Text>
              <View style={styles.chartWrapper}>
                <CircularProgress percentage={analytics.usagePercentage} />
              </View>
              <View style={styles.usageTextRow}>
                <Text style={styles.totalUsed}>
                  {formatBytes(analytics.totalUsage)}
                </Text>
                <Text style={styles.totalQuota}>
                  {' '}
                  of {formatBytes(analytics.totalQuota)} used
                </Text>
              </View>
            </View>

            {/* Breakdown Section */}
            <View style={styles.breakdownSection}>
              <Text style={styles.sectionTitle}>Details</Text>
              {renderBreakdownItem(
                'Images',
                analytics.breakdown.images,
                '#FF9800',
                'image',
              )}
              {renderBreakdownItem(
                'Videos',
                analytics.breakdown.videos,
                '#F44336',
                'videocam',
              )}
              {renderBreakdownItem(
                'Documents',
                analytics.breakdown.documents,
                '#2196F3',
                'description',
              )}
              {renderBreakdownItem(
                'Audio',
                analytics.breakdown.audio,
                '#9C27B0',
                'audiotrack',
              )}
              {renderBreakdownItem(
                'Others',
                analytics.breakdown.others,
                '#607D8B',
                'insert-drive-file',
              )}
            </View>

            {/* Upgrade Plan Banner */}
            <View style={styles.upgradeBanner}>
              <View>
                <Text style={styles.upgradeTitle}>Need more space?</Text>
                <Text style={styles.upgradeSubtitle}>
                  Upgrade your plan to get more storage.
                </Text>
              </View>
              <TouchableOpacity style={styles.upgradeButton}>
                <Text style={styles.upgradeButtonText}>Upgrade</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Text>No analytics data available.</Text>
          </View>
        )}
      </ScrollView>

      <AppModal
        visible={modalConfig.visible}
        onClose={() => setModalConfig({ ...modalConfig, visible: false })}
        title={modalConfig.title}
        description={modalConfig.description}
        variant={modalConfig.variant as any}
        actions={[
          {
            text: 'OK',
            onPress: () => setModalConfig({ ...modalConfig, visible: false }),
          },
        ]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  chartWrapper: {
    marginBottom: 20,
  },
  chartContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  chartTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPercentage: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.purple.vibrant,
  },
  chartLabel: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 4,
  },
  usageTextRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalUsed: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
  },
  totalQuota: {
    fontSize: 16,
    color: Colors.gray,
  },
  breakdownSection: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  breakdownInfo: {
    flex: 1,
    marginRight: 16,
  },
  breakdownLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 4, // Ensure visibility for tiny files
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray,
  },
  upgradeBanner: {
    backgroundColor: Colors.purple.deep,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  upgradeSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    maxWidth: 200,
  },
  upgradeButton: {
    backgroundColor: Colors.white,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  upgradeButtonText: {
    color: Colors.purple.deep,
    fontWeight: '700',
    fontSize: 14,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
});

export default StorageScreen;
