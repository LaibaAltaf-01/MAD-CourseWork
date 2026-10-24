// Splash, Home, Category, ProductList, ProductDetails
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, Animated, Alert, StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, ScreenHeader, PrimaryButton, ProductVisual, ProductCard, MovingBanner } from '../components/components';
import {
  colors, fonts, formatPrice, BANNER_TEXT, ACCESSORY_GROUPS, CLOTHES_GROUPS, JEWELRY_GROUPS, ELECTRONICS_GROUPS, fetchStoreProducts,
} from '../data';
import { useAuth, useCart } from '../store';

// =================== 1. SPLASH ===================
export function SplashScreen({ navigation }) {
  const scale = useRef(new Animated.Value(0.5)).current; // logo "pops" in

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    // After 2.5 seconds go to Home (replace = splash is removed from history)
    const timer = setTimeout(() => navigation.replace('Tabs'), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Screen bg={colors.pinkLight} edges={['top', 'bottom']}>
      <View style={[s.circle, { width: 300, height: 300, top: -110, right: -120, backgroundColor: colors.lavenderLight }]} />
      <View style={[s.circle, { width: 220, height: 220, bottom: -70, left: -90, backgroundColor: colors.mintLight }]} />
      <View style={[s.circle, { width: 90, height: 90, top: 150, left: 28, backgroundColor: colors.butter }]} />

      <View style={s.splashCenter}>
        <Animated.View style={[s.logo, { transform: [{ scale }] }]}>
          <Ionicons name="bag-handle" size={72} color={colors.ink} />
        </Animated.View>
        <Text style={s.appName}>Blushly</Text>
        <Text style={s.tagline}>Cute finds for him & her</Text>
        <View style={s.offer}><Text style={s.offerText}>20% OFF — Limited Stock!</Text></View>
      </View>
    </Screen>
  );
}

// =================== 2. HOME ===================
export function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleCategoryPress = async (title, groups) => {
    const apiCategory = {
      Clothes: (product) => product.category.includes('clothing'),
      Electronics: (product) => product.category === 'electronics',
      Jewelry: (product) => product.category.includes('jewel'),
    }[title];

    if (apiCategory) {
      try {
        const collection = products.length ? products : await fetchStoreProducts();
        setProducts(collection);
        navigation.navigate('ProductList', {
          title,
          subtitle: 'Explore the collection',
          products: collection.filter(apiCategory),
        });
      } catch (loadError) {
        console.error(`Could not load ${title.toLowerCase()} products:`, loadError);
        Alert.alert('Collection unavailable', 'Please check your connection and try again.');
      }
      return;
    }

    try {
      const { playButtonSound } = await import('../sound');
      await playButtonSound();
    } catch (error) {
      console.error('Could not play category sound:', error);
    }
    navigation.navigate('Category', { title, groups });
  };

  const categories = [
    { title: 'Accessories', subtitle: 'Watches, wallets, jewellery', icon: 'watch', bg: colors.pinkLight,
      onPress: () => handleCategoryPress('Accessories', ACCESSORY_GROUPS) },
    { title: 'Clothes', subtitle: 'Stitched & unstitched', icon: 'tshirt-crew', bg: colors.lavenderLight,
      onPress: () => handleCategoryPress('Clothes', CLOTHES_GROUPS) },
    { title: 'Jewelry', subtitle: 'Necklaces, rings & sparkle', icon: 'diamond-stone', bg: colors.butter,
      onPress: () => handleCategoryPress('Jewelry', JEWELRY_GROUPS) },
    { title: 'Electronics', subtitle: 'Audio, gadgets & tech', icon: 'laptop', bg: colors.skyLight,
      onPress: () => handleCategoryPress('Electronics', ELECTRONICS_GROUPS) },
  ];

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      setProducts(await fetchStoreProducts());
    } catch (loadError) {
      console.error('Could not load products:', loadError);
      setError('We could not load the collection. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const visibleProducts = products.filter((product) => {
    const query = search.trim().toLowerCase();
    return !query || `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(query);
  });

  const handleQuickAdd = (product) => {
    if (!user) {
      navigation.navigate('Auth', { pendingProduct: product });
      return;
    }
    addToCart(product);
  };

  return (
    <Screen>
      <FlatList
        key="product-grid"
        data={visibleProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={s.homeList}
        columnWrapperStyle={s.productRow}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={s.homeHeader}>
            <Text style={s.hello}>Hello, {user ? user.name : 'cutie'}</Text>
            <Text style={s.homeTitle}>What are we shopping today?</Text>
            <View style={s.search}>
              <Ionicons name="search" size={19} color={colors.muted} />
              <TextInput
                style={s.searchInput}
                placeholder="Search watches, clothes, electronics…"
                placeholderTextColor={colors.muted}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Clear search">
                  <Ionicons name="close-circle" size={19} color={colors.muted} />
                </TouchableOpacity>
              ) : null}
            </View>
            <Text style={s.sectionTitle}>Shop by category</Text>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.title}
                style={[s.catCard, { backgroundColor: category.bg }]}
                onPress={category.onPress}
                activeOpacity={0.85}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.catTitle}>{category.title}</Text>
                  <Text style={s.catSub}>{category.subtitle}</Text>
                  <View style={s.exploreChip}><Text style={s.exploreText}>Explore</Text></View>
                </View>
                <MaterialCommunityIcons name={category.icon} size={64} color={colors.ink} />
              </TouchableOpacity>
            ))}
            <View style={s.quickActions}>
              <TouchableOpacity
                style={[s.quickBtn, { backgroundColor: colors.skyLight }]}
                onPress={() => handleCategoryPress('For Him', ACCESSORY_GROUPS.filter((group) => group.id === 'male'))}
              >
                <Ionicons name="male" size={20} color={colors.ink} />
                <Text style={s.quickText}>For Him</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.quickBtn, { backgroundColor: colors.pinkLight }]}
                onPress={() => handleCategoryPress('For Her', ACCESSORY_GROUPS.filter((group) => group.id === 'female'))}
              >
                <Ionicons name="female" size={20} color={colors.ink} />
                <Text style={s.quickText}>For Her</Text>
              </TouchableOpacity>
            </View>
            <View style={s.promoBarWrap}>
              <MovingBanner text={BANNER_TEXT} />
            </View>
            <View style={s.collectionHeading}>
              <View>
                <Text style={s.collectionTitle}>Fresh from the shop</Text>
                <Text style={s.collectionSubtitle}>A little something for your day</Text>
              </View>
              {!loading && !error ? <Text style={s.productCount}>{visibleProducts.length} ITEMS</Text> : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={s.center}>
              <ActivityIndicator size="large" color={colors.pink} />
              <Text style={s.emptyMessage}>Loading the collection…</Text>
            </View>
          ) : error ? (
            <View style={s.center}>
              <Text style={s.errorText}>{error}</Text>
              <TouchableOpacity style={s.retry} onPress={loadProducts}>
                <Text style={s.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.center}>
              <Text style={s.emptyMessage}>No products match “{search}”.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate('ProductDetails', { product: item })}
            onAdd={handleQuickAdd}
          />
        )}
      />
    </Screen>
  );
}

// =================== 3. CATEGORY (Accessories + Clothes, Male/Female boxes) ===================
// Data arrives through navigation params: navigation.navigate('Category', { title, groups })
export function CategoryScreen({ navigation, route }) {
  const { title, groups } = route.params;

  return (
    <Screen>
      <ScreenHeader title={title} subtitle="Pick who you're shopping for" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 10 }} showsVerticalScrollIndicator={false}>
        {groups.map((group) => (
          <View key={group.id} style={[s.panel, { backgroundColor: group.bg }]}>
            {/* Chip: For Him / For Her / Male / Female */}
            <View style={[s.chip, { backgroundColor: group.accent }]}>
              <Ionicons name={group.genderIcon} size={18} color={colors.ink} />
              <Text style={s.chipText}>{group.label}</Text>
            </View>

            {/* Subcategory tiles */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              {group.categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={s.tileBox}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('ProductList', { title: cat.title, subtitle: group.label, products: cat.products })}
                >
                  <MaterialCommunityIcons name={cat.icon} size={64} color={colors.ink} />
                  <Text style={s.tileText}>{cat.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

// =================== 4. PRODUCT LIST (one subcategory) ===================
export function ProductListScreen({ navigation, route }) {
  const { title, subtitle, products } = route.params;

  return (
    <Screen>
      <ScreenHeader title={title} subtitle={subtitle} />
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 13 }}
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={() => navigation.navigate('ProductDetails', { product: item })} />
        )}
      />
    </Screen>
  );
}

// =================== 5. PRODUCT DETAILS + ADD TO CART ===================
// LOGIN CHECK: not logged in -> opens Auth first, then the product is added after login.
export function ProductDetailsScreen({ navigation, route }) {
  const { product } = route.params;
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 1800);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleAddToCart = () => {
    if (!user) {
      navigation.navigate('Auth', { pendingProduct: product });
      return;
    }

    addToCart(product);
    setToast(`${product.name} added to cart`);
    Alert.alert('Added to cart', `${product.name} is now in your cart.`, [
      { text: 'Keep shopping' },
      { text: 'View cart', onPress: () => navigation.navigate('Tabs', { screen: 'Cart' }) },
    ]);
  };

  return (
    <Screen>
      <ScreenHeader title="Details" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 10 }} showsVerticalScrollIndicator={false}>
        <ProductVisual product={product} height={300} radius={36} />
        <Text style={s.detailName}>{product.name}</Text>
        <View style={s.priceLine}>
          <View style={s.priceBadge}><Text style={s.priceText}>{formatPrice(product.price)}</Text></View>
          {product.originalPrice ? (
            <>
              <Text style={s.detailOriginalPrice}>{formatPrice(product.originalPrice)}</Text>
              <View style={s.detailSaleBadge}><Text style={s.detailSaleText}>{product.discountPercent}% OFF</Text></View>
            </>
          ) : null}
        </View>
        <Text style={s.detailLabel}>Description</Text>
        <Text style={s.detailDesc}>{product.description}</Text>
        <View style={s.offerBox}>
          <Text style={s.offerBoxText}>
            {product.discountPercent
              ? `You save ${formatPrice(product.originalPrice - product.price)} on this clothing offer.`
              : '20% off orders above Rs. 1,200.'}
          </Text>
        </View>
      </ScrollView>

      <View style={{ padding: 20, paddingBottom: 28 }}>
        <PrimaryButton title="Add to Cart" icon="cart-outline" onPress={handleAddToCart} />
        {!user && <Text style={s.hint}>Not logged in? You'll sign in first, then it's added.</Text>}
      </View>

      {toast ? (
        <View style={s.toastWrap} pointerEvents="none">
          <View style={s.toastBox}>
            <Ionicons name="checkmark-circle" size={18} color={colors.white} />
            <Text style={s.toastText}>{toast}</Text>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  // splash
  circle: { position: 'absolute', borderRadius: 999 },
  splashCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logo: { width: 148, height: 148, borderRadius: 44, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 10, borderBottomColor: colors.pink },
  appName: { fontFamily: fonts.heading, fontSize: 58, color: colors.ink, marginTop: 24 },
  tagline: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.muted },
  offer: { marginTop: 26, backgroundColor: colors.butter, borderWidth: 3, borderColor: colors.ink, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 22, transform: [{ rotate: '-2deg' }] },
  offerText: { fontFamily: fonts.headingMedium, fontSize: 20, color: colors.ink },
  // home
  homeList: { paddingHorizontal: 14, paddingBottom: 28 },
  productRow: { justifyContent: 'space-between' },
  homeHeader: { paddingHorizontal: 6, paddingTop: 18, paddingBottom: 4 },
  hello: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  homeTitle: { fontFamily: fonts.heading, fontSize: 28, color: colors.ink, lineHeight: 34, marginTop: 2 },
  search: { flexDirection: 'row', alignItems: 'center', marginTop: 16, height: 50, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.pinkLight, paddingHorizontal: 14 },
  searchInput: { flex: 1, marginLeft: 10, fontFamily: fonts.body, fontSize: 15, color: colors.ink },
  sectionTitle: { fontFamily: fonts.headingMedium, fontSize: 20, color: colors.ink, marginTop: 20, marginBottom: 10 },
  catCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, padding: 18, marginBottom: 11, borderWidth: 1, borderColor: 'rgba(58,42,77,0.08)', shadowColor: colors.ink, shadowOpacity: 0.1, shadowRadius: 9, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  catTitle: { fontFamily: fonts.heading, fontSize: 24, color: colors.ink },
  catSub: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  exploreChip: { alignSelf: 'flex-start', marginTop: 8, backgroundColor: colors.white, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 },
  exploreText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  quickActions: { flexDirection: 'row', gap: 12, marginTop: 2 },
  quickBtn: { flex: 1, height: 50, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(58,42,77,0.08)' },
  quickText: { fontFamily: fonts.headingMedium, fontSize: 16, color: colors.ink },
  promoBarWrap: { marginTop: 22 },
  collectionHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 23, marginBottom: 12 },
  collectionTitle: { fontFamily: fonts.heading, fontSize: 23, color: colors.ink },
  collectionSubtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2 },
  productCount: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1, color: colors.muted, paddingBottom: 4 },
  // category
  panel: { borderRadius: 30, padding: 16, marginBottom: 14 },
  chip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14 },
  chipText: { fontFamily: fonts.headingMedium, fontSize: 17, color: colors.ink },
  tileBox: { flex: 1, height: 160, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', gap: 10 },
  tileText: { fontFamily: fonts.headingMedium, fontSize: 17, color: colors.ink, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyMessage: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: 12 },
  errorText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink, textAlign: 'center' },
  retry: { marginTop: 14, backgroundColor: colors.butter, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 22 },
  retryText: { fontFamily: fonts.headingMedium, fontSize: 16, color: colors.ink },
  // details
  detailName: { fontFamily: fonts.heading, fontSize: 26, color: colors.ink, marginTop: 18 },
  priceLine: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  priceBadge: { alignSelf: 'flex-start', backgroundColor: colors.ink, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 14 },
  priceText: { fontFamily: fonts.heading, fontSize: 22, color: colors.white },
  detailOriginalPrice: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, textDecorationLine: 'line-through' },
  detailSaleBadge: { backgroundColor: colors.pink, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
  detailSaleText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink },
  detailLabel: { fontFamily: fonts.headingMedium, fontSize: 17, color: colors.ink, marginTop: 18 },
  detailDesc: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.muted, marginTop: 4 },
  offerBox: { marginTop: 16, backgroundColor: colors.butter, borderRadius: 16, padding: 12 },
  offerBoxText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  hint: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 8 },
  toastWrap: { position: 'absolute', left: 20, right: 20, bottom: 100, alignItems: 'center' },
  toastBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.ink, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  toastText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.white, marginLeft: 8 },
});