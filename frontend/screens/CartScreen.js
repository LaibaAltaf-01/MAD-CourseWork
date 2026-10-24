import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, formatPrice, calculateTotals, DISCOUNT_MIN } from '../data';
import { useCart } from '../store';
import { AppButton, getCategory } from '../components/components';
import { playButtonSound } from '../sound';

export default function CartScreen({ notice, onShop, onCheckout }) {
  const { items, increase, decrease, removeItem, subtotal, itemCount } = useCart();            
  const totals = calculateTotals(subtotal);
  const discountProgress = totals.discount > 0 ? 1 : Math.min(subtotal / (DISCOUNT_MIN + 1), 0.99);
 
  return (
    <ScrollView contentContainerStyle={s.pageContent} showsVerticalScrollIndicator={false}>
      <View style={s.pageHeading}>
        <Text style={s.pageEyebrow}>YOUR LITTLE TREASURES</Text>
        <Text style={s.pageTitle}>Your bag.</Text>
        <Text style={s.pageSubtitle}>{itemCount} lovely {itemCount === 1 ? 'find' : 'finds'} so far</Text>
      </View>
      {notice ? (
        <View style={s.cartNotice}>
          <Ionicons name="checkmark-circle" size={19} color="#4F9872" />
          <Text style={s.cartNoticeText}>{notice}</Text>
        </View>
      ) : null}

      {items.length ? (
        <>
          <View style={[s.offerCard, totals.discount > 0 && s.offerCardUnlocked]}>
            <View style={s.offerTitleRow}>
              <View style={s.offerIcon}>
                <Ionicons name={totals.discount > 0 ? 'checkmark' : 'gift-outline'} size={17} color={colors.ink} />
              </View>
              <View style={s.offerCopy}>
                <Text style={s.offerTitle}>{totals.discount > 0 ? 'Your 20% treat is unlocked!' : 'A little treat is within reach'}</Text>
                <Text style={s.offerSubtitle}>
                  {totals.discount > 0
                    ? `You’re saving ${formatPrice(totals.discount)} on this order.`
                    : `Add ${formatPrice(Math.max(DISCOUNT_MIN + 1 - subtotal, 0))} more for 20% off your order.`}
                </Text>
              </View>
            </View>
            <View style={s.offerProgressTrack} accessibilityRole="progressbar" accessibilityLabel={`${Math.round(discountProgress * 100)} percent toward your 20 percent order discount`}>
              <View style={[s.offerProgressFill, { width: `${discountProgress * 100}%` }]} />
            </View>
            <Text style={s.offerProgressCaption}>
              {totals.discount > 0 ? '20% OFF APPLIED' : `${Math.round(discountProgress * 100)}% TO YOUR 20% OFFER`}
            </Text>
          </View>
          {items.map((item) => (
            <View key={item.id} style={s.cartItem}>
              <View style={s.cartThumb}>
                {item.image
                  ? <Image source={typeof item.image === 'string' ? { uri: item.image } : item.image} style={s.cartImage} resizeMode="contain" />
                  : <MaterialCommunityIcons name={item.icon || 'shopping-outline'} size={36} color={colors.ink} />}
              </View>
              <View style={s.cartItemInfo}>
                <Text style={s.productCategory}>{getCategory(item).toUpperCase()}</Text>
                <Text style={s.cartItemName} numberOfLines={2}>{item.name}</Text>
                <Text style={s.productPrice}>{formatPrice(item.price)}</Text>
                <View style={s.quantityControl}>
                  <TouchableOpacity onPress={() => { playButtonSound(); decrease(item.id); }} style={s.quantityButton}>
                    <Ionicons name="remove" size={16} color={colors.ink} />
                  </TouchableOpacity>
                  <Text style={s.quantityText}>{item.qty}</Text>
                  <TouchableOpacity onPress={() => { playButtonSound(); increase(item.id); }} style={s.quantityButton}>
                    <Ionicons name="add" size={16} color={colors.ink} />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity onPress={() => { playButtonSound(); removeItem(item.id); }} style={s.removeButton} accessibilityLabel={`Remove ${item.name}`}>
                <Ionicons name="trash-outline" size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>
          ))}
          <View style={s.orderSummary}>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Subtotal</Text><Text style={s.summaryValue}>{formatPrice(subtotal)}</Text></View>
            {totals.discount > 0 ? <View style={s.summaryRow}><Text style={s.summaryLabel}>20% order offer</Text><Text style={s.discountValue}>−{formatPrice(totals.discount)}</Text></View> : null}
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Delivery</Text><Text style={s.freeDelivery}>On us ♡</Text></View>
            <View style={[s.summaryRow, s.summaryTotal]}><Text style={s.summaryTotalLabel}>Total</Text><Text style={s.summaryTotalValue}>{formatPrice(totals.finalAmount)}</Text></View>
          </View>
          <AppButton title="Continue to checkout" icon="arrow-forward" onPress={onCheckout} style={s.checkoutButton} />
          <Text style={s.secureNote}>A happy checkout, every time.</Text>
        </>
      ) : (
        <View style={s.emptyBag}>
          <View style={s.emptyBagIcon}><Ionicons name="bag-handle-outline" size={35} color={colors.pink} /></View>
          <Text style={s.emptyBagTitle}>Your bag is waiting.</Text>
          <Text style={s.emptyBagCopy}>When something catches your eye, it’ll be right here.</Text>
          <AppButton title="Find your lovely" onPress={onShop} style={s.emptyBagButton} />
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pageContent: { paddingHorizontal: 20, paddingBottom: 32 },
  pageHeading: { marginBottom: 18 },
  pageEyebrow: { color: colors.pink, fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.5, marginTop: 10 },
  pageTitle: { color: colors.ink, fontFamily: fonts.heading, fontSize: 30, marginTop: 4 },
  pageSubtitle: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, marginTop: 3 },
  cartNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.mintLight, padding: 12, borderRadius: 13, marginBottom: 14 },
  cartNoticeText: { color: colors.ink, fontFamily: fonts.body, fontSize: 12, flex: 1 },
  offerCard: { backgroundColor: colors.butter, borderRadius: 19, padding: 15, marginBottom: 13, borderWidth: 1, borderColor: '#F2D97F' },
  offerCardUnlocked: { backgroundColor: colors.mintLight, borderColor: colors.mint },
  offerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  offerIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.68)', alignItems: 'center', justifyContent: 'center' },
  offerCopy: { flex: 1 },
  offerTitle: { color: colors.ink, fontFamily: fonts.headingMedium, fontSize: 15 },
  offerSubtitle: { color: colors.muted, fontFamily: fonts.body, fontSize: 11, marginTop: 2 },
  offerProgressTrack: { height: 7, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.72)', overflow: 'hidden', marginTop: 13 },
  offerProgressFill: { height: '100%', borderRadius: 5, backgroundColor: colors.pink },
  offerProgressCaption: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1, marginTop: 7, textAlign: 'right' },
  cartItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 20, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.pinkSoft },
  cartThumb: { width: 82, height: 90, backgroundColor: '#FFF9FB', borderRadius: 15, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  cartImage: { width: '85%', height: '85%' },
  cartItemInfo: { flex: 1, paddingHorizontal: 12 },
  productCategory: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1 },
  cartItemName: { color: colors.ink, fontFamily: fonts.headingMedium, fontSize: 14, lineHeight: 18, marginTop: 3 },
  productPrice: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 13, marginTop: 3 },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 9 },
  quantityButton: { width: 27, height: 27, borderRadius: 9, backgroundColor: colors.pinkSoft, alignItems: 'center', justifyContent: 'center' },
  quantityText: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 13 },
  removeButton: { alignSelf: 'flex-start', padding: 7 },
  orderSummary: { backgroundColor: colors.white, borderRadius: 20, padding: 17, marginTop: 8, borderWidth: 1, borderColor: colors.pinkSoft },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  summaryLabel: { color: colors.muted, fontFamily: fonts.body, fontSize: 14 },
  summaryValue: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 14 },
  discountValue: { color: '#4F9872', fontFamily: fonts.bodyBold, fontSize: 14 },
  freeDelivery: { color: '#578C72', fontFamily: fonts.bodyBold, fontSize: 13 },
  summaryTotal: { borderTopWidth: 1, borderTopColor: colors.pinkSoft, marginTop: 5, paddingTop: 13 },
  summaryTotalLabel: { color: colors.ink, fontFamily: fonts.headingMedium, fontSize: 17 },
  summaryTotalValue: { color: colors.ink, fontFamily: fonts.heading, fontSize: 19 },
  checkoutButton: { marginTop: 15 },
  secureNote: { color: colors.muted, fontFamily: fonts.body, fontSize: 11, textAlign: 'center', marginTop: 10 },
  emptyBag: { alignItems: 'center', paddingHorizontal: 28, paddingVertical: 50, backgroundColor: colors.white, borderRadius: 24, borderWidth: 1, borderColor: colors.pinkSoft, marginTop: 8 },
  emptyBagIcon: { width: 76, height: 76, borderRadius: 26, backgroundColor: colors.pinkSoft, alignItems: 'center', justifyContent: 'center' },
  emptyBagTitle: { color: colors.ink, fontFamily: fonts.heading, fontSize: 23, marginTop: 17 },
  emptyBagCopy: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 5 },
  emptyBagButton: { marginTop: 20 },
});
