// Auth (Login/Signup), Cart, Checkout, Profile

// Import React and useState for creating components and managing changing data.
import React, { useState } from 'react';

// Import React Native components used to build the app's interface.
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  FlatList, KeyboardAvoidingView, Platform, Alert, StyleSheet,
} from 'react-native';

// Import icons such as the back arrow, cart, lock, and trash bin.
import { Ionicons } from '@expo/vector-icons';

// Import reusable components and app design settings.
import {
  Screen, ScreenHeader, PrimaryButton, ProductVisual,
} from '../components/components';

import {
  colors, fonts, formatPrice, calculateTotals, DISCOUNT_MIN,
} from '../data';

// Import authentication and shopping cart functions.
import { useAuth, useCart } from '../store';

// Import the sound played during checkout.
import { playCheckoutSound } from '../sound';


// ============================================================
// AUTH SCREEN: LOGIN AND SIGNUP
// ============================================================

// This screen allows users to log in or create a new account.
export function AuthScreen({ navigation, route }) {

  // Get login and signup functions from the authentication store.
  const { login, signup } = useAuth();

  // Get the function that adds a product to the cart.
  const { addToCart } = useCart();

  // If the user opened this screen while adding a product,
  // route.params contains that product.
  const pendingProduct = route.params?.pendingProduct;

  // useState stores values that can change while the screen is open.
  const [mode, setMode] = useState('login'); // Current screen mode
  const [name, setName] = useState('');       // User's name
  const [email, setEmail] = useState('');     // User's email
  const [password, setPassword] = useState(''); // User's password
  const [error, setError] = useState('');     // Error message
  const [busy, setBusy] = useState(false);    // Loading indicator

  // isSignup is true when the user selects the Signup option.
  const isSignup = mode === 'signup';

  // This function runs when the user presses Login or Create account.
  const handleSubmit = async () => {

    // Clear any error left from the previous attempt.
    setError('');

    // Validate the name when creating a new account.
    if (isSignup && !name.trim()) {
      return setError('Please enter your name.');
    }

    // Check whether the email contains an @ symbol.
    if (!email.includes('@')) {
      return setError('Please enter a valid email.');
    }

    // Require a password containing at least six characters.
    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    try {
      // Show the loading state while login/signup is processing.
      setBusy(true);

      // Call signup for a new account, otherwise call login.
      if (isSignup) {
        await signup(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }

      // If the user wanted to add a product before logging in,
      // add that product to the cart after successful authentication.
      if (pendingProduct) {
        addToCart(pendingProduct);
      }

      // Return to the previous screen after successful authentication.
      navigation.goBack();

    } catch (e) {
      // Display the error returned by the authentication function.
      setError(e.message);

    } finally {
      // Stop the loading state whether the operation succeeds or fails.
      setBusy(false);
    }
  };

  // Render the Login/Signup user interface.
  return (
    <Screen bg={colors.pinkLight}>

      {/* Adjust the layout when the keyboard appears. */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >

        {/* Allow the form to scroll on smaller screens. */}
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >

          {/* Back button returns to the previous screen. */}
          <TouchableOpacity
            style={s.back}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </TouchableOpacity>

          {/* Change the heading according to Login or Signup mode. */}
          <Text style={s.heading}>
            {isSignup ? 'Join the fun!' : 'Welcome back!'}
          </Text>

          {/* Display a different description for each mode. */}
          <Text style={s.sub}>
            {isSignup
              ? 'Create an account to start shopping'
              : 'Log in to add things to your cart'}
          </Text>

          <View style={s.card}>

            {/* Buttons for switching between Login and Signup. */}
            <View style={s.switch}>

              {/* Selecting this button changes mode to login. */}
              <TouchableOpacity
                style={[s.switchBtn, !isSignup && s.switchActive]}
                onPress={() => setMode('login')}
              >
                <Text
                  style={[
                    s.switchText,
                    !isSignup && { color: colors.white },
                  ]}
                >
                  Login
                </Text>
              </TouchableOpacity>

              {/* Selecting this button changes mode to signup. */}
              <TouchableOpacity
                style={[s.switchBtn, isSignup && s.switchActive]}
                onPress={() => setMode('signup')}
              >
                <Text
                  style={[
                    s.switchText,
                    isSignup && { color: colors.white },
                  ]}
                >
                  Sign up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Show the name field only when creating an account. */}
            {isSignup && (
              <Field
                icon="person-outline"
                label="Full name"
                value={name}
                onChangeText={setName}
                placeholder="Your name"
              />
            )}

            {/* Email input: value holds the text and onChangeText updates it. */}
            <Field
              icon="mail-outline"
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
            />

            {/* Password input hides the characters typed by the user. */}
            <Field
              icon="lock-closed-outline"
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              secure
            />

            {/* Display validation or authentication errors when present. */}
            {error ? <Text style={s.error}>{error}</Text> : null}

            {/* Run handleSubmit when the user presses the main button. */}
            <PrimaryButton
              title={isSignup ? 'Create account' : 'Log in'}
              onPress={handleSubmit}
              loading={busy}
              style={{ marginTop: 16 }}
            />

            {/* This message describes the app's demo session behavior. */}
            <Text style={s.note}>
              Demo login — your session is saved on this phone.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}


// ============================================================
// REUSABLE FIELD COMPONENT
// ============================================================

// This component creates an input row with an icon, label, and text box.
// Reusing it avoids writing the same input layout multiple times.
function Field({ icon, label, secure, ...inputProps }) {
  return (
    <View style={{ marginTop: 14 }}>

      {/* Label shown above the input field. */}
      <Text style={s.label}>{label}</Text>

      <View style={s.inputRow}>

        {/* Icon is supplied through the icon prop. */}
        <Ionicons name={icon} size={20} color={colors.muted} />

        {/* Spread inputProps passes properties such as value,
            onChangeText, placeholder, and keyboardType to TextInput. */}
        <TextInput
          style={s.input}
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          secureTextEntry={secure}
          {...inputProps}
        />
      </View>
    </View>
  );
}


// ============================================================
// CART SCREEN
// ============================================================

export function CartScreen({ navigation }) {

  // Get cart data and functions from the cart store.
  const {
    items, increase, decrease, removeItem, subtotal, itemCount,
  } = useCart();

  // Display a discount message based on the current subtotal.
  // If the subtotal exceeds DISCOUNT_MIN, tell the user the discount
  // is unlocked. Otherwise, show how much more they need to spend.
  const promo =
    subtotal > DISCOUNT_MIN
      ? '20% off unlocked! Applied at checkout.'
      : `Add ${formatPrice(Math.max(DISCOUNT_MIN + 1 - subtotal, 0))} more to unlock 20%.`;

  // renderItem defines how each individual cart product is displayed.
  const renderItem = ({ item }) => (
    <View style={s.row}>

      {/* Display the product's visual or image. */}
      <View style={{ width: 84 }}>
        <ProductVisual product={item} height={84} radius={20} />
      </View>

      <View style={{ flex: 1, marginHorizontal: 12 }}>

        {/* Show the product name and price. */}
        <Text style={s.itemName} numberOfLines={2}>
          {item.name}
        </Text>

        <Text style={s.itemPrice}>
          {formatPrice(item.price)}
        </Text>

        {/* Quantity controls let the user increase or decrease quantity. */}
        <View style={s.qtyBox}>

          {/* Decrease the quantity of this product. */}
          <TouchableOpacity
            style={s.qtyBtn}
            onPress={() => decrease(item.id)}
          >
            <Ionicons name="remove" size={18} color={colors.ink} />
          </TouchableOpacity>

          {/* Show the current quantity. */}
          <Text style={s.qty}>{item.qty}</Text>

          {/* Increase the quantity of this product. */}
          <TouchableOpacity
            style={[s.qtyBtn, { backgroundColor: colors.pinkLight }]}
            onPress={() => increase(item.id)}
          >
            <Ionicons name="add" size={18} color={colors.ink} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Remove this product from the cart. */}
      <TouchableOpacity
        style={s.remove}
        onPress={() => removeItem(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color={colors.ink} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Screen>

      {/* Cart heading and total number of items. */}
      <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
        <Text style={s.cartTitle}>My Cart</Text>

        {/* Use singular "item" when the count is one. */}
        <Text style={s.cartSub}>
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </Text>
      </View>

      {/* Conditional rendering: show an empty-cart message when
          the items array contains no products. */}
      {items.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="cart-outline" size={64} color={colors.muted} />

          <Text style={s.emptyText}>
            Your cart is empty — go find something cute!
          </Text>

          {/* Navigate to Home so the user can browse products. */}
          <PrimaryButton
            title="Start shopping"
            onPress={() => navigation.navigate('Home')}
            style={{ marginTop: 18, alignSelf: 'stretch' }}
          />
        </View>
      ) : (
        <>
          {/* Show the promotion message when the cart has products. */}
          <View style={s.promo}>
            <Text style={s.promoText}>{promo}</Text>
          </View>

          {/* FlatList efficiently displays the cart's product rows.
              keyExtractor gives every row a unique key using item.id. */}
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 20, paddingTop: 8 }}
          />

          {/* Bottom section showing the subtotal and checkout button. */}
          <View style={s.footer}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalValue}>{formatPrice(subtotal)}</Text>
            </View>

            {/* Navigate to Checkout when pressed. */}
            <PrimaryButton
              title="Go to Checkout"
              onPress={() => navigation.navigate('Checkout')}
            />
          </View>
        </>
      )}
    </Screen>
  );
}


// ============================================================
// CHECKOUT SCREEN
// ============================================================

export function CheckoutScreen({ navigation }) {

  // Get the current cart information and the function to empty the cart.
  const { items, subtotal, clearCart } = useCart();

  // Calculate the discount and final amount using the helper function.
  // The exact discount rule is implemented inside calculateTotals.
  const { discount, finalAmount } = calculateTotals(subtotal);

  // This function runs when the user presses Place Order.
  const handlePlaceOrder = async () => {

    // Play the checkout sound before showing the confirmation.
    await playCheckoutSound();

    // Show a popup confirming the order and its payable amount.
    Alert.alert(
      'Order placed successfully!',
      `Thank you! Your order is confirmed and you will pay ${formatPrice(finalAmount)} on delivery.`,
      [
        {
          text: 'OK',

          // After the user presses OK, empty the cart and return Home.
          onPress: () => {
            clearCart();
            navigation.navigate('Tabs', { screen: 'Home' });
          },
        },
      ]
    );
  };

  return (
    <Screen>

      {/* Reusable checkout header. The cart icon is hidden here. */}
      <ScreenHeader
        title="Checkout"
        subtitle="Almost yours!"
        showCart={false}
      />

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 10 }}>

        {/* ORDER SUMMARY: display each product in the cart. */}
        <View style={s.box}>
          <Text style={s.boxTitle}>Order summary</Text>

          {/* map() creates a summary row for every cart item. */}
          {items.map((item) => (
            <View key={item.id} style={s.sumRow}>
              <View style={{ flex: 1 }}>

                {/* Product name and selected quantity. */}
                <Text style={s.sumName} numberOfLines={1}>
                  {item.name}
                </Text>

                <Text style={s.sumQty}>Qty {item.qty}</Text>
              </View>

              {/* Calculate the line total: price multiplied by quantity. */}
              <Text style={s.sumPrice}>
                {formatPrice(item.price * item.qty)}
              </Text>
            </View>
          ))}

          {/* Display this message if the cart has no products. */}
          {items.length === 0 && (
            <Text style={s.sumQty}>Your cart is empty.</Text>
          )}
        </View>

        {/* PRICE DETAILS: subtotal, discount, and final payable amount. */}
        <View style={[s.box, { backgroundColor: colors.lavenderLight }]}>

          {/* Subtotal is the amount before discount. */}
          <View style={s.line}>
            <Text style={s.lineText}>Subtotal</Text>
            <Text style={s.lineText}>{formatPrice(subtotal)}</Text>
          </View>

          {/* Display the calculated discount amount. */}
          <View style={s.line}>
            <Text style={s.lineText}>Discount (20%)</Text>
            <Text style={s.lineText}>
              - {formatPrice(discount)}
            </Text>
          </View>

          {/* Dashed divider separates the totals from the final amount. */}
          <View style={s.divider} />

          {/* Show the amount the customer will pay. */}
          <View style={s.line}>
            <Text style={s.finalLabel}>Final payable</Text>
            <Text style={s.finalValue}>
              {formatPrice(finalAmount)}
            </Text>
          </View>
        </View>

        {/* Explain the promotion to the customer. */}
        <View style={s.note2}>
          <Text style={s.note2Text}>
            20% off is applied automatically on shopping above Rs. 1,200.
          </Text>
        </View>
      </ScrollView>

      {/* Place Order triggers the checkout confirmation function. */}
      <View style={{ padding: 20, paddingBottom: 28 }}>
        <PrimaryButton
          title="Place Order"
          icon="checkmark"
          onPress={handlePlaceOrder}
        />
      </View>
    </Screen>
  );
}


// ============================================================
// PROFILE SCREEN
// ============================================================

export function ProfileScreen({ navigation }) {

  // Get the currently logged-in user and the logout function.
  const { user, logout } = useAuth();

  return (
    <Screen>
      <View style={s.profileCenter}>

        {/* Display a person icon as the profile avatar. */}
        <View style={s.avatar}>
          <Ionicons name="person" size={48} color={colors.ink} />
        </View>

        {/* If a user exists, display their information and Logout button. */}
        {user ? (
          <>
            <Text style={s.profileName}>{user.name}</Text>
            <Text style={s.profileEmail}>{user.email}</Text>

            {/* Call logout when the user presses this button. */}
            <PrimaryButton
              title="Log out"
              icon="log-out-outline"
              color={colors.lavender}
              onPress={logout}
              style={s.profileBtn}
            />
          </>
        ) : (
          // If no user is logged in, show a login prompt instead.
          <>
            <Text style={s.profileName}>You're not logged in</Text>

            <Text style={s.profileEmail}>
              Log in to add products to your cart.
            </Text>

            {/* Navigate to the authentication screen. */}
            <PrimaryButton
              title="Login / Signup"
              onPress={() => navigation.navigate('Auth')}
              style={s.profileBtn}
            />
          </>
        )}
      </View>
    </Screen>
  );
}


// ============================================================
// STYLESHEET
// ============================================================

// StyleSheet.create() groups the styles used by the components above.
// For example, s.heading applies the style named "heading".
// Keeping styles here makes the UI code easier to read and maintain.
const s = StyleSheet.create({

  // ---------- AUTHENTICATION STYLES ----------

  // Back button size, background, and centered arrow icon.
  back: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Main heading and supporting description.
  heading: {
    fontFamily: fonts.heading,
    fontSize: 34,
    color: colors.ink,
    marginTop: 24,
  },

  sub: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.muted,
    marginTop: 2,
  },

  // White card containing the Login/Signup form.
  card: {
    backgroundColor: colors.white,
    borderRadius: 32,
    padding: 20,
    marginTop: 24,
  },

  // Horizontal container for the Login and Signup buttons.
  switch: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: 20,
    padding: 5,
  },

  // Base style shared by both switch buttons.
  switchBtn: {
    flex: 1,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Background applied to the currently selected mode.
  switchActive: {
    backgroundColor: colors.ink,
  },

  // Text style for the Login and Signup buttons.
  switchText: {
    fontFamily: fonts.headingMedium,
    fontSize: 16,
    color: colors.ink,
  },

  // Label displayed above each input field.
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 6,
  },

  // Container holding the input icon and TextInput.
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.pinkLight,
    paddingHorizontal: 14,
  },

  // Input expands to fill the available horizontal space.
  input: {
    flex: 1,
    marginLeft: 10,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },

  // Error message shown after invalid input or failed authentication.
  error: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: '#C0305A',
    marginTop: 12,
  },

  // Small note displayed below the authentication button.
  note: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 12,
  },


  // ---------- CART STYLES ----------

  // Cart page heading and item count.
  cartTitle: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: colors.ink,
  },

  cartSub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
  },

  // Promotion banner shown above the cart list.
  promo: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: colors.butter,
    borderRadius: 18,
    padding: 12,
  },

  promoText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },

  // One product row in the cart.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 26,
    padding: 10,
    marginBottom: 12,
  },

  // Product name and price styles.
  itemName: {
    fontFamily: fonts.headingMedium,
    fontSize: 15,
    color: colors.ink,
  },

  itemPrice: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
    marginTop: 2,
  },

  // Container for the minus button, quantity, and plus button.
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: colors.bg,
    borderRadius: 14,
    padding: 3,
  },

  // Shared style for the quantity control buttons.
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Quantity number shown between the buttons.
  qty: {
    fontFamily: fonts.headingMedium,
    fontSize: 16,
    color: colors.ink,
    minWidth: 30,
    textAlign: 'center',
  },

  // Remove-product button.
  remove: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },

  // Bottom container holding the total and checkout button.
  footer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
  },

  // Align the Total label and amount horizontally.
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },

  totalLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.muted,
  },

  totalValue: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: colors.ink,
  },

  // Center the empty-cart icon, message, and shopping button.
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  emptyText: {
    fontFamily: fonts.headingMedium,
    fontSize: 18,
    color: colors.ink,
    textAlign: 'center',
    marginTop: 12,
  },


  // ---------- CHECKOUT STYLES ----------

  // Card containers for order summary and price details.
  box: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 18,
    marginBottom: 14,
  },

  boxTitle: {
    fontFamily: fonts.headingMedium,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 6,
  },

  // Each product row in the order summary.
  sumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },

  sumName: {
    fontFamily: fonts.headingMedium,
    fontSize: 15,
    color: colors.ink,
  },

  sumQty: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
  },

  sumPrice: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
  },

  // Align labels and amounts on opposite sides.
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },

  lineText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.ink,
  },

  // Dashed line separating the subtotal and final payable amount.
  divider: {
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.muted,
    marginVertical: 10,
    opacity: 0.5,
  },

  // Emphasize the final amount the customer will pay.
  finalLabel: {
    fontFamily: fonts.headingMedium,
    fontSize: 18,
    color: colors.ink,
  },

  finalValue: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: colors.ink,
  },

  // Promotion note below the checkout price summary.
  note2: {
    backgroundColor: colors.mintLight,
    borderRadius: 18,
    padding: 12,
  },

  note2Text: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },


  // ---------- PROFILE STYLES ----------

  // Center all profile content vertically and horizontally.
  profileCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  // Circular-looking avatar container with a person icon.
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 36,
    backgroundColor: colors.lavenderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // User name and email displayed on the profile screen.
  profileName: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: colors.ink,
    marginTop: 18,
    textAlign: 'center',
  },

  profileEmail: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.muted,
    marginTop: 4,
    textAlign: 'center',
  },

  // Width and spacing of the profile's main action button.
  profileBtn: {
    alignSelf: 'stretch',
    marginTop: 24,
  },
});