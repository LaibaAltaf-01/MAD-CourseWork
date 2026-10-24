import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator, Animated, Easing, Image, ImageBackground, Pressable, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  colors, fonts, formatPrice, fetchStoreProducts, ACCESSORY_GROUPS, CLOTHES_GROUPS, MAKEUP_PRODUCTS, BANNER_TEXT,
  calculateTotals,
} from '../data';
import { useAuth, useCart } from '../store';
import { playButtonSound, playCheckoutSound } from '../sound';
import { AppButton, getCategory } from '../components/components';
import CartScreen from './CartScreen';
import CheckoutScreen from './CheckoutScreen';
import ProfileScreen from './ProfileScreen';

const HERO_IMAGE = require('../../assets/fashion-editorial.jpg');
const FAVORITES_KEY = '@blushly_favorites';
const TABS = [
  { id: 'home', label: 'Home', icon: 'home-outline' },
  { id: 'categories', label: 'Explore', icon: 'grid-outline' },
  { id: 'cart', label: 'Bag', icon: 'bag-handle-outline' },
  { id: 'account', label: 'Account', icon: 'person-outline' },
];
function getAccessoryProducts() {
  return ACCESSORY_GROUPS.flatMap((group) =>
    group.categories.flatMap((category) =>
      category.products.map((product) => ({ ...product, category: 'accessories' }))
    )
  );
}

function getClothingProducts() {
  return CLOTHES_GROUPS.flatMap((group) =>
    group.categories.flatMap((category) =>
      category.products.map((product) => ({ ...product, category: 'clothing' }))
    )
  );
}

function getProductImageSource(image) {
  return typeof image === 'string' ? { uri: image } : image;
}

function ProductTile({ product, onPress, onAdd, isFavorite, onToggleFavorite }) {
  return (
    <Pressable
      style={styles.productTile}
      onPress={() => {
        playButtonSound();
        onPress();
      }}
    >
      <View style={styles.productImageWrap}>
        {product.image ? (
          <Image source={getProductImageSource(product.image)} style={styles.productImage} resizeMode="contain" />
        ) : (
          <View style={[styles.productImage, styles.iconProduct, { backgroundColor: product.color || colors.pinkSoft }]}>
            <MaterialCommunityIcons name={product.icon || 'shopping-outline'} size={56} color={colors.ink} />
          </View>
        )}
        {product.discountPercent ? (
          <View style={styles.salePill}>
            <Text style={styles.salePillText}>{product.discountPercent}% OFF</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={(event) => {
            event.stopPropagation();
            playButtonSound();
            onToggleFavorite(product);
          }}
          accessibilityLabel={`${isFavorite ? 'Remove' : 'Save'} ${product.name} ${isFavorite ? 'from' : 'to'} wishlist`}
        >
          <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={17} color={isFavorite ? colors.pink : colors.ink} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tileAddButton}
          onPress={(event) => {
            event.stopPropagation();
            playButtonSound();
            onAdd(product);
          }}
          accessibilityLabel={`Add ${product.name} to bag`}
        >
          <Ionicons name="add" size={20} color={colors.ink} />
        </TouchableOpacity>
      </View>
      <Text style={styles.productCategory}>{getCategory(product).toUpperCase()}</Text>
      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
      <View style={styles.productPriceRow}>
        <Text style={[styles.productPrice, product.discountPercent && styles.discountPrice]}>{formatPrice(product.price)}</Text>
        {product.originalPrice ? <Text style={styles.strikePrice}>{formatPrice(product.originalPrice)}</Text> : null}
      </View>
    </Pressable>
  );
}

function SaleTicker() {
  const [copyWidth, setCopyWidth] = useState(0);
  const [offset] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!copyWidth) return undefined;
    const animation = Animated.loop(
      Animated.timing(offset, {
        toValue: -copyWidth,
        duration: copyWidth * 26,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [copyWidth, offset]);

  return (
    <View style={styles.ticker}>
      <Animated.View style={[styles.tickerTrack, { transform: [{ translateX: offset }] }]}>
        {[0, 1].map((copy) => (
          <Text
            key={copy}
            style={styles.tickerText}
            onLayout={copy === 0 ? (event) => setCopyWidth(event.nativeEvent.layout.width) : undefined}
          >
            {BANNER_TEXT}  ·  BLUSHLY, MADE FOR YOUR EVERYDAY
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

export default function BlushlyApp() {
  const { user } = useAuth();
  const { items, addToCart, clearCart, subtotal, itemCount } = useCart();
  const [apiProducts, setApiProducts] = useState([]);
  const [screen, setScreen] = useState('splash');
  const [activeTab, setActiveTab] = useState('home');
  const [catalogCategory, setCatalogCategory] = useState(null);
  const [catalogAudience, setCatalogAudience] = useState(null);
  const [catalogSubcategory, setCatalogSubcategory] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [pendingCartProduct, setPendingCartProduct] = useState(null);
  const [pendingCartReturn, setPendingCartReturn] = useState(null);
  const [previousScreen, setPreviousScreen] = useState('home');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [authPrompt, setAuthPrompt] = useState('');
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [cartNotice, setCartNotice] = useState('');
  const [cartToastVersion, setCartToastVersion] = useState(0);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [splashScale] = useState(() => new Animated.Value(0.88));
  const [splashOpacity] = useState(() => new Animated.Value(0));

  const products = useMemo(
    () => [...apiProducts, ...getAccessoryProducts(), ...getClothingProducts(), ...MAKEUP_PRODUCTS],
    [apiProducts]
  );
  const featuredProducts = useMemo(
    () => products.filter((product) => product.discountPercent || product.category.includes('jewel')).slice(0, 6),
    [products]
  );
  const favoriteProducts = products.filter((product) => favorites.includes(product.id));
  const dailyPick = products.length
    ? products[Math.floor(Date.now() / 86400000) % products.length]
    : null;
  const orderTotals = calculateTotals(subtotal);

  useEffect(() => {
    if (!cartToastVersion) return undefined;
    const timeout = setTimeout(() => setCartToastVersion(0), 2200);
    return () => clearTimeout(timeout);
  }, [cartToastVersion]);

  const loadProducts = async () => {
    setLoading(true);
    setLoadError('');
    try {
      setApiProducts(await fetchStoreProducts());
    } catch (error) {
      console.error('Could not load the Blushly collection:', error);
      setLoadError('We couldn’t load the collection. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const restoreFavorites = async () => {
      try {
        const saved = await AsyncStorage.getItem(FAVORITES_KEY);
        if (saved) {
          const restored = JSON.parse(saved);
          if (Array.isArray(restored) && restored.every((id) => typeof id === 'string')) {
            setFavorites(restored);
          } else {
            throw new Error('Saved Blushly favorites have an invalid format.');
          }
        }
      } catch (error) {
        console.error('Could not restore saved Blushly favorites:', error);
      } finally {
        setFavoritesLoaded(true);
      }
    };
    restoreFavorites();
  }, []);

  useEffect(() => {
    if (!favoritesLoaded) return;
    AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)).catch((error) => {
      console.error('Could not save Blushly favorites:', error);
    });
  }, [favorites, favoritesLoaded]);

  useEffect(() => {
    if (screen !== 'splash') return undefined;

    const animation = Animated.parallel([
      Animated.spring(splashScale, { toValue: 1, friction: 7, useNativeDriver: true }),
      Animated.timing(splashOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]);
    animation.start();
    const timer = setTimeout(() => setScreen('home'), 1900);

    return () => {
      animation.stop();
      clearTimeout(timer);
    };
  }, [screen, splashOpacity, splashScale]);

  const openTab = (tab) => {
    if (tab !== 'account') setCheckoutPending(false);
    setActiveTab(tab);
    setScreen(tab);
    if (tab === 'categories') {
      setCatalogCategory(null);
      setCatalogAudience(null);
      setCatalogSubcategory(null);
      setSearch('');
    }
  };

  const openCategory = (category) => {
    setCatalogCategory(category);
    setCatalogAudience(null);
    setCatalogSubcategory(null);
    setSearch('');
    setActiveTab('categories');
    setScreen('categories');
  };

  const goBackCatalog = () => {
    if (catalogSubcategory) setCatalogSubcategory(null);
    else if (catalogAudience) setCatalogAudience(null);
    else setCatalogCategory(null);
    setSearch('');
  };

  const openWishlist = () => {
    playButtonSound();
    setCheckoutPending(false);
    setScreen('wishlist');
  };

  const toggleFavorite = (product) => {
    setFavorites((saved) => (
      saved.includes(product.id)
        ? saved.filter((id) => id !== product.id)
        : [...saved, product.id]
    ));
  };

  const openProduct = (product) => {
    setPreviousScreen(screen);
    setSelectedProduct(product);
    setScreen('product');
  };
//adding product to cart if user is logged in
  const addProduct = (product) => {
    if (!user) {
      setPendingCartProduct(product);
      setPendingCartReturn({ screen, tab: activeTab });
      setCheckoutPending(false);
      setAuthPrompt('Please sign in to add this item to your bag.');
      setActiveTab('account');
      setScreen('account');
      return;
    }
    addToCart(product);
    setCartNotice(`${product.name} was added to your bag.`);
    setCartToastVersion((version) => version + 1);
  };

  const handleAuthenticated = () => {
    setAuthPrompt('');
    if (pendingCartProduct) {
      addToCart(pendingCartProduct);
      setCartNotice(`${pendingCartProduct.name} was added to your bag.`);
      setCartToastVersion((version) => version + 1);
      setPendingCartProduct(null);
      if (pendingCartReturn) {
        setActiveTab(pendingCartReturn.tab);
        setScreen(pendingCartReturn.screen);
        setPendingCartReturn(null);
      }
    }
  };

  const placeOrder = async (address = user?.deliveryAddress) => {
    if (!items.length) return;
    if (!address) {
      console.error('Cannot place the order without a delivery address.');
      setScreen('checkout');
      return;
    }
    try {
      await playCheckoutSound();
    } catch (error) {
      console.error('Could not play checkout sound:', error);
    }
    setCompletedOrder({
      ...orderTotals,
      itemCount,
      deliveryAddress: address,
    });
    clearCart();
    setCartNotice('');
    setScreen('success');
  };

  useEffect(() => {
    if (!user || !checkoutPending || !items.length) return;
    setCheckoutPending(false);
    if (user.deliveryAddress) {
      placeOrder(user.deliveryAddress);
    } else {
      setScreen('checkout');
    }
  }, [user, checkoutPending]);

  const handleCheckout = () => {
    if (!items.length) return;
    if (!user) {
      setCheckoutPending(true);
      setAuthPrompt('');
      setActiveTab('account');
      setScreen('account');
      return;
    }
    if (user.deliveryAddress) {
      placeOrder(user.deliveryAddress);
    } else {
      setScreen('checkout');
    }
  };

  const renderProductGrid = (list, apiBacked = false, emptyMessage = 'No pieces found. Try another search.') => {
    if (apiBacked && loading && !apiProducts.length) {
      return <View style={styles.stateBox}><ActivityIndicator color={colors.pink} size="large" /><Text style={styles.stateText}>Curating the collection…</Text></View>;
    }
    if (apiBacked && loadError && !apiProducts.length) {
      return <View style={styles.stateBox}><Text style={styles.stateText}>{loadError}</Text><AppButton title="Try again" onPress={loadProducts} style={styles.retryButton} /></View>;
    }
    if (!list.length) return <View style={styles.stateBox}><Text style={styles.stateText}>{emptyMessage}</Text></View>;
    return (
      <View style={styles.productGrid}>
        {list.map((product) => (
          <ProductTile
            key={product.id}
            product={product}
            onPress={() => openProduct(product)}
            onAdd={addProduct}
            isFavorite={favorites.includes(product.id)}
            onToggleFavorite={toggleFavorite}
          />
        ))}
      </View>
    );
  };

  const renderHome = () => (
    <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
      <View style={styles.homeTopline}>
        <View>
          <Text style={styles.wordmark}>blushly<Text style={styles.wordmarkDot}>.</Text></Text>
          <Text style={styles.wordmarkCaption}>THE LITTLE THINGS, BEAUTIFULLY FOUND</Text>
        </View>
        <View style={styles.homeActions}>
          <TouchableOpacity style={styles.headerIconButton} onPress={openWishlist} accessibilityLabel={`Open wishlist, ${favorites.length} saved items`}>
            <Ionicons name={favorites.length ? 'heart' : 'heart-outline'} size={21} color={favorites.length ? colors.pink : colors.ink} />
            {favorites.length ? <View style={styles.bagCount}><Text style={styles.bagCountText}>{favorites.length}</Text></View> : null}
          </TouchableOpacity>
          <TouchableOpacity style={styles.bagButton} onPress={() => { playButtonSound(); openTab('cart'); }} accessibilityLabel="Open shopping bag">
            <Ionicons name="bag-handle-outline" size={22} color={colors.ink} />
            <View style={styles.bagCount}><Text style={styles.bagCountText}>{itemCount}</Text></View>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.greeting}>{user ? `A little something for you, ${user.name}.` : 'A little something for you.'}</Text>

      <ImageBackground source={HERO_IMAGE} style={styles.hero} imageStyle={styles.heroImage} resizeMode="cover">
        <TouchableOpacity
          style={styles.heroHitArea}
          onPress={() => {
            playButtonSound();
            openCategory('Clothes');
          }}
          accessibilityLabel="Shop the Blushly new season edit"
        >
          <View style={styles.heroBadge}>
            <View style={styles.heroBadgeDot} />
            <Text style={styles.heroBadgeText}>THE NEW SEASON EDIT</Text>
          </View>
          <View style={styles.heroCallout}>
            <Text style={styles.heroCalloutText}>Find your next favorite</Text>
            <View style={styles.heroCalloutArrow}><Ionicons name="arrow-forward" size={16} color={colors.white} /></View>
          </View>
        </TouchableOpacity>
      </ImageBackground>

      <View style={styles.sectionHeader}>
        <View><Text style={styles.sectionTitle}>Find your feeling</Text><Text style={styles.sectionHint}>A world of lovely things</Text></View>
        <TouchableOpacity onPress={() => openTab('categories')}><Text style={styles.textLink}>VIEW ALL</Text></TouchableOpacity>
      </View>
      <View style={styles.categoryGrid}>
        {[
          { name: 'Accessories', icon: 'watch', tint: colors.mintLight },
          { name: 'Clothes', icon: 'tshirt-crew', tint: colors.pinkSoft },
          { name: 'Makeup', icon: 'lipstick', tint: colors.lavenderLight },
        ].map((category) => (
          <TouchableOpacity
            key={category.name}
            style={[styles.categoryCard, { backgroundColor: category.tint }]}
            onPress={() => {
              playButtonSound();
              openCategory(category.name);
            }}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name={category.icon} size={25} color={colors.ink} />
            <Text style={styles.categoryName}>{category.name}</Text>
            <Ionicons name="arrow-up-outline" size={15} color={colors.muted} style={styles.categoryArrow} />
          </TouchableOpacity>
        ))}
      </View>

      <SaleTicker />

      <View style={styles.sectionHeader}>
        <View><Text style={styles.sectionTitle}>A little lovely</Text><Text style={styles.sectionHint}>New finds, just for you</Text></View>
        <TouchableOpacity onPress={() => openTab('categories')}><Text style={styles.textLink}>SHOP ALL</Text></TouchableOpacity>
      </View>
      {renderProductGrid(featuredProducts, true)}
      {dailyPick ? (
        <View style={styles.dailyPickSection}>
          <View style={styles.dailyPickHeading}>
            <Text style={styles.sectionTitle}>A little serendipity</Text>
            <Text style={styles.sectionHint}>One lovely find, picked for today</Text>
          </View>
          <TouchableOpacity
            style={styles.dailyPickCard}
            activeOpacity={0.88}
            onPress={() => {
              playButtonSound();
              openProduct(dailyPick);
            }}
          >
            <View style={styles.dailyPickImageWrap}>
              {dailyPick.image ? (
                <Image source={getProductImageSource(dailyPick.image)} style={styles.dailyPickImage} resizeMode="contain" />
              ) : (
                <MaterialCommunityIcons name={dailyPick.icon || 'shopping-outline'} size={42} color={colors.ink} />
              )}
            </View>
            <View style={styles.dailyPickCopy}>
              <Text style={styles.dailyPickEyebrow}>TODAY’S LITTLE FIND</Text>
              <Text style={styles.dailyPickName} numberOfLines={2}>{dailyPick.name}</Text>
              <Text style={styles.dailyPickPrice}>{formatPrice(dailyPick.price)}</Text>
              <View style={styles.dailyPickLink}>
                <Text style={styles.dailyPickLinkText}>MEET YOUR PICK</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.pink} />
              </View>
            </View>
            <Ionicons name="sparkles" size={18} color={colors.pink} style={styles.dailyPickSparkle} />
          </TouchableOpacity>
        </View>
      ) : null}
      <View style={styles.bottomNote}><Text style={styles.bottomNoteText}>Made for you, with a little extra love ♡</Text></View>
    </ScrollView>
  );

  const renderCatalog = () => (
    (() => {
      const groups = catalogCategory === 'Accessories' ? ACCESSORY_GROUPS : CLOTHES_GROUPS;
      const selectedGroup = groups.find((group) => group.id === catalogAudience);
      const selectedSubcategory = selectedGroup?.categories.find((category) => category.id === catalogSubcategory);
      const query = search.trim().toLowerCase();
      const makeupCollection = MAKEUP_PRODUCTS.filter((product) =>
        !query || `${product.name} ${product.description}`.toLowerCase().includes(query)
      );
      const subcategoryProducts = selectedSubcategory
        ? selectedSubcategory.products
          .map((product) => ({ ...product, category: catalogCategory === 'Clothes' ? 'clothing' : 'accessories' }))
          .filter((product) => !query || `${product.name} ${product.description || ''}`.toLowerCase().includes(query))
        : [];
      const title = !catalogCategory
        ? 'Find your lovely.'
        : selectedSubcategory?.title
          || (selectedGroup ? (selectedGroup.id === 'male' ? 'Male' : 'Female') : catalogCategory);
      const subtitle = !catalogCategory
        ? 'Choose a collection to start exploring.'
        : selectedSubcategory
          ? `${subcategoryProducts.length} pieces to discover`
          : selectedGroup
            ? 'Choose a subcategory to see its products.'
            : catalogCategory === 'Makeup'
              ? 'Blushly beauty essentials, picked for your routine.'
              : 'Choose Male or Female to browse the collection.';

      return (
        <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
          <View style={styles.pageHeading}>
            {catalogCategory ? (
              <TouchableOpacity style={styles.catalogBackButton} onPress={() => { playButtonSound(); goBackCatalog(); }} accessibilityLabel="Back to categories">
                <Ionicons name="arrow-back" size={18} color={colors.ink} />
                <Text style={styles.catalogBackText}>CATEGORIES</Text>
              </TouchableOpacity>
            ) : null}
            <Text style={styles.pageEyebrow}>BLUSHLY COLLECTION</Text>
            <Text style={styles.pageTitle}>{title}</Text>
            <Text style={styles.pageSubtitle}>{subtitle}</Text>
          </View>

          {catalogCategory ? (
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={19} color={colors.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={selectedSubcategory || catalogCategory === 'Makeup' ? 'Search this collection' : 'Search categories'}
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
                returnKeyType="search"
              />
              {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={19} color={colors.muted} /></TouchableOpacity> : null}
            </View>
          ) : null}

          {!catalogCategory ? (
            <View style={styles.categoryGrid}>
              {[
                { name: 'Accessories', icon: 'watch', tint: colors.mintLight, description: 'Watches, wallets & purses' },
                { name: 'Clothes', icon: 'tshirt-crew', tint: colors.pinkSoft, description: 'Stitched & unstitched styles' },
                { name: 'Makeup', icon: 'lipstick', tint: colors.lavenderLight, description: 'Beauty essentials & makeup' },
              ].map((category) => (
                <TouchableOpacity
                  key={category.name}
                  style={[styles.categoryCard, styles.catalogCategoryCard, { backgroundColor: category.tint }]}
                  onPress={() => { playButtonSound(); openCategory(category.name); }}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name={category.icon} size={27} color={colors.ink} />
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryCardSubtitle}>{category.description}</Text>
                  <Ionicons name="arrow-up-outline" size={15} color={colors.muted} style={styles.categoryArrow} />
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {catalogCategory && catalogCategory !== 'Makeup' && !selectedGroup ? (
            <View style={styles.categoryGrid}>
              {groups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={[styles.categoryCard, styles.catalogCategoryCard, { backgroundColor: group.bg }]}
                  onPress={() => { playButtonSound(); setCatalogAudience(group.id); setSearch(''); }}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name={group.id === 'male' ? 'gender-male' : 'gender-female'} size={27} color={group.accent} />
                  <Text style={styles.categoryName}>{group.id === 'male' ? 'Male' : 'Female'}</Text>
                  <Text style={styles.categoryCardSubtitle}>{group.categories.map((category) => category.title).join(' · ')}</Text>
                  <Ionicons name="arrow-up-outline" size={15} color={colors.muted} style={styles.categoryArrow} />
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {selectedGroup && !selectedSubcategory ? (
            <View style={styles.categoryGrid}>
              {selectedGroup.categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.categoryCard, styles.catalogCategoryCard, { backgroundColor: selectedGroup.bg }]}
                  onPress={() => { playButtonSound(); setCatalogSubcategory(category.id); setSearch(''); }}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name={category.icon} size={27} color={selectedGroup.accent} />
                  <Text style={styles.categoryName}>{category.title}</Text>
                  <Text style={styles.categoryCardSubtitle}>{category.products.length} products</Text>
                  <Ionicons name="arrow-up-outline" size={15} color={colors.muted} style={styles.categoryArrow} />
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {catalogCategory === 'Makeup' ? (
            <View style={styles.catalogProducts}>
              <View style={styles.catalogHeading}>
                <Text style={styles.sectionTitle}>Beauty essentials</Text>
                <Text style={styles.sectionHint}>{makeupCollection.length} products</Text>
              </View>
              {renderProductGrid(makeupCollection)}
            </View>
          ) : null}

          {selectedSubcategory ? (
            <View style={styles.catalogProducts}>
              <View style={styles.catalogHeading}>
                <Text style={styles.sectionTitle}>{selectedSubcategory.title}</Text>
                <Text style={styles.sectionHint}>{subcategoryProducts.length} products</Text>
              </View>
              {renderProductGrid(subcategoryProducts)}
            </View>
          ) : null}
        </ScrollView>
      );
    })()
  );

  const renderProduct = () => {
    if (!selectedProduct) return null;
    return (
      <ScrollView contentContainerStyle={styles.productDetailPage} showsVerticalScrollIndicator={false}>
        <View style={styles.detailTopline}>
          <TouchableOpacity style={styles.backButton} onPress={() => { playButtonSound(); setScreen(previousScreen); }} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={21} color={colors.ink} />
          </TouchableOpacity>
          <Text style={styles.detailBrand}>BLUSHLY / {getCategory(selectedProduct).toUpperCase()}</Text>
          <View style={styles.detailActions}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                playButtonSound();
                toggleFavorite(selectedProduct);
              }}
              accessibilityLabel={`${favorites.includes(selectedProduct.id) ? 'Remove from' : 'Save to'} wishlist`}
            >
              <Ionicons name={favorites.includes(selectedProduct.id) ? 'heart' : 'heart-outline'} size={20} color={favorites.includes(selectedProduct.id) ? colors.pink : colors.ink} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton} onPress={() => { playButtonSound(); openTab('cart'); }} accessibilityLabel="Shopping bag">
              <Ionicons name="bag-handle-outline" size={21} color={colors.ink} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.detailImageWrap}>
          {selectedProduct.image ? (
            <Image source={getProductImageSource(selectedProduct.image)} style={styles.detailImage} resizeMode="contain" />
          ) : (
            <View style={[styles.detailImage, styles.iconProduct, { backgroundColor: selectedProduct.color || colors.pinkSoft }]}>
              <MaterialCommunityIcons name={selectedProduct.icon || 'shopping-outline'} size={110} color={colors.ink} />
            </View>
          )}
          {selectedProduct.discountPercent ? <View style={styles.detailSalePill}><Text style={styles.salePillText}>{selectedProduct.discountPercent}% OFF</Text></View> : null}
        </View>
        <Text style={styles.detailEyebrow}>{getCategory(selectedProduct).toUpperCase()} / SELECTED FOR YOU</Text>
        <Text style={styles.detailTitle}>{selectedProduct.name}</Text>
        <View style={styles.detailPriceRow}>
          <Text style={[styles.detailPrice, selectedProduct.discountPercent && styles.discountPrice]}>{formatPrice(selectedProduct.price)}</Text>
          {selectedProduct.originalPrice ? <Text style={styles.strikePrice}>{formatPrice(selectedProduct.originalPrice)}</Text> : null}
          {selectedProduct.discountPercent ? <Text style={styles.detailSave}>{selectedProduct.discountPercent}% OFF</Text> : null}
        </View>
        <Text style={styles.detailDescription}>{selectedProduct.description}</Text>
        <View style={styles.deliveryNote}><Ionicons name="heart-outline" size={18} color={colors.pink} /><Text style={styles.deliveryText}>Picked with care. Delivered with love.</Text></View>
        <AppButton title="Add to bag" icon="bag-handle-outline" onPress={() => addProduct(selectedProduct)} style={styles.detailAddButton} />
      </ScrollView>
    );
  };

  const renderWishlist = () => (
    <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
      <View style={styles.pageHeading}>
        <Text style={styles.pageEyebrow}>YOUR PERSONAL EDIT</Text>
        <Text style={styles.pageTitle}>Saved with love.</Text>
        <Text style={styles.pageSubtitle}>
          {favoriteProducts.length
            ? `${favoriteProducts.length} ${favoriteProducts.length === 1 ? 'piece' : 'pieces'} waiting for you`
            : 'Keep the pieces you love close at hand.'}
        </Text>
      </View>
      {favoritesLoaded ? (
        favoriteProducts.length ? (
          <View style={styles.productGrid}>
            {favoriteProducts.map((product) => (
              <ProductTile
                key={product.id}
                product={product}
                onPress={() => openProduct(product)}
                onAdd={addProduct}
                isFavorite
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyBag}>
            <View style={styles.emptyBagIcon}><Ionicons name="heart-outline" size={35} color={colors.pink} /></View>
            <Text style={styles.emptyBagTitle}>A little room for lovely.</Text>
            <Text style={styles.emptyBagCopy}>Tap the heart on any piece and it’ll be saved here for later.</Text>
            <AppButton title="Explore the collection" onPress={() => openTab('categories')} style={styles.emptyBagButton} />
          </View>
        )
      ) : (
        <View style={styles.stateBox}><ActivityIndicator color={colors.pink} size="large" /><Text style={styles.stateText}>Finding your saved pieces…</Text></View>
      )}
    </ScrollView>
  );

  const renderSplash = () => (
    <View style={styles.splashPage}>
      <View style={[styles.splashOrb, styles.splashOrbLavender]} />
      <View style={[styles.splashOrb, styles.splashOrbMint]} />
      <View style={[styles.splashOrb, styles.splashOrbGold]} />
      <Animated.View style={[styles.splashContent, { opacity: splashOpacity, transform: [{ scale: splashScale }] }]}>
        <View style={styles.splashMark}>
          <Ionicons name="bag-handle" size={43} color={colors.ink} />
          <View style={styles.splashHeart}><Ionicons name="heart" size={14} color={colors.white} /></View>
        </View>
        <Text style={styles.splashWordmark}>blushly<Text style={styles.splashWordmarkDot}>.</Text></Text>
        <Text style={styles.splashTagline}>THE LITTLE THINGS, BEAUTIFULLY FOUND</Text>
        <View style={styles.splashDivider} />
        <Text style={styles.splashOffer}>20% OFF — Limited Stock!</Text>
        <Text style={styles.splashSubline}>Thoughtful finds for your everyday.</Text>
      </Animated.View>
      <Text style={styles.splashFooter}>MADE WITH LOVE, JUST FOR YOU</Text>
    </View>
  );

  const renderScreen = () => {
    if (screen === 'splash') return renderSplash();
    if (screen === 'product') return renderProduct();
    if (screen === 'checkout') {
      return <CheckoutScreen onBack={() => setScreen('cart')} onOrderPlaced={placeOrder} />;
    }
    if (screen === 'wishlist') return renderWishlist();
    if (screen === 'success') return renderSuccess();
    if (screen === 'categories') return renderCatalog();
    if (screen === 'cart') {
      return <CartScreen notice={cartNotice} onShop={() => openTab('categories')} onCheckout={handleCheckout} />;
    }
    if (screen === 'account') {
      return (
        <ProfileScreen
          checkoutPending={checkoutPending}
          authPrompt={authPrompt}
          onAuthenticated={handleAuthenticated}
          onClearPrompt={() => setAuthPrompt('')}
        />
      );
    }
    return renderHome();
  };

  const renderSuccess = () => (
    <View style={styles.successPage}>
      <View style={styles.confettiRow} accessibilityLabel="Celebration">
        <Text style={styles.confetti}>✦</Text>
        <Text style={[styles.confetti, styles.confettiPink]}>✿</Text>
        <Text style={[styles.confetti, styles.confettiMint]}>✦</Text>
        <Text style={[styles.confetti, styles.confettiGold]}>✧</Text>
        <Text style={[styles.confetti, styles.confettiPink]}>✿</Text>
      </View>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark" size={48} color={colors.ink} />
      </View>
      <Text style={styles.successEyebrow}>A LITTLE BLUSHLY MAGIC</Text>
      <Text style={styles.successTitle}>Hooray!</Text>
      <Text style={styles.successMessage}>Your order is on its way.</Text>
      <Text style={styles.successDescription}>Thank you for shopping with Blushly. We hope your new finds make you smile.</Text>
      <View style={styles.successOrderNote}>
        <Ionicons name="heart" size={17} color={colors.pink} />
        <Text style={styles.successOrderText}>
          {completedOrder?.discount
            ? `You saved ${formatPrice(completedOrder.discount)} with your 20% offer!`
            : 'Your order has been placed successfully.'}
        </Text>
      </View>
      {completedOrder ? (
        <Text style={styles.successTotal}>Order total · {formatPrice(completedOrder.finalAmount)}</Text>
      ) : null}
      {completedOrder?.deliveryAddress ? (
        <View style={styles.successAddress}>
          <Ionicons name="location-outline" size={16} color={colors.pink} />
          <Text style={styles.successAddressText}>
            Delivering to {completedOrder.deliveryAddress.city}, {completedOrder.deliveryAddress.region}
          </Text>
        </View>
      ) : null}
      <AppButton
        title="Keep exploring"
        icon="arrow-forward"
        onPress={() => {
          openTab('home');
        }}
        style={styles.successButton}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      {renderScreen()}
      {cartToastVersion > 0 ? (
        <View style={styles.cartToast} pointerEvents="none" accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Ionicons name="checkmark-circle" size={19} color={colors.mint} />
          <Text style={styles.cartToastText}>Item added to cart</Text>
        </View>
      ) : null}
      {screen !== 'splash' && screen !== 'product' && screen !== 'checkout' && screen !== 'success' ? (
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity key={tab.id} style={styles.tabItem} onPress={() => { playButtonSound(); openTab(tab.id); }} activeOpacity={0.8}>
                <View style={[styles.tabIconWrap, active && styles.tabIconActive]}>
                  <Ionicons name={tab.icon} size={21} color={active ? colors.ink : colors.muted} />
                  {tab.id === 'cart' ? <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{itemCount}</Text></View> : null}
                </View>
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {tab.id === 'cart' && itemCount > 0 ? `Bag (${itemCount})` : tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  pageContent: { paddingHorizontal: 20, paddingBottom: 32 },
  splashPage: { flex: 1, backgroundColor: colors.pinkLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  splashOrb: { position: 'absolute', borderRadius: 999 },
  splashOrbLavender: { width: 280, height: 280, top: -135, right: -96, backgroundColor: colors.lavenderLight },
  splashOrbMint: { width: 225, height: 225, bottom: -100, left: -90, backgroundColor: colors.mintLight },
  splashOrbGold: { width: 75, height: 75, top: '19%', left: '10%', backgroundColor: colors.butter },
  splashContent: { alignItems: 'center', paddingHorizontal: 30 },
  splashMark: { width: 94, height: 94, borderRadius: 32, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 6, borderBottomColor: colors.pink, shadowColor: colors.ink, shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  splashHeart: { position: 'absolute', top: -5, right: -5, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center' },
  splashWordmark: { color: colors.ink, fontFamily: fonts.heading, fontSize: 58, lineHeight: 68, letterSpacing: -2.5, marginTop: 22 },
  splashWordmarkDot: { color: colors.pink },
  splashTagline: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1.7, marginTop: 2, textAlign: 'center' },
  splashDivider: { width: 44, height: 3, borderRadius: 2, backgroundColor: colors.pink, marginTop: 29, marginBottom: 18 },
  splashOffer: { color: colors.ink, fontFamily: fonts.headingMedium, fontSize: 19 },
  splashSubline: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, marginTop: 5 },
  splashFooter: { position: 'absolute', bottom: 30, color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1.8 },
  homeTopline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 },
  homeActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmark: { color: colors.ink, fontFamily: fonts.heading, fontSize: 33, lineHeight: 38, letterSpacing: -1 },
  wordmarkDot: { color: colors.pink },
  wordmarkCaption: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 8, letterSpacing: 1.5, marginTop: 1 },
  bagButton: { width: 46, height: 46, borderRadius: 17, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.pinkSoft },
  headerIconButton: { width: 46, height: 46, borderRadius: 17, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.pinkSoft },
  bagCount: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  bagCountText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.ink },
  cartNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.mintLight, padding: 12, borderRadius: 13, marginBottom: 14 },
  cartNoticeText: { color: colors.ink, fontFamily: fonts.body, fontSize: 12, flex: 1 },
  cartToast: { position: 'absolute', bottom: 84, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.ink, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 11, zIndex: 10, elevation: 8 },
  cartToastText: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 13 },
  greeting: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 17, marginBottom: 15 },
  hero: { width: '100%', maxWidth: 980, aspectRatio: 1.5, alignSelf: 'center', borderRadius: 24, overflow: 'hidden', backgroundColor: colors.pinkSoft, borderWidth: 1, borderColor: colors.pinkSoft },
  heroImage: { borderRadius: 24 },
  heroHitArea: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', alignItems: 'flex-start', padding: 17 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
  heroBadgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.pink },
  heroBadgeText: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1.25 },
  heroCallout: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 999, paddingVertical: 7, paddingLeft: 15, paddingRight: 7 },
  heroCalloutText: { color: colors.ink, fontFamily: fonts.headingMedium, fontSize: 13 },
  heroCalloutArrow: { width: 31, height: 31, borderRadius: 16, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 29, marginBottom: 14 },
  sectionTitle: { color: colors.ink, fontFamily: fonts.heading, fontSize: 25 },
  sectionHint: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
  textLink: { color: colors.pink, fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1, paddingBottom: 4 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  categoryCard: { width: '48.5%', minHeight: 87, borderRadius: 20, padding: 14, justifyContent: 'center' },
  catalogCategoryCard: { minHeight: 125, paddingRight: 31 },
  categoryCardSubtitle: { color: colors.muted, fontFamily: fonts.body, fontSize: 11, marginTop: 3 },
  categoryName: { color: colors.ink, fontFamily: fonts.headingMedium, fontSize: 16, marginTop: 6 },
  categoryArrow: { position: 'absolute', top: 14, right: 14, transform: [{ rotate: '45deg' }] },
  ticker: { height: 42, backgroundColor: colors.ink, borderRadius: 14, overflow: 'hidden', justifyContent: 'center', marginTop: 28 },
  tickerTrack: { flexDirection: 'row', alignItems: 'center' },
  tickerText: { color: colors.butter, fontFamily: fonts.headingMedium, fontSize: 13, paddingHorizontal: 18, letterSpacing: 0.5 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginHorizontal: -5 },
  productTile: { width: '48.5%', backgroundColor: colors.white, borderRadius: 22, padding: 9, marginBottom: 13, borderWidth: 1, borderColor: colors.pinkSoft, shadowColor: colors.ink, shadowOpacity: 0.055, shadowRadius: 9, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  productImageWrap: { height: 173, borderRadius: 16, backgroundColor: '#FFF9FB', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  productImage: { width: '100%', height: '100%' },
  iconProduct: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  salePill: { position: 'absolute', top: 9, left: 9, backgroundColor: colors.pink, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 9 },
  salePillText: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 10 },
  favoriteButton: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', shadowColor: colors.ink, shadowOpacity: 0.1, shadowRadius: 5, elevation: 2 },
  tileAddButton: { position: 'absolute', right: 8, bottom: 8, width: 34, height: 34, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', shadowColor: colors.ink, shadowOpacity: 0.1, shadowRadius: 5, elevation: 2 },
  productCategory: { color: colors.pink, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1.2, marginTop: 10 },
  productName: { color: colors.ink, fontFamily: fonts.headingMedium, fontSize: 14, lineHeight: 18, minHeight: 36, marginTop: 3 },
  productPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6, minHeight: 19 },
  productPrice: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 13 },
  discountPrice: { color: '#C44C6A' },
  strikePrice: { color: colors.muted, fontFamily: fonts.body, fontSize: 11, textDecorationLine: 'line-through' },
  bottomNote: { alignItems: 'center', paddingVertical: 23 },
  bottomNoteText: { color: colors.muted, fontFamily: fonts.body, fontSize: 13 },
  dailyPickSection: { marginTop: 14 },
  dailyPickHeading: { marginBottom: 13 },
  dailyPickCard: { minHeight: 143, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.lavenderLight, borderRadius: 23, padding: 13, borderWidth: 1, borderColor: '#D8C9FA', overflow: 'hidden' },
  dailyPickImageWrap: { width: 108, height: 116, borderRadius: 17, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  dailyPickImage: { width: '100%', height: '100%' },
  dailyPickCopy: { flex: 1, paddingLeft: 14, paddingRight: 3, justifyContent: 'center' },
  dailyPickEyebrow: { color: colors.pink, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1.25 },
  dailyPickName: { color: colors.ink, fontFamily: fonts.headingMedium, fontSize: 15, lineHeight: 19, marginTop: 5 },
  dailyPickPrice: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 13, marginTop: 4 },
  dailyPickLink: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
  dailyPickLinkText: { color: colors.pink, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 0.8 },
  dailyPickSparkle: { position: 'absolute', top: 12, right: 12 },
  pageHeading: { paddingTop: 20, paddingBottom: 17 },
  pageEyebrow: { color: colors.pink, fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.6 },
  pageTitle: { color: colors.ink, fontFamily: fonts.heading, fontSize: 34, marginTop: 7 },
  pageSubtitle: { color: colors.muted, fontFamily: fonts.body, fontSize: 14, marginTop: 4 },
  searchBar: { height: 50, borderRadius: 16, backgroundColor: colors.white, borderColor: colors.pinkLight, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 9 },
  searchInput: { flex: 1, color: colors.ink, fontFamily: fonts.body, fontSize: 14, paddingVertical: 0 },
  filterList: { gap: 8, paddingTop: 17, paddingBottom: 3 },
  filterPill: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.pinkLight },
  filterPillActive: { backgroundColor: colors.pink, borderColor: colors.pink },
  filterText: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 12 },
  filterTextActive: { color: colors.ink },
  catalogHeading: { marginTop: 22, marginBottom: 14 },
  catalogBackButton: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', paddingVertical: 8, paddingRight: 12, marginBottom: 13 },
  catalogBackText: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1 },
  catalogProducts: { marginTop: 4 },
  stateBox: { minHeight: 160, alignItems: 'center', justifyContent: 'center', padding: 22 },
  stateText: { color: colors.muted, fontFamily: fonts.body, fontSize: 14, textAlign: 'center', marginTop: 12 },
  retryButton: { marginTop: 14, alignSelf: 'center' },
  productDetailPage: { paddingHorizontal: 20, paddingBottom: 30 },
  detailTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 9, paddingBottom: 15 },
  detailActions: { flexDirection: 'row', gap: 8 },
  backButton: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.pinkSoft },
  detailBrand: { fontFamily: fonts.bodyBold, color: colors.muted, letterSpacing: 1.2, fontSize: 9 },
  detailImageWrap: { height: 340, borderRadius: 27, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: colors.pinkSoft },
  detailImage: { width: '82%', height: '82%' },
  detailSalePill: { position: 'absolute', top: 15, left: 15, backgroundColor: colors.pink, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12 },
  detailEyebrow: { color: colors.pink, fontFamily: fonts.bodyBold, letterSpacing: 1.4, fontSize: 10, marginTop: 21 },
  detailTitle: { color: colors.ink, fontFamily: fonts.heading, fontSize: 28, lineHeight: 34, marginTop: 6 },
  detailPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 11 },
  detailPrice: { color: colors.ink, fontFamily: fonts.heading, fontSize: 22 },
  detailSave: { color: colors.ink, backgroundColor: colors.pink, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontFamily: fonts.bodyBold, fontSize: 10 },
  detailDescription: { color: colors.muted, fontFamily: fonts.body, fontSize: 14, lineHeight: 22, marginTop: 13 },
  deliveryNote: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.pinkSoft, borderRadius: 14, padding: 13, marginTop: 18 },
  deliveryText: { color: colors.ink, fontFamily: fonts.body, fontSize: 12 },
  detailAddButton: { marginTop: 19 },
  emptyBag: { alignItems: 'center', paddingHorizontal: 28, paddingVertical: 50, backgroundColor: colors.white, borderRadius: 24, borderWidth: 1, borderColor: colors.pinkSoft, marginTop: 8 },
  emptyBagIcon: { width: 76, height: 76, borderRadius: 26, backgroundColor: colors.pinkSoft, alignItems: 'center', justifyContent: 'center' },
  emptyBagTitle: { color: colors.ink, fontFamily: fonts.heading, fontSize: 23, marginTop: 17 },
  emptyBagCopy: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 5 },
  emptyBagButton: { marginTop: 20 },
  successPage: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, paddingHorizontal: 30, paddingBottom: 25 },
  confettiRow: { flexDirection: 'row', alignItems: 'center', gap: 17, marginBottom: 26 },
  confetti: { fontSize: 27, color: colors.lavender },
  confettiPink: { color: colors.pink, fontSize: 23 },
  confettiMint: { color: colors.mint, fontSize: 25 },
  confettiGold: { color: '#D8B65B', fontSize: 27 },
  successIcon: { width: 94, height: 94, borderRadius: 34, backgroundColor: colors.mintLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.mint },
  successEyebrow: { color: colors.pink, fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.6, marginTop: 24 },
  successTitle: { color: colors.ink, fontFamily: fonts.heading, fontSize: 48, marginTop: 4 },
  successMessage: { color: colors.ink, fontFamily: fonts.headingMedium, fontSize: 18, marginTop: 1 },
  successDescription: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, lineHeight: 21, textAlign: 'center', maxWidth: 300, marginTop: 9 },
  successOrderNote: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.pinkSoft, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginTop: 22 },
  successOrderText: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 12 },
  successTotal: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 13, marginTop: 13 },
  successAddress: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 11, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 13, backgroundColor: colors.pinkSoft },
  successAddressText: { color: colors.ink, fontFamily: fonts.body, fontSize: 12 },
  successButton: { alignSelf: 'stretch', marginTop: 22 },
  tabBar: { flexDirection: 'row', backgroundColor: colors.white, paddingTop: 8, paddingBottom: 7, borderTopWidth: 1, borderTopColor: colors.pinkSoft },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabIconWrap: { width: 47, height: 31, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tabIconActive: { backgroundColor: colors.pinkSoft },
  tabBadge: { position: 'absolute', top: -3, right: 2, minWidth: 15, height: 15, borderRadius: 8, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  tabBadgeText: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 9 },
  tabLabel: { color: colors.muted, fontFamily: fonts.body, fontSize: 10, marginTop: 1 },
  tabLabelActive: { color: colors.ink, fontFamily: fonts.bodyBold },
});
