// Import React to create and manage the application component.
import React, { useEffect } from 'react';

// Provides safe-area support so content avoids areas such as the
// device notch and system interface.
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Controls the appearance of the phone's status bar.
import { StatusBar } from 'expo-status-bar';

// Loads custom fonts before the application is displayed.
import { useFonts } from 'expo-font';

// Import the Fredoka font styles used in the app.
import {
  Fredoka_600SemiBold,
  Fredoka_700Bold
} from '@expo-google-fonts/fredoka';

// Import the Nunito font styles used in the app.
import {
  Nunito_700Bold,
  Nunito_800ExtraBold
} from '@expo-google-fonts/nunito';

// Import providers that manage authentication and shopping cart data.
// These make their shared data available to components inside them.
import { AuthProvider, CartProvider } from './frontend/store';

// Import the main Blushly application component.
import BlushlyApp from './frontend/screens/BlushlyApp';

// Main component of the application.
// React Native starts rendering the app through this component.
export default function App() {

  // Load fonts in the background so a font issue cannot block app startup.
  const [, fontError] = useFonts({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    if (fontError) {
      console.error('Could not load custom fonts; continuing with system fonts:', fontError);
    }
  }, [fontError]);

  return (

    // Provides safe-area context to the entire application.
    <SafeAreaProvider>

      {/* Makes authentication data available to child components. */}
      <AuthProvider>

        {/* Makes shopping cart data available to child components. */}
        <CartProvider>

          {/* Set the phone's status bar to use a dark style. */}
          <StatusBar style="dark" />

          {/* Render the main Blushly shopping app. */}
          <BlushlyApp />

        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}