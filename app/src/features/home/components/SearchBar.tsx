import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ViewStyle,
} from 'react-native';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors, Typography } from '../../../theme';
import { SearchSuggestion } from '../types';

interface SearchBarProps {
  searchQuery: string;
  onQueryChange: (query: string) => void;
  searchResults?: SearchSuggestion[];
  onFilterClick?: () => void;
  onSuggestionClick?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  style?: ViewStyle;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onQueryChange,
  searchResults = [],
  onFilterClick,
  onSuggestionClick,
  placeholder = 'Search',
  style,
}) => {
  const hasSuggestions = searchQuery.length > 0 && searchResults.length > 0;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <MaterialIcons
          name="search"
          size={20}
          color="#5C5C5C" // Darker gray for icon
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#757575"
          value={searchQuery}
          onChangeText={onQueryChange}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onQueryChange('')}>
            <MaterialIcons
              name="close"
              size={18}
              color="#757575"
              style={styles.icon}
            />
          </TouchableOpacity>
        )}
        {onFilterClick && (
          <TouchableOpacity onPress={onFilterClick} style={styles.filterButton}>
            <MaterialIcons name="tune" size={20} color="#1E293B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestions Popup */}
      {hasSuggestions && onSuggestionClick && (
        <View style={styles.suggestionsContainer}>
          {searchResults.map(suggestion => (
            <TouchableOpacity
              key={suggestion.id}
              style={styles.suggestionItem}
              onPress={() => onSuggestionClick(suggestion)}
            >
              <View style={styles.suggestionIconContainer}>
                <MaterialIcons
                  name={suggestion.icon || 'description'}
                  size={20}
                  color={Colors.purple.vibrant}
                />
              </View>
              <View style={styles.suggestionTextContainer}>
                <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                <Text style={styles.suggestionSubtitle}>
                  {suggestion.subtitle}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 100,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    paddingVertical: 8,
    fontFamily: Typography.fontFamily.regular,
  },
  filterButton: {
    marginLeft: 12,
    padding: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suggestionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.bold,
    color: '#1E293B',
  },
  suggestionSubtitle: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: '#64748B',
    marginTop: 2,
  },
});
