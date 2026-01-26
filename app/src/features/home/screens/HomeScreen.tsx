import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../../theme/colors';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Dashboard Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  text: {
    fontSize: 18,
    color: Colors.black,
    fontWeight: '600',
  },
});

export default HomeScreen;
