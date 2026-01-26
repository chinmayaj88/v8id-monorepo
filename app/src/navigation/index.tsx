import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAppSelector } from '../store/hooks';
import AuthNavigator from './stacks/AuthNavigator';
import TabNavigator from './TabNavigator';

const RootNavigator = () => {
  const { isAuthenticated } = useAppSelector(state => state.auth);

  return (
    <NavigationContainer>
      {isAuthenticated ? <TabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator;
