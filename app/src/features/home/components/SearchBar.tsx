import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../../theme/colors';
import { SearchSuggestion } from '../types';

interface SearchBarProps {
  searchQuery: string;
  onQueryChange: (query: string) => void;
  searchResults: SearchSuggestion[];
  onFilterClick: () => void;
  onSuggestionClick: (suggestion: SearchSuggestion) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onQueryChange,
  searchResults,
  onFilterClick,
  onSuggestionClick,
}) => {
  const hasSuggestions = searchQuery.length > 0 && searchResults.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <MaterialIcons
          name="search"
          size={20}
          color={Colors.gray}
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder="Search files"
          placeholderTextColor={Colors.gray}
          value={searchQuery}
          onChangeText={onQueryChange}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onQueryChange('')}>
            <MaterialIcons
              name="close"
              size={20}
              color={Colors.gray}
              style={styles.icon}
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onFilterClick} style={styles.filterButton}>
          <MaterialIcons name="tune" size={20} color={Colors.gray} />
        </TouchableOpacity>
      </View>

      {/* Suggestions Popup */}
      {hasSuggestions && (
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
                  size={18}
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
    zIndex: 100, // Ensure popup is above other elements
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 24,
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB', // TextTertiary alpha 0.3
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.black,
    paddingVertical: 8,
  },
  filterButton: {
    marginLeft: 12,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 56, // 48 height + 8 margin
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 8, // Fixed padding logic
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
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
    borderRadius: 18,
    backgroundColor: Colors.purple.subtleTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.black,
  },
  suggestionSubtitle: {
    fontSize: 13,
    color: Colors.gray,
  },
});
