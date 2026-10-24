// Small reusable pieces used by many screens
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, ActivityIndicator, Animated, Easing, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, formatPrice } from '../data';
import { playButtonSound } from '../sound';

export function getCategory(product) {
  const productName = typeof product?.name === 'string' ? product.name.toLowerCase() : '';
  const category = typeof product?.category === 'string' ? product.category.toLowerCase() : '';
  if (/\b(backpack|bag|wallet|purse)\b/.test(productName)) return 'Accessories';
  if (['makeup', 'beauty', 'cosmetic'].some((term) => category.includes(term))) return 'Makeup';
  if (category.includes('clothing')) return 'Clothes';
  if (category.includes('jewel')) return 'Jewelry';
  if (category === 'electronics') return 'Electronics';
  return 'Accessories';
}

// ---------- Screen: background colour + keeps content away from the notch ----------
export function Screen({ children, bg = colors.bg, edges = ['top'] }) {
  return <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={edges}>{children}</SafeAreaView>;
}

// ---------- ScreenHeader: back button + title + cart button ----------
export function ScreenHeader({ title, subtitle, showCart = true }) {
  const navigation = useNavigation();

  const handleBackPress = async () => {
    try {
      const { playButtonSound } = await import('../sound');
      await playButtonSound();
    } catch (error) {
      // ignore
    }
    navigation.goBack();
  };

  const handleCartPress = async () => {
    try {
      const { playButtonSound } = await import('../sound');
      await playButtonSound();
    } catch (error) {
      // ignore
    }
    navigation.navigate('Tabs', { screen: 'Cart' });
  };

  return (
    <View style={s.headerRow}>
      <TouchableOpacity style={s.iconBtn} onPress={handleBackPress}>
        <Ionicons name="arrow-back" size={22} color={colors.ink} />
      </TouchableOpacity>
      <View style={{ flex: 1, marginHorizontal: 14 }}>
        <Text style={s.headerTitle}>{title}</Text>
        {subtitle ? <Text style={s.headerSub}>{subtitle}</Text> : null}
      </View>
      {showCart && (
        <TouchableOpacity
          style={[s.iconBtn, { backgroundColor: colors.pinkLight }]}
          onPress={handleCartPress}
        >
          <Ionicons name="cart-outline" size={22} color={colors.ink} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ---------- PrimaryButton: the big pink rounded button ----------
export function PrimaryButton({ title, onPress, icon, color = colors.pink, loading = false, style }) {
  const handlePress = async () => {
    try {
      const { playButtonSound } = await import('../sound');
      await playButtonSound();
    } catch (error) {
      // ignore audio errors
    }

    if (onPress) onPress();
  };

  return (
    <TouchableOpacity style={[s.button, { backgroundColor: color }, style]} onPress={handlePress} activeOpacity={0.8} disabled={loading}>
      {loading ? (
        <ActivityIndicator color={colors.ink} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={22} color={colors.ink} style={{ marginRight: 8 }} /> : null}
          <Text style={s.buttonText}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function AppButton({ title, onPress, secondary = false, icon, loading = false, style }) {
  return (
    <TouchableOpacity
      style={[s.appButton, secondary && s.secondaryButton, style]}
      activeOpacity={0.86}
      disabled={loading}
      onPress={() => {
        playButtonSound();
        onPress();
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.ink} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={secondary ? colors.ink : colors.white} /> : null}
          <Text style={[s.appButtonText, secondary && s.secondaryButtonText]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ---------- ProductVisual: real image (API) or icon on a coloured tile ----------
export function ProductVisual({ product, height = 126, radius = 18 }) {
  if (product.image) {
    return (
      <View style={[s.tile, { height, borderRadius: radius, backgroundColor: colors.white }]}>
        <Image source={{ uri: product.image }} style={{ width: '75%', height: '85%' }} resizeMode="contain" />
      </View>
    );
  }
  return (
    <View style={[s.tile, { height, borderRadius: radius, backgroundColor: product.color || colors.pinkLight }]}>
      <MaterialCommunityIcons name={product.icon || 'shopping'} size={Math.min(height * 0.55, 110)} color={colors.ink} />
    </View>
  );
}

// ---------- ProductCard: one product in the 2-column grid ----------
export function ProductCard({ product, onPress, onAdd }) {
  const handleCardPress = async () => {
    try {
      const { playButtonSound } = await import('../sound');
      await playButtonSound();
    } catch (error) {
      // ignore audio errors
    }
    if (onPress) onPress();
  };

  const handleAddPress = async (event) => {
    event.stopPropagation();
    try {
      const { playButtonSound } = await import('../sound');
      await playButtonSound();
    } catch (error) {
      // ignore audio errors
    }
    if (onAdd) onAdd(product);
  };

  return (
    <TouchableOpacity style={s.card} onPress={handleCardPress} activeOpacity={0.85}>
      <View>
        <ProductVisual product={product} />
        {product.discountPercent ? (
          <View style={s.saleBadge}>
            <Text style={s.saleBadgeText}>{product.discountPercent}% OFF</Text>
          </View>
        ) : null}
      </View>
      <Text style={s.cardName} numberOfLines={2}>{product.name}</Text>
      <View style={s.cardBottom}>
        <View style={s.priceStack}>
          {product.originalPrice ? <Text style={s.originalPrice}>{formatPrice(product.originalPrice)}</Text> : null}
          <Text style={[s.cardPrice, product.discountPercent && s.salePrice]}>{formatPrice(product.price)}</Text>
        </View>
        <TouchableOpacity style={s.plus} onPress={handleAddPress} activeOpacity={0.8}>
          <Ionicons name="add" size={20} color={colors.ink} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export function MovingBanner({ text }) {
  const [contentWidth, setContentWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!contentWidth) return undefined;
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: -contentWidth,
        duration: contentWidth * 24,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [contentWidth, translateX]);

  return (
    <View style={s.banner}>
      <Animated.View style={[s.bannerTrack, { transform: [{ translateX }] }]}>
        {[0, 1].map((copy) => (
          <Text
            key={copy}
            style={s.bannerText}
            onLayout={copy === 0 ? (event) => setContentWidth(event.nativeEvent.layout.width) : undefined}
          >
            {text}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  iconBtn: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.heading, fontSize: 26, color: colors.ink },
  headerSub: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  button: { height: 58, borderRadius: 22, borderWidth: 3, borderColor: colors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: fonts.headingMedium, fontSize: 19, color: colors.ink },
  appButton: { minHeight: 52, borderRadius: 17, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 19 },
  secondaryButton: { backgroundColor: colors.pinkSoft },
  appButtonText: { color: colors.white, fontFamily: fonts.headingMedium, fontSize: 16 },
  secondaryButtonText: { color: colors.ink },
  tile: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  card: { flex: 1, margin: 6, backgroundColor: colors.white, borderRadius: 24, padding: 10, borderWidth: 1, borderColor: colors.pinkSoft, shadowColor: colors.ink, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  cardName: { fontFamily: fonts.headingMedium, fontSize: 15, color: colors.ink, marginTop: 10, minHeight: 40, paddingHorizontal: 2 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2, paddingTop: 4 },
  priceStack: { flex: 1 },
  cardPrice: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  originalPrice: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, textDecorationLine: 'line-through' },
  salePrice: { color: '#C44C6A' },
  saleBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: colors.pink, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  saleBadgeText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.ink },
  plus: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.pinkLight, alignItems: 'center', justifyContent: 'center' },
  banner: { height: 44, borderRadius: 16, backgroundColor: colors.ink, overflow: 'hidden', justifyContent: 'center' },
  bannerTrack: { flexDirection: 'row', alignItems: 'center' },
  bannerText: { fontFamily: fonts.headingMedium, fontSize: 15, color: colors.butter, paddingHorizontal: 20 },
});