// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBcJ-BynRkBcjbipd9mADliCgujRAbEilQ",
  authDomain: "leetcode-tracker-picay.firebaseapp.com",
  projectId: "leetcode-tracker-picay",
  storageBucket: "leetcode-tracker-picay.firebasestorage.app",
  messagingSenderId: "1069690253695",
  appId: "1:1069690253695:web:088d4819bbbe967205aa4a",
  measurementId: "G-CBPGR02D60"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Auth and Firestore references
const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

// Export for use in other files
const FirebaseService = {
  auth,
  db,
  provider,
  
  // Sign in with Google
  signInWithGoogle: async function() {
    try {
      const result = await auth.signInWithPopup(provider);
      return result.user;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  },
  
  // Sign out
  signOut: async function() {
    try {
      await auth.signOut();
      console.log("User signed out");
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  },
  
  // Get current user
  getCurrentUser: function() {
    return auth.currentUser;
  },
  
  // Sync user data with Firestore
  syncUserData: async function(userId, data, collection) {
    try {
      await db.collection('users').doc(userId).collection(collection).doc('data').set(data);
      return true;
    } catch (error) {
      console.error(`Error syncing ${collection} to Firestore:`, error);
      return false;
    }
  },
  
  // Get user data from Firestore
  getUserData: async function(userId, collection) {
    try {
      const doc = await db.collection('users').doc(userId).collection(collection).doc('data').get();
      if (doc.exists) {
        return doc.data();
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }
};