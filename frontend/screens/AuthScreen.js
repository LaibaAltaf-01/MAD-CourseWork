import React, { useState } from 'react';
import {
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../data';
import { useAuth } from '../store';
import { AppButton } from '../components/components';
import { playButtonSound } from '../sound';

export default function AuthScreen({ checkoutPending, prompt, onAuthenticated, onClearPrompt }) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [street, setStreet] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isSignup = mode === 'signup';

  const submit = async () => {
    setError('');
    if (isSignup && !name.trim()) return setError('Please enter your name.');
    if (!email.includes('@')) return setError('Please enter a valid email address.');
    if (password.length < 6) return setError('Your password must be at least 6 characters.');
    if (isSignup && (!street.trim() || !city.trim() || !region.trim() || !postalCode.trim())) {
      return setError('Please complete your delivery address, city, region, and postal code.');
    }
    if (isSignup && postalCode.trim().length < 3) return setError('Please enter a valid postal or ZIP code.');

    const deliveryAddress = {
      name: name.trim(),
      street: street.trim(),
      apartment: apartment.trim(),
      city: city.trim(),
      region: region.trim(),
      postalCode: postalCode.trim(),
    };

    setBusy(true);
    try {
      if (isSignup) await signup(name.trim(), email.trim(), password, deliveryAddress);
      else await login(email.trim(), password);
      setPassword('');
      onAuthenticated();
    } catch (submitError) {
      setError(submitError.message || 'We could not sign you in. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const changeMode = (nextMode) => {
    playButtonSound();
    setMode(nextMode);
    setError('');
    onClearPrompt();
  };

  return (
    <ScrollView contentContainerStyle={s.pageContent} keyboardShouldPersistTaps="handled">
      <View style={s.pageHeading}>
        <Text style={s.pageEyebrow}>YOUR BLUSHLY</Text>
        <Text style={s.pageTitle}>A little more you.</Text>
        <Text style={s.pageSubtitle}>
          {checkoutPending
            ? (isSignup
              ? 'Create your account and add a delivery address to finish checkout.'
              : 'Sign in to complete checkout. Your bag will be waiting right here.')
            : 'Sign in to make your finds feel like home.'}
        </Text>
      </View>
      {checkoutPending ? (
        <View style={s.checkoutLoginNotice}>
          <Ionicons name="bag-check-outline" size={20} color={colors.ink} />
          <Text style={s.checkoutLoginText}>Your items are saved. Sign in or create an account to place your order.</Text>
        </View>
      ) : null}
      {prompt ? <Text style={s.prompt}>{prompt}</Text> : null}
      <View style={s.authCard}>
        <View style={s.authToggle}>
          {['login', 'signup'].map((item) => (
            <TouchableOpacity
              key={item}
              style={[s.authToggleButton, mode === item && s.authToggleActive]}
              onPress={() => changeMode(item)}
            >
              <Text style={[s.authToggleText, mode === item && s.authToggleTextActive]}>
                {item === 'login' ? 'Sign in' : 'Create account'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {isSignup ? (
          <TextInput
            style={s.authInput}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
            accessibilityLabel="Your name"
          />
        ) : null}
        <TextInput
          style={s.authInput}
          value={email}
          onChangeText={setEmail}
          placeholder="Email address"
          placeholderTextColor={colors.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel="Email address"
        />
        <TextInput
          style={s.authInput}
          value={password}
          onChangeText={setPassword}
          placeholder="Password (at least 6 characters)"
          placeholderTextColor={colors.muted}
          secureTextEntry
          accessibilityLabel="Password"
        />
        {isSignup ? (
          <View style={s.signupAddressSection}>
            <View style={s.addressSectionHeading}>
              <View style={s.addressIcon}><Ionicons name="location-outline" size={20} color={colors.ink} /></View>
              <View>
                <Text style={s.addressTitle}>Your delivery address</Text>
                <Text style={s.addressSubtitle}>We’ll save it for future orders</Text>
              </View>
            </View>
            <TextInput style={s.authInput} value={street} onChangeText={setStreet} placeholder="Street address" placeholderTextColor={colors.muted} autoCapitalize="words" accessibilityLabel="Street address" />
            <TextInput style={s.authInput} value={apartment} onChangeText={setApartment} placeholder="Apartment, suite, etc. (optional)" placeholderTextColor={colors.muted} autoCapitalize="words" accessibilityLabel="Apartment or suite, optional" />
            <View style={s.addressRow}>
              <TextInput style={[s.authInput, s.addressHalfInput]} value={city} onChangeText={setCity} placeholder="City" placeholderTextColor={colors.muted} autoCapitalize="words" accessibilityLabel="City" />
              <TextInput style={[s.authInput, s.addressHalfInput]} value={region} onChangeText={setRegion} placeholder="State / region" placeholderTextColor={colors.muted} autoCapitalize="words" accessibilityLabel="State or region" />
            </View>
            <TextInput style={s.authInput} value={postalCode} onChangeText={setPostalCode} placeholder="Postal or ZIP code" placeholderTextColor={colors.muted} autoCapitalize="characters" accessibilityLabel="Postal or ZIP code" />
          </View>
        ) : null}
        {error ? <Text style={s.authError}>{error}</Text> : null}
        <AppButton title={isSignup ? 'Create my account' : 'Sign in'} onPress={submit} loading={busy} style={s.authSubmit} />
        <Text style={s.authNote}>
          {isSignup ? 'Your account and delivery details are saved on this device.' : 'A simple local account for your Blushly experience.'}
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pageContent: { paddingHorizontal: 20, paddingBottom: 32 },
  pageHeading: { marginBottom: 18 },
  pageEyebrow: { color: colors.pink, fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.5, marginTop: 10 },
  pageTitle: { color: colors.ink, fontFamily: fonts.heading, fontSize: 30, marginTop: 4 },
  pageSubtitle: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, marginTop: 3 },
  checkoutLoginNotice: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.mintLight, borderRadius: 15, padding: 13, marginBottom: 14 },
  checkoutLoginText: { flex: 1, color: colors.ink, fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
  prompt: { color: '#B83A58', fontFamily: fonts.body, fontSize: 12, marginBottom: 12 },
  authCard: { backgroundColor: colors.white, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: colors.pinkSoft },
  authToggle: { flexDirection: 'row', backgroundColor: colors.pinkSoft, borderRadius: 14, padding: 4, marginBottom: 8 },
  authToggleButton: { flex: 1, minHeight: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  authToggleActive: { backgroundColor: colors.white },
  authToggleText: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 12 },
  authToggleTextActive: { color: colors.ink },
  authInput: { minHeight: 49, borderWidth: 1, borderColor: colors.pinkLight, backgroundColor: colors.bg, borderRadius: 13, paddingHorizontal: 13, marginTop: 11, color: colors.ink, fontFamily: fonts.body, fontSize: 13 },
  signupAddressSection: { marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.pinkSoft },
  addressSectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 5 },
  addressIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.pinkSoft, alignItems: 'center', justifyContent: 'center' },
  addressTitle: { color: colors.ink, fontFamily: fonts.headingMedium, fontSize: 16 },
  addressSubtitle: { color: colors.muted, fontFamily: fonts.body, fontSize: 11, marginTop: 1 },
  addressRow: { flexDirection: 'row', gap: 9 },
  addressHalfInput: { flex: 1, minWidth: 0 },
  authError: { color: '#B83A58', fontFamily: fonts.body, fontSize: 12, marginTop: 10 },
  authSubmit: { marginTop: 15 },
  authNote: { color: colors.muted, fontFamily: fonts.body, fontSize: 11, textAlign: 'center', marginTop: 12 },
});
