/**
 * Authentication UI for LeetCode tracker
 */
const AuthUI = {
  /**
   * Initialize the auth UI
   */
  init: function() {
    this.renderAuthUI();
    this.setupAuthObserver();
    this.setupEventListeners();
  },
  
  /**
   * Render the auth UI components
   */
  renderAuthUI: function() {
    // Create login container if it doesn't exist
    if (!document.getElementById('auth-container')) {
      const container = document.createElement('div');
      container.id = 'auth-container';
      container.className = 'auth-container';
      
      // Insert at the top of the page, right after the heading
      const heading = document.querySelector('h1');
      heading.parentNode.insertBefore(container, heading.nextSibling);
      
      this.renderLoginState();
    }
  },
  
  /**
   * Render login state based on authentication status
   */
  renderLoginState: function() {
    const container = document.getElementById('auth-container');
    if (!container) return;
    
    const currentUser = FirebaseService.getCurrentUser();
    
    if (currentUser) {
      // User is logged in - show user info and logout button
      container.innerHTML = `
        <div class="auth-user-info">
          <div class="auth-user-profile">
            <img src="${currentUser.photoURL || 'img/default-avatar.png'}" alt="Profile" class="auth-avatar">
            <div class="auth-user-details">
              <span class="auth-username">${currentUser.displayName || 'User'}</span>
              <span class="auth-email">${currentUser.email}</span>
            </div>
          </div>
          <div class="auth-actions">
            <button id="sync-btn" class="sync-btn" title="Sync data">
              <i class="fas fa-sync-alt"></i> Sync
            </button>
            <button id="logout-btn" class="logout-btn">Sign Out</button>
          </div>
        </div>
        <div class="sync-status" id="sync-status"></div>
      `;
    } else {
      // User is not logged in - show login button
      container.innerHTML = `
        <div class="auth-login">
          <span class="auth-message">Sign in to sync your progress across devices</span>
          <button id="login-btn" class="login-btn">
            <i class="fab fa-google"></i> Sign in with Google
          </button>
        </div>
      `;
    }
    
    // Setup click handlers after rendering
    this.setupButtonHandlers();
  },
  
  /**
   * Set up click handlers for auth buttons
   */
  setupButtonHandlers: function() {
    // Login button
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', this.handleLogin.bind(this));
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', this.handleLogout.bind(this));
    }
    
    // Sync button
    const syncBtn = document.getElementById('sync-btn');
    if (syncBtn) {
      syncBtn.addEventListener('click', this.handleSync.bind(this));
    }
  },
  
  /**
   * Setup auth state change observer
   */
  setupAuthObserver: function() {
    FirebaseService.auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('User is signed in:', user.displayName);
        
        // Show syncing status
        this.showSyncStatus('Syncing data...', 'info');
        
        // Set user ID in Storage
        Storage.setCurrentUser(user.uid);
        
        // Ensure data consistency
        await Storage.ensureDataConsistency(true);
        
        // Update the UI to reflect any changes
        await ProblemManager.loadProblems();
        UI.displayProblems();
        UI.populateTopicFilters();
        UI.updateCompletionCounters();
        UI.updateRetryCount();
        
        // Show success message
        this.showSyncStatus('Data synced successfully!', 'success');
      } else {
        console.log('User is signed out');
        
        // Clear user ID in Storage
        Storage.clearCurrentUser();
        
        // Ensure data consistency for logout
        await Storage.ensureDataConsistency(false);
        
        // Reload the UI
        await ProblemManager.loadProblems();
        UI.displayProblems();
        UI.populateTopicFilters();
        UI.updateCompletionCounters();
        UI.updateRetryCount();
      }
      
      // Update the UI
      this.renderLoginState();
    });
  },
  
  /**
   * Handle login button click
   */
  handleLogin: async function() {
    try {
      await FirebaseService.signInWithGoogle();
      // Auth observer will handle the rest
    } catch (error) {
      console.error('Login error:', error);
      alert('Failed to sign in. Please try again.');
    }
  },
  
  /**
   * Handle logout button click
   */
  handleLogout: async function() {
    try {
      if (confirm('Are you sure you want to sign out?')) {
        await FirebaseService.signOut();
        // Auth observer will handle the rest
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to sign out. Please try again.');
    }
  },
  
  /**
   * Handle manual sync button click
   */
  handleSync: async function() {
    try {
      // Show syncing status
      this.showSyncStatus('Syncing data...', 'info');
      
      // First push local changes to Firestore
      await Storage.syncToFirestore();
      
      // Then pull any changes from Firestore
      await Storage.syncFromFirestore();
      
      // Reload the UI
      await ProblemManager.loadProblems();
      UI.displayProblems();
      UI.populateTopicFilters();
      UI.updateCompletionCounters();
      UI.updateRetryCount();
      
      // Show success message
      this.showSyncStatus('Data synced successfully!', 'success');
    } catch (error) {
      console.error('Sync error:', error);
      this.showSyncStatus('Sync failed. Please try again.', 'error');
    }
  },
  
  /**
   * Show sync status message
   * @param {string} message - Status message
   * @param {string} type - Message type ('info', 'success', 'error')
   */
  showSyncStatus: function(message, type = 'info') {
    const statusEl = document.getElementById('sync-status');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = `sync-status ${type}`;
    statusEl.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  },
  
  /**
   * Set up event listeners for auth-related events
   */
  setupEventListeners: function() {
    // Listen for storage changes (for multi-tab support)
    window.addEventListener('storage', (event) => {
      // If the current user changes in another tab, reload the page
      if (event.key === 'firebase:authUser') {
        window.location.reload();
      }
    });
  }
};