/**
 * Storage utilities for LeetCode tracker
 */
const Storage = {
  // Current user ID from Firebase
  currentUserId: null,
  
  /**
   * Set the current user ID
   * @param {string} userId - Firebase user ID
   */
  setCurrentUser: function(userId) {
    this.currentUserId = userId;
  },
  
  /**
   * Clear the current user ID
   */
  clearCurrentUser: function() {
    this.currentUserId = null;
  },
  
  /**
   * Save problems to localStorage and Firestore if signed in
   * @param {Array} problems - Array of problem objects
   * @returns {boolean} Success status
   */
  saveProblemList: async function(problems) {
    try {
      if (!Array.isArray(problems)) {
        console.error('Invalid problems array:', problems);
        return false;
      }
      
      // Store the problems in localStorage
      localStorage.setItem('leetcode-problems', JSON.stringify(problems));
      
      // Also update the nextId value to be one higher than the highest ID
      if (problems.length > 0) {
        const maxId = Math.max(...problems.map(p => p.id));
        localStorage.setItem('leetcode-nextId', maxId + 1);
      }
      
      // If user is signed in, sync with Firestore
      if (this.currentUserId) {
        try {
          await FirebaseService.syncUserData(this.currentUserId, { problems }, 'problems');
          await FirebaseService.syncUserData(this.currentUserId, { nextId: localStorage.getItem('leetcode-nextId') }, 'config');
        } catch (error) {
          console.error('Error syncing problems to Firestore:', error);
          // Continue with local storage even if Firestore sync fails
        }
      }

      return true;
    } catch (error) {
      console.error('Error saving problems:', error);
      return false;
    }
  },
  
  /**
   * Get problems from localStorage or Firestore
   * @returns {Promise<Array|null>} Array of problem objects or null if not found
   */
  getProblems: async function() {
    // If signed in, try to get from Firestore first
    if (this.currentUserId) {
      try {
        const firestoreData = await FirebaseService.getUserData(this.currentUserId, 'problems');
        if (firestoreData && firestoreData.problems) {
          // Update local storage with Firestore data
          localStorage.setItem('leetcode-problems', JSON.stringify(firestoreData.problems));
          return firestoreData.problems;
        }
      } catch (error) {
        console.error('Error retrieving problems from Firestore:', error);
        // Fall back to localStorage if Firestore fails
      }
    }
    
    // Get from localStorage
    const storedProblems = localStorage.getItem('leetcode-problems');
    return storedProblems ? JSON.parse(storedProblems) : null;
  },
  
  /**
   * Check if a problem is marked as done
   * @param {number} problemId - Problem ID
   * @returns {boolean} True if problem is completed
   */
  isProblemCompleted: function(problemId) {
    return localStorage.getItem(`q${problemId}`) === 'true';
  },
  
  /**
   * Set problem completion status and sync if signed in
   * @param {number} problemId - Problem ID
   * @param {boolean} isCompleted - Completion status
   */
  setProblemCompletion: async function(problemId, isCompleted) {
    localStorage.setItem(`q${problemId}`, isCompleted);
    
    // If user is signed in, sync with Firestore
    if (this.currentUserId) {
      try {
        // Get all completion status
        const completions = {};
        ProblemManager.problems.forEach(problem => {
          completions[`q${problem.id}`] = this.isProblemCompleted(problem.id);
        });
        
        await FirebaseService.syncUserData(this.currentUserId, { completions }, 'completions');
      } catch (error) {
        console.error('Error syncing completion status to Firestore:', error);
      }
    }
  },
  
  /**
   * Add a retry problem and sync if signed in
   * @param {number} problemId - Problem ID
   */
  addRetryProblem: async function(problemId) {
    localStorage.setItem(`retry-${problemId}`, 'true');
    
    // If user is signed in, sync with Firestore
    if (this.currentUserId) {
      await this.syncRetryProblems();
    }
  },
  
  /**
   * Remove a retry problem and sync if signed in
   * @param {number} problemId - Problem ID
   */
  removeRetryProblem: async function(problemId) {
    localStorage.removeItem(`retry-${problemId}`);
    
    // If user is signed in, sync with Firestore
    if (this.currentUserId) {
      await this.syncRetryProblems();
    }
  },

  /**
   * Check if a problem is marked for retry
   * @param {number} problemId - Problem ID
   * @returns {boolean} True if problem is marked for retry
   */
  isRetryProblem: function(problemId) {
    return localStorage.getItem(`retry-${problemId}`) === 'true';
  },
  
  /**
   * Sync all retry problems to Firestore
   */
  syncRetryProblems: async function() {
    if (!this.currentUserId) return;
    
    try {
      // Collect all retry problems
      const retries = {};
      ProblemManager.problems.forEach(problem => {
        const key = `retry-${problem.id}`;
        if (localStorage.getItem(key) === 'true') {
          retries[key] = true;
        }
      });
      
      await FirebaseService.syncUserData(this.currentUserId, { retries }, 'retries');
    } catch (error) {
      console.error('Error syncing retry problems to Firestore:', error);
    }
  },

  /**
   * Get notes for a problem
   * @param {number} problemId - Problem ID
   * @returns {string|null} Notes text or null if not found
   */
  getNotes: function(problemId) {
    return localStorage.getItem(`notes_${problemId}`);
  },
  
  /**
   * Save notes for a problem and sync if signed in
   * @param {number} problemId - Problem ID
   * @param {string} notes - Notes text
   */
  saveNotes: async function(problemId, notes) {
    localStorage.setItem(`notes_${problemId}`, notes);
    
    // If user is signed in, sync with Firestore
    if (this.currentUserId) {
      await this.syncAllNotes();
    }
  },
  
  /**
   * Sync all notes to Firestore
   */
  syncAllNotes: async function() {
    if (!this.currentUserId) return;
    
    try {
      // Collect all notes
      const notes = {};
      ProblemManager.problems.forEach(problem => {
        const noteContent = this.getNotes(problem.id);
        if (noteContent) {
          notes[`notes_${problem.id}`] = noteContent;
        }
      });
      
      await FirebaseService.syncUserData(this.currentUserId, { notes }, 'notes');
    } catch (error) {
      console.error('Error syncing notes to Firestore:', error);
    }
  },

  /**
   * Add activity to recent activities and sync if signed in
   * @param {Object} activity - Activity object containing type and text
   */
  addActivity: async function(activity) {
    try {
      const activities = this.getRecentActivities() || [];
      activities.unshift(activity); // Add to beginning
      
      // Keep only last 20 activities
      const trimmedActivities = activities.slice(0, 20);
      
      localStorage.setItem('leetcode-activities', JSON.stringify(trimmedActivities));
      
      // If user is signed in, sync with Firestore
      if (this.currentUserId) {
        await FirebaseService.syncUserData(this.currentUserId, { activities: trimmedActivities }, 'activities');
      }
      
      return true;
    } catch (error) {
      console.error('Error saving activity:', error);
      return false;
    }
  },

  /**
   * Get recent activities
   * @returns {Array} Array of activity objects
   */
  getRecentActivities: function() {
    try {
      const activities = localStorage.getItem('leetcode-activities');
      return activities ? JSON.parse(activities) : [];
    } catch (error) {
      console.error('Error retrieving activities:', error);
      return [];
    }
  },
  
  /**
   * Sync all data from Firestore to localStorage
   */
  syncFromFirestore: async function() {
    if (!this.currentUserId) return;
    
    try {
      // Sync problems
      const problemsData = await FirebaseService.getUserData(this.currentUserId, 'problems');
      if (problemsData && problemsData.problems) {
        localStorage.setItem('leetcode-problems', JSON.stringify(problemsData.problems));
      }
      
      // Sync config (nextId)
      const configData = await FirebaseService.getUserData(this.currentUserId, 'config');
      if (configData && configData.nextId) {
        localStorage.setItem('leetcode-nextId', configData.nextId);
      }
      
      // Sync completions
      const completionsData = await FirebaseService.getUserData(this.currentUserId, 'completions');
      if (completionsData && completionsData.completions) {
        // Clear existing completion status first
        ProblemManager.problems.forEach(problem => {
          localStorage.removeItem(`q${problem.id}`);
        });
        
        // Set completions from Firestore
        Object.entries(completionsData.completions).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
      }
      
      // Sync retries
      const retriesData = await FirebaseService.getUserData(this.currentUserId, 'retries');
      if (retriesData && retriesData.retries) {
        // Clear existing retries first
        ProblemManager.problems.forEach(problem => {
          localStorage.removeItem(`retry-${problem.id}`);
        });
        
        // Set retries from Firestore
        Object.entries(retriesData.retries).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
      }
      
      // Sync notes
      const notesData = await FirebaseService.getUserData(this.currentUserId, 'notes');
      if (notesData && notesData.notes) {
        // Set notes from Firestore
        Object.entries(notesData.notes).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
      }
      
      // Sync activities
      const activitiesData = await FirebaseService.getUserData(this.currentUserId, 'activities');
      if (activitiesData && activitiesData.activities) {
        localStorage.setItem('leetcode-activities', JSON.stringify(activitiesData.activities));
      }
      
      return true;
    } catch (error) {
      console.error('Error syncing data from Firestore:', error);
      return false;
    }
  },
  
  /**
   * Sync all data from localStorage to Firestore
   */
  syncToFirestore: async function() {
    if (!this.currentUserId) return;
    
    try {
      // Sync problems
      const problems = JSON.parse(localStorage.getItem('leetcode-problems') || '[]');
      await FirebaseService.syncUserData(this.currentUserId, { problems }, 'problems');
      
      // Sync config
      const nextId = localStorage.getItem('leetcode-nextId');
      await FirebaseService.syncUserData(this.currentUserId, { nextId }, 'config');
      
      // Collect and sync completions
      const completions = {};
      ProblemManager.problems.forEach(problem => {
        completions[`q${problem.id}`] = this.isProblemCompleted(problem.id);
      });
      await FirebaseService.syncUserData(this.currentUserId, { completions }, 'completions');
      
      // Collect and sync retries
      await this.syncRetryProblems();
      
      // Collect and sync notes
      await this.syncAllNotes();
      
      // Sync activities
      const activities = this.getRecentActivities();
      await FirebaseService.syncUserData(this.currentUserId, { activities }, 'activities');
      
      return true;
    } catch (error) {
      console.error('Error syncing data to Firestore:', error);
      return false;
    }
  },

  /**
   * Ensure data consistency after login/logout
   * @param {boolean} isLogin - Whether this is a login or logout event
   */
  ensureDataConsistency: async function(isLogin) {
    try {
      if (isLogin) {
        // On login: First check if user has any data in Firestore
        const firestoreData = await FirebaseService.getUserData(this.currentUserId, 'problems');
        const localData = JSON.parse(localStorage.getItem('leetcode-problems') || '[]');
        
        if (firestoreData && firestoreData.problems && firestoreData.problems.length > 0) {
          
          // Verify if Firestore data has all the standard problems
          if (ProblemManager.serverProblems && ProblemManager.serverProblems.length > 0) {
            const firestoreIds = new Set(firestoreData.problems.map(p => p.id));
            const standardIds = new Set(ProblemManager.serverProblems.map(p => p.id));
            
            // Check if any standard problems are missing
            let missingStandardProblems = false;
            for (const id of standardIds) {
              if (!firestoreIds.has(id)) {
                missingStandardProblems = true;
                break;
              }
            }
            
            if (missingStandardProblems) {
              
              // Merge Firestore data with standard problems
              const mergedProblems = [...firestoreData.problems];
              const firestoreIdsSet = new Set(firestoreData.problems.map(p => p.id));
              
              // Add any missing standard problems
              ProblemManager.serverProblems.forEach(problem => {
                if (!firestoreIdsSet.has(problem.id)) {
                  mergedProblems.push(problem);
                }
              });
              
              // Use merged data
              localStorage.setItem('leetcode-problems', JSON.stringify(mergedProblems));
              await FirebaseService.syncUserData(this.currentUserId, { problems: mergedProblems }, 'problems');
            } else {
              // Use Firestore data as the source of truth
              localStorage.setItem('leetcode-problems', JSON.stringify(firestoreData.problems));
            }
          } else {
            // Use Firestore data as is
            localStorage.setItem('leetcode-problems', JSON.stringify(firestoreData.problems));
          }
          
          // Get all other data from Firestore
          await this.syncFromFirestore();
        } else {
          
          // Upload local data to Firestore
          await this.syncToFirestore();
        }
      } else {
        // On logout: Ensure local data has all standard problems
        if (ProblemManager.serverProblems && ProblemManager.serverProblems.length > 0) {
          const localData = JSON.parse(localStorage.getItem('leetcode-problems') || '[]');
          const localIds = new Set(localData.map(p => p.id));
          
          let changed = false;
          // Add any missing standard problems
          ProblemManager.serverProblems.forEach(problem => {
            if (!localIds.has(problem.id)) {
              localData.push(problem);
              changed = true;
            }
          });
          
          if (changed) {
            localStorage.setItem('leetcode-problems', JSON.stringify(localData));
          }
        }
      }
      
      
      // Reload the problems to apply any changes
      return await ProblemManager.loadProblems();
    } catch (error) {
      return false;
    }
  },

  /**
   * Reset completion states based on the current problems list
   */
  resetCompletionStates: function() {
    // Clear any stale completion data
    const allKeys = Object.keys(localStorage);
    
    // Reset problem completion states
    allKeys.forEach(key => {
      if (key.startsWith('q') && !isNaN(key.substring(1))) {
        // This is a problem completion marker
        const problemId = parseInt(key.substring(1));
        
        // Check if problem exists in current problem set
        if (!ProblemManager.getProblemById(problemId)) {
          localStorage.removeItem(key);
        }
      }
    });
    
    // Reset retry states
    allKeys.forEach(key => {
      if (key.startsWith('retry-')) {
        const problemId = parseInt(key.substring(6));
        
        // Check if problem exists in current problem set
        if (!ProblemManager.getProblemById(problemId)) {
          localStorage.removeItem(key);
        }
      }
    });
  }
};