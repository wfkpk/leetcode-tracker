/**
 * Problem data handling for LeetCode tracker
 */
const ProblemManager = {
  problems: [],
  nextId: 1,
  currentProblemId: null,
  
  /**
   * Initialize the Problem Manager
   */
  init: async function() {
    try {
      // Always load fresh problems from server first
      await this.loadProblemsFromServer();
      
      // Then load any user-specific data
      await this.loadProblems();
      
      // Set the nextId based on localStorage or the highest ID + 1
      const storedNextId = localStorage.getItem('leetcode-nextId');
      if (storedNextId) {
        this.nextId = parseInt(storedNextId);
      } else if (this.problems.length > 0) {
        // Calculate the max ID and add 1
        this.nextId = Math.max(...this.problems.map(p => p.id)) + 1;
      } else {
        this.nextId = 1;
      }
      
      return true;
    } catch (error) {
      console.error("Error initializing ProblemManager:", error);
      return false;
    }
  },
  
  /**
   * Load base problems from server (standard problems list)
   */
  loadProblemsFromServer: async function() {
    try {
      const response = await fetch('problems.json');
      
      if (!response.ok) {
        throw new Error('Failed to fetch problems from server');
      }
      
      const data = await response.json();
      if (!data.problems || !Array.isArray(data.problems)) {
        throw new Error('Invalid problems data format');
      }
      
      // Store server problems in a separate property
      this.serverProblems = data.problems;
      
      // If no problems in localStorage, use server problems as default
      if (!localStorage.getItem('leetcode-problems')) {
        this.problems = [...this.serverProblems];
        await Storage.saveProblemList(this.problems);
      }
    } catch (error) {
      console.error('Error loading problems from server:', error);
      this.serverProblems = [];
    }
  },
  
  /**
   * Load problems from localStorage or Firestore
   */
  loadProblems: async function() {
    try {
      // Try to load from localStorage/Firestore
      const storedProblems = await Storage.getProblems();
      if (storedProblems && storedProblems.length > 0) {
        this.problems = storedProblems;
        
        // Ensure all standard problems are included
        if (this.serverProblems && this.serverProblems.length > 0) {
          // Find standard problems that aren't in the user's problem list
          const standardIds = new Set(this.serverProblems.map(p => p.id));
          const userIds = new Set(this.problems.map(p => p.id));
          
          // Add any missing standard problems
          this.serverProblems.forEach(problem => {
            if (!userIds.has(problem.id)) {
              this.problems.push(problem);
            }
          });
          
          // Save the updated problem list
          await Storage.saveProblemList(this.problems);
        }
        
        // Reset completion states to ensure consistency
        Storage.resetCompletionStates();
        return;
      }
      
      // If we reach here and have server problems, use those
      if (this.serverProblems && this.serverProblems.length > 0) {
        this.problems = [...this.serverProblems];
        
        // Save the initial problems to localStorage
        await Storage.saveProblemList(this.problems);
      } else {
        // Last resort: try to load directly from JSON file
        const response = await fetch('problems.json');
        
        if (!response.ok) {
          throw new Error('Failed to fetch problems from server');
        }
        
        const data = await response.json();
        if (!data.problems || !Array.isArray(data.problems)) {
          throw new Error('Invalid problems data format');
        }
        
        this.problems = data.problems;
        
        // Save the initial problems to localStorage
        await Storage.saveProblemList(this.problems);
      }
    } catch (error) {
      console.error('Error loading problems:', error);
      this.problems = this.serverProblems || [];
    }
  },
  
  /**
   * Add a new problem
   * @param {object} problemData - Problem data object
   * @returns {Promise<object>} The newly created problem
   */
  addProblem: async function(problemData) {
    try {
      
      // Create the problem object
      const newProblem = {
        id: this.nextId,
        title: problemData.title,
        url: problemData.url,
        topics: problemData.topics || [],
        difficulty: problemData.difficulty || 'Easy',
        hint: problemData.hint || '',
        isBlind75: false // User-added problems are not part of Blind 75
      };
      
      // Add to the problems array
      this.problems.push(newProblem);
      
      // Increment nextId for future problems
      this.nextId++;
      
      // Save both the problems and the nextId to localStorage and Firestore
      const saveResult = await Storage.saveProblemList(this.problems);
      
      if (!saveResult) {
        throw new Error('Failed to save problem');
      }
      
      return newProblem;
    } catch (error) {
      console.error('Error adding problem:', error);
      alert('Failed to add problem. Please try again.');
      return null;
    }
  },
  
  /**
   * Update an existing problem
   * @param {number} id - Problem ID
   * @param {object} updatedData - Updated problem data
   * @returns {Promise<boolean>} Success status
   */
  updateProblem: async function(id, updatedData) {
    try {
      // Convert id to number if it's a string
      id = parseInt(id);
      
      const index = this.problems.findIndex(p => p.id === id);
      
      if (index === -1) {
        console.error('Problem not found:', id);
        return false;
      }
      
      // Update the problem properties
      this.problems[index] = {
        ...this.problems[index], // Keep existing properties
        ...updatedData,          // Override with updated data
        id: id                   // Ensure ID remains the same
      };
      
      // Save to localStorage and Firestore for persistence
      const saveResult = await Storage.saveProblemList(this.problems);
      
      if (!saveResult) {
        throw new Error('Failed to save to localStorage or Firestore');
      }
      
      return true;
    } catch (error) {
      console.error('Error in updateProblem:', error);
      return false;
    }
  },
  
  /**
   * Delete a problem
   * @param {number} id - Problem ID
   * @returns {Promise<boolean>} Success status
   */
  deleteProblem: async function(id) {
    const index = this.problems.findIndex(p => p.id === id);
    
    if (index === -1) return false;
    
    // Only allow deleting non-Blind75 problems
    if (this.problems[index].isBlind75) return false;
    
    // Remove the problem
    this.problems.splice(index, 1);
    
    // Save to localStorage and Firestore for persistence
    try {
      await Storage.saveProblemList(this.problems);
      return true;
    } catch (error) {
      console.error('Error deleting problem:', error);
      return false;
    }
  },
  
  /**
   * Get all unique topics from problems
   * @returns {Array} Sorted array of unique topics
   */
  getAllTopics: function() {
    const allTopics = new Set();
    if (this.problems && this.problems.length > 0) {
      this.problems.forEach(problem => {
        if (problem.topics && Array.isArray(problem.topics)) {
          problem.topics.forEach(topic => allTopics.add(topic));
        }
      });
    }
    
    return Array.from(allTopics).sort();
  },
  
  /**
   * Get problem by ID
   * @param {number} id - Problem ID
   * @returns {object|null} Problem object or null if not found
   */
  getProblemById: function(id) {
    if (!this.problems || !Array.isArray(this.problems)) return null;
    return this.problems.find(p => p.id === id) || null;
  },
  
  /**
   * Count completed problems
   * @param {boolean} onlyBlind75 - Whether to only count Blind 75 problems
   * @returns {number} Count of completed problems
   */
  countCompleted: function(onlyBlind75 = false) {
    if (!this.problems || !Array.isArray(this.problems)) return 0;
    
    const filteredProblems = onlyBlind75 
      ? this.problems.filter(p => p.isBlind75) 
      : this.problems;
      
    return filteredProblems.filter(p => Storage.isProblemCompleted(p.id)).length;
  },
  
  /**
   * Count retry problems
   * @returns {number} Count of problems marked for retry
   */
  countRetryProblems: function() {
    if (!this.problems || !Array.isArray(this.problems)) return 0;
    return this.problems.filter(p => Storage.isRetryProblem(p.id)).length;
  },
  
  /**
   * Get next available ID for a new problem
   * @returns {number} Next available ID
   */
  getNextId: function() {
    return this.nextId;
  }
};