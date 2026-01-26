import React from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store';
import AppContainer from './src/AppContainer';

function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AppContainer />
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;
