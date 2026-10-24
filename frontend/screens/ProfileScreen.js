// Import React to create the ProfileScreen component.
import React from 'react';

// Import components used to build the screen layout and text.
import { ScrollView, StyleSheet, Text, View } from 'react-native';

// Import Ionicons to display the profile icon.
import { Ionicons } from '@expo/vector-icons';

// Import colors and fonts defined in your project's data file.
import { colors, fonts } from '../data';

// Import useAuth to access the logged-in user's information and logout function.
import { useAuth } from '../store';

// Import AppButton, the reusable button component used in the app.
import { AppButton } from '../components/components';

// Import AuthScreen to display the login/signup screen when no user is logged in.
import AuthScreen from './AuthScreen';

// Create and export the ProfileScreen component.
// The props are used to handle authentication and pending checkout actions.
export default function ProfileScreen({
  checkoutPending,
  authPrompt,
  onAuthenticated,
  onClearPrompt
}) {
  // Get the current user and logout function from the authentication store.
  const { user, logout } = useAuth();

  // Check whether a user is currently logged in.
  if (!user) {
    // If no user is logged in, display the AuthScreen instead of the profile.
    return (
      <AuthScreen
        checkoutPending={checkoutPending} // Pass the pending checkout status.
        prompt={authPrompt} // Pass the message or prompt for authentication.
        onAuthenticated={onAuthenticated} // Handle successful authentication.
        onClearPrompt={onClearPrompt} // Clear the authentication prompt when needed.
      />
    );
  }

  // If a user is logged in, display their profile information.
  return (
    // ScrollView allows the screen content to scroll if it exceeds the screen height.
    <ScrollView contentContainerStyle={s.pageContent}>

      {/* Display the heading section of the profile page. */}
      <View style={s.pageHeading}>

        {/* Small label above the main heading. */}
        <Text style={s.pageEyebrow}>YOUR BLUSHLY</Text>

        {/* Display the logged-in user's name dynamically. */}
        <Text style={s.pageTitle}>Hello, {user.name}.</Text>

        {/* Display the logged-in user's email dynamically. */}
        <Text style={s.pageSubtitle}>{user.email}</Text>
      </View>

      {/* Card containing the user's account information and logout button. */}
      <View style={s.accountCard}>

        {/* Display a profile icon inside a styled avatar container. */}
        <View style={s.accountAvatar}>
          <Ionicons
            name="person-outline"
            size={32}
            color={colors.ink}
          />
        </View>

        {/* Display a welcome message for the logged-in user. */}
        <Text style={s.accountTitle}>
          You’re part of the Blushly family.
        </Text>

        {/* Inform the user that account and shopping bag data are saved locally. */}
        <Text style={s.accountCopy}>
          Your bag and account are saved on this device.
        </Text>

        {/* Logout button. Pressing it calls the logout function. */}
        <AppButton
          title="Sign out"
          secondary
          onPress={logout}
          style={s.signOutButton}
        />
      </View>
    </ScrollView>
  );
}

// Create styles used by the ProfileScreen components.
const s = StyleSheet.create({

  // Overall screen content: horizontal spacing and bottom padding.
  pageContent: {
    paddingHorizontal: 20,
    paddingBottom: 32
  },

  // Adds space below the profile heading section.
  pageHeading: {
    marginBottom: 18
  },

  // Styles the small "YOUR BLUSHLY" label.
  pageEyebrow: {
    color: colors.pink,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: 10
  },

  // Styles the main heading containing the user's name.
  pageTitle: {
    color: colors.ink,
    fontFamily: fonts.heading,
    fontSize: 30,
    marginTop: 4
  },

  // Styles the user's email address.
  pageSubtitle: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    marginTop: 3
  },

  // Styles the white account card and centers its contents.
  accountCard: {
    alignItems: 'center',
    padding: 26,
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.pinkSoft
  },

  // Creates the rounded background behind the profile icon.
  accountAvatar: {
    width: 72,
    height: 72,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lavenderLight
  },

  // Styles the welcome message inside the account card.
  accountTitle: {
    color: colors.ink,
    fontFamily: fonts.headingMedium,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16
  },

  // Styles the text explaining local account and bag storage.
  accountCopy: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 5
  },

  // Adds spacing above the Sign out button and sets its minimum width.
  signOutButton: {
    marginTop: 20,
    minWidth: 130
  },
});