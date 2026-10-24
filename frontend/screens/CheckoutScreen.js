import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, formatPrice, calculateTotals } from '../data';
import { useAuth, useCart } from '../store';
import { AppButton } from '../components/components';
import { playButtonSound } from '../sound';

export default function CheckoutScreen({ onBack, onOrderPlaced }) {
  const { user, saveDeliveryAddress } = useAuth();
  const { subtotal, itemCount } = useCart();
  const totals = calculateTotals(subtotal);
  const [name, setName] = useState(user?.name || '');
  const [street, setStreet] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const submitAddress = async () => {
    setError('');
    if (!name.trim() || !street.trim() || !city.trim() || !region.trim() || !postalCode.trim()) {
      setError('Please complete your name and delivery address to continue.');
      return;
    }
    if (postalCode.trim().length < 3) {
      setError('Please enter a valid postal or ZIP code.');
      return;
    }

    const address = {
      name: name.trim(),
      street: street.trim(),
      apartment: apartment.trim(),
      city: city.trim(),
      region: region.trim(),
      postalCode: postalCode.trim(),
    };
    setBusy(true);
    try {
      await saveDeliveryAddress(address);
      await onOrderPlaced(address);
    } catch (submitError) {
      console.error('Could not save the delivery address:', submitError);
      setError(submitError.message || 'We could not save your delivery address. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const input = (value, onChangeText, placeholder, accessibilityLabel, autoCapitalize = 'words', half = false) => (
    <TextInput
      style={[s.authInput, half && s.addressHalfInput]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      autoCapitalize={autoCapitalize}
      accessibilityLabel={accessibilityLabel}
    />
  );

  return (
    <ScrollView contentContainerStyle={s.pageContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={s.checkoutTopline}>
        <TouchableOpacity style={s.backButton} onPress={() => { playButtonSound(); onBack(); }} accessibilityLabel="Back to bag">
          <Ionicons name="arrow-back" size={21} color={colors.ink} />
        </TouchableOpacity>
        <Text style={s.detailBrand}>BLUSHLY / SECURE CHECKOUT</Text>
        <View style={s.backButton}><Ionicons name="lock-closed-outline" size={17} color={colors.ink} /></View>
      </View>
      <View style={s.pageHeading}>
        <Text style={s.pageEyebrow}>ALMOST YOURS</Text>
        <Text style={s.pageTitle}>Where to send it?</Text>
        <Text style={s.pageSubtitle}>Add your delivery address to finish your order.</Text>
      </View>
      <View style={s.addressCard}>
        <View style={s.addressSectionHeading}>
          <View style={s.addressIcon}><Ionicons name="location-outline" size={20} color={colors.ink} /></View>
          <View>
            <Text style={s.addressTitle}>Delivery address</Text>
            <Text style={s.addressSubtitle}>A safe landing for your lovely finds</Text>
          </View>
        </View>
        {input(name, setName, 'Full name', 'Full name for delivery')}
        {input(street, setStreet, 'Street address', 'Street address')}
        {input(apartment, setApartment, 'Apartment, suite, etc. (optional)', 'Apartment or suite, optional')}
        <View style={s.addressRow}>
          {input(city, setCity, 'City', 'City', 'words', true)}
          {input(region, setRegion, 'State / region', 'State or region', 'words', true)}
        </View>
        {input(postalCode, setPostalCode, 'Postal or ZIP code', 'Postal or ZIP code', 'characters')}
        {error ? <Text style={s.authError}>{error}</Text> : null}
      </View>
      <View style={s.checkoutTotalCard}>
        <View style={s.summaryRow}><Text style={s.summaryLabel}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</Text><Text style={s.summaryValue}>{formatPrice(subtotal)}</Text></View>
        {totals.discount > 0 ? <View style={s.summaryRow}><Text style={s.summaryLabel}>20% order offer</Text><Text style={s.discountValue}>−{formatPrice(totals.discount)}</Text></View> : null}
        <View style={[s.summaryRow, s.summaryTotal]}><Text style={s.summaryTotalLabel}>Total</Text><Text style={s.summaryTotalValue}>{formatPrice(totals.finalAmount)}</Text></View>
      </View>
      <AppButton title="Place my order" icon="checkmark-circle-outline" onPress={submitAddress} loading={busy} style={s.checkoutButton} />
      <Text style={s.secureNote}>Your address is used only to prepare this delivery.</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pageContent: { paddingHorizontal: 20, paddingBottom: 32 },
  checkoutTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 9 },
  backButton: { width: 43, height: 43, borderRadius: 15, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.pinkSoft },
  detailBrand: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1.4 },
  pageHeading: { marginTop: 17, marginBottom: 18 },
  pageEyebrow: { color: colors.pink, fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.5 },
  pageTitle: { color: colors.ink, fontFamily: fonts.heading, fontSize: 30, marginTop: 4 },
  pageSubtitle: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, marginTop: 3 },
  addressCard: { backgroundColor: colors.white, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: colors.pinkSoft },
  addressSectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 5 },
  addressIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.pinkSoft, alignItems: 'center', justifyContent: 'center' },
  addressTitle: { color: colors.ink, fontFamily: fonts.headingMedium, fontSize: 16 },
  addressSubtitle: { color: colors.muted, fontFamily: fonts.body, fontSize: 11, marginTop: 1 },
  authInput: { minHeight: 49, borderWidth: 1, borderColor: colors.pinkLight, backgroundColor: colors.bg, borderRadius: 13, paddingHorizontal: 13, marginTop: 11, color: colors.ink, fontFamily: fonts.body, fontSize: 13 },
  addressRow: { flexDirection: 'row', gap: 9 },
  addressHalfInput: { flex: 1, minWidth: 0 },
  authError: { color: '#B83A58', fontFamily: fonts.body, fontSize: 12, marginTop: 10 },
  checkoutTotalCard: { backgroundColor: colors.white, borderRadius: 20, padding: 17, marginTop: 14, borderWidth: 1, borderColor: colors.pinkSoft },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  summaryLabel: { color: colors.muted, fontFamily: fonts.body, fontSize: 14 },
  summaryValue: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 14 },
  discountValue: { color: '#4F9872', fontFamily: fonts.bodyBold, fontSize: 14 },
  summaryTotal: { borderTopWidth: 1, borderTopColor: colors.pinkSoft, marginTop: 5, paddingTop: 13 },
  summaryTotalLabel: { color: colors.ink, fontFamily: fonts.headingMedium, fontSize: 17 },
  summaryTotalValue: { color: colors.ink, fontFamily: fonts.heading, fontSize: 19 },
  checkoutButton: { marginTop: 15 },
  secureNote: { color: colors.muted, fontFamily: fonts.body, fontSize: 11, textAlign: 'center', marginTop: 10 },
});
