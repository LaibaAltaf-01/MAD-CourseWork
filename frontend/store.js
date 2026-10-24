
 // Login + Cart for the whole app
 // useContext shares data between screens
 // useState stores changing data
 // AsyncStorage saves data locally on the device

import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==================================================
// AUTHENTICATION: SIGN UP, LOGIN, LOGOUT
// ==================================================

// Keys used to identify saved data in AsyncStorage
const USERS_KEY = '@blushly_users';     // Stores all registered users
const SESSION_KEY = '@blushly_session'; // Stores the currently logged-in user

// Create a context to share login information with all screens
const AuthContext = createContext(null);

export function AuthProvider({ children }) {

  // Stores the currently logged-in user's information
  // null means nobody is logged in
  const [user, setUser] = useState(null);

  // Runs once when the app opens
  // Checks whether a login session was saved previously
  useEffect(() => {
    const restore = async () => {
      try {
        // Get the saved login session from local storage
        const saved = await AsyncStorage.getItem(SESSION_KEY);

        // Convert saved JSON text back into a JavaScript object
        // Restore the user if a session exists
        if (saved) setUser(JSON.parse(saved));

      } catch (e) {
        // Show an error if the session cannot be restored
        console.log('Could not restore session', e);
      }
    };

    restore();
  }, []);

  // Get all registered users from local storage
  const getUsers = async () => {
    const raw = await AsyncStorage.getItem(USERS_KEY);

    // Convert saved text into an array
    // If no users exist, return an empty array
    return raw ? JSON.parse(raw) : [];
  };

  // ---------------- SIGN UP ----------------
  // Register a new user and automatically log them in
  const signup = async (name, email, password, deliveryAddress = null) => {

    // Retrieve existing registered users
    const users = await getUsers();

    // Check whether this email is already registered
    if (users.some((u) => u.email === email.toLowerCase())) {
      throw new Error('This email is already registered. Please log in.');
    }

    // Create an object containing the new user's information
    const newUser = {
      name,
      email: email.toLowerCase(), // Store email in lowercase
      password,
      deliveryAddress
    };

    // Save the updated users array in local storage
    // JSON.stringify converts the array into text
    await AsyncStorage.setItem(
      USERS_KEY,
      JSON.stringify([...users, newUser])
    );

    // Create a login session without including the password
    const session = { name, email: newUser.email, deliveryAddress };

    // Save the current login session locally
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));

    // Update React state so screens know the user is logged in
    setUser(session);
  };

  // ---------------- LOGIN ----------------
  // Check whether the entered email and password are correct
  const login = async (email, password) => {

    // Get the list of registered users
    const users = await getUsers();

    // Find a user whose email and password match
    const found = users.find(
      (u) => u.email === email.toLowerCase() && u.password === password
    );

    // If no matching user exists, show an error
    if (!found) throw new Error('Wrong email or password.');

    // Create a session for the matched user
    const session = {
      name: found.name,
      email: found.email,
      deliveryAddress: found.deliveryAddress || null
    };

    // Save the login session on the device
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));

    // Update the app's current user
    setUser(session);
  };

  // ---------------- SAVE DELIVERY ADDRESS ----------------
  // Update the delivery address of the logged-in user
  const saveDeliveryAddress = async (deliveryAddress) => {

    // Do not allow address saving without login
    if (!user) throw new Error('Please sign in before saving a delivery address.');

    // Retrieve all registered users
    const users = await getUsers();

    // Find the matching account and update its address
    const updatedUsers = users.map((savedUser) => (
      savedUser.email === user.email
        ? { ...savedUser, deliveryAddress }
        : savedUser
    ));

    // Check whether the logged-in account exists in the users array
    if (!updatedUsers.some((savedUser) => savedUser.email === user.email)) {
      throw new Error('We could not find your account to save this address. Please sign in again.');
    }

    // Update the current user's session with the new address
    const updatedUser = { ...user, deliveryAddress };

    // Save the updated registered users list
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));

    // Save the updated login session
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));

    // Update React state so the new address appears in the app
    setUser(updatedUser);

    // Return the updated user object
    return updatedUser;
  };

  // ---------------- LOGOUT ----------------
  // Remove the saved login session
  const logout = async () => {
    await AsyncStorage.removeItem(SESSION_KEY);

    // Clear the current user from React state
    setUser(null);

    // Registered user accounts remain saved
  };

  // Share authentication functions and user data with all child screens
  return (
    <AuthContext.Provider
      value={{ user, signup, login, logout, saveDeliveryAddress }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to access authentication data in any screen
// Example: const { user, login } = useAuth();
export const useAuth = () => useContext(AuthContext);


// ==================================================
// CART: ADD, UPDATE, REMOVE AND SAVE PRODUCTS
// ==================================================

// Unique key used to save the shopping cart locally
const CART_KEY = '@blushly_cart';

// Create a separate context for cart information
const CartContext = createContext(null);

export function CartProvider({ children }) {

  // Stores all cart products and their quantities
  // Example: [{ id: 1, name: 'Lipstick', price: 500, qty: 1 }]
  const [items, setItems] = useState([]);

  // Tracks whether the previously saved cart has loaded
  // Prevents saving the initial empty cart before restoration finishes
  const [loaded, setLoaded] = useState(false);

  // ---------------- RESTORE CART ----------------
  // Runs once when the app opens
  useEffect(() => {
    const restore = async () => {
      try {
        // Read the previously saved cart
        const saved = await AsyncStorage.getItem(CART_KEY);

        // Restore saved products if the cart exists
        if (saved) setItems(JSON.parse(saved));

      } catch (e) {
        // Report any error while loading the cart
        console.log('Could not restore cart', e);
      }

      // Mark restoration as complete
      setLoaded(true);
    };

    restore();
  }, []);

  // ---------------- SAVE CART ----------------
  // Runs when items or loaded changes
  useEffect(() => {

    // Save only after the previous cart has finished loading
    if (loaded) {
      // Convert the cart array into JSON text and save it locally
      AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
    }

  }, [items, loaded]);

  // ---------------- ADD TO CART ----------------
  // Add a product, or increase its quantity if already present
  const addToCart = (product) => {
    setItems((prev) => {

      // Check whether this product is already in the cart
      const found = prev.find((i) => i.id === product.id);

      // If found, increase its quantity by one
      if (found) {
        return prev.map((i) =>
          i.id === product.id
            ? { ...i, qty: i.qty + 1 }
            : i
        );
      }

      // If new, add the product with quantity 1
      return [...prev, { ...product, qty: 1 }];
    });
  };

  // Increase the quantity of a product by one
  const increase = (id) => setItems((prev) =>
    prev.map((i) =>
      i.id === id ? { ...i, qty: i.qty + 1 } : i
    )
  );

  // Decrease quantity by one, but never below 1
  const decrease = (id) => setItems((prev) =>
    prev.map((i) =>
      i.id === id
        ? { ...i, qty: Math.max(1, i.qty - 1) }
        : i
    )
  );

  // Remove a product completely from the cart
  const removeItem = (id) => setItems((prev) =>
    prev.filter((i) => i.id !== id)
  );

  // Empty the entire shopping cart
  const clearCart = () => setItems([]);

  // Calculate total price of all products
  // Example: 500 * 2 + 300 * 1 = 1300
  const subtotal = items.reduce(
    (sum, i) => sum + i.price * i.qty,
    0
  );

  // Calculate the total number of units in the cart
  // Example: 2 lipsticks + 1 cream = 3 items
  const itemCount = items.reduce(
    (sum, i) => sum + i.qty,
    0
  );

  // Share cart data and functions with all child screens
  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        increase,
        decrease,
        removeItem,
        clearCart,
        subtotal,
        itemCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Custom hook to access cart data in any screen
// Example: const { items, addToCart } = useCart();
export const useCart = () => useContext(CartContext);
