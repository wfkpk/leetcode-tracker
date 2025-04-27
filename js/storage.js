/**
 * Storage utilities for LeetCode tracker
 */
const Storage = {
  /**
   * Save problems to localStorage
   * @param {Array} problems - Array of problem objects
   * @returns {boolean} Success status
   */
  saveProblemList: function(problems) {
    try {
      if (!Array.isArray(problems)) {
        console.error('Invalid problems array:', problems);
        return false;
      }
      
      // Store the problems
      localStorage.setItem('leetcode-problems', JSON.stringify(problems));
      
      // Also update the nextId value to be one higher than the highest ID
      if (problems.length > 0) {
        const maxId = Math.max(...problems.map(p => p.id));
        localStorage.setItem('leetcode-nextId', maxId + 1);
      }
      

      return true;
    } catch (error) {
      console.error('Error saving problems to localStorage:', error);
      return false;
    }
  },
  
  /**
   * Get problems from localStorage
   * @returns {Array|null} Array of problem objects or null if not found
   */
  getProblems: function() {
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
   * Set problem completion status
   * @param {number} problemId - Problem ID
   * @param {boolean} isCompleted - Completion status
   */
  setProblemCompletion: function(problemId, isCompleted) {
    localStorage.setItem(`q${problemId}`, isCompleted);
  },
  
  /**
   * Add a retry problem
   * @param {number} problemId - Problem ID
   */
  addRetryProblem: function(problemId) {
    localStorage.setItem(`retry-${problemId}`, 'true');
  },
  
  /**
   * Remove a retry problem
   * @param {number} problemId - Problem ID
   */
  removeRetryProblem: function(problemId) {
    localStorage.removeItem(`retry-${problemId}`);
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
   * Get notes for a problem
   * @param {number} problemId - Problem ID
   * @returns {string|null} Notes text or null if not found
   */
  getNotes: function(problemId) {
    return localStorage.getItem(`notes_${problemId}`);
  },
  
  /**
   * Save notes for a problem
   * @param {number} problemId - Problem ID
   * @param {string} notes - Notes text
   */
  saveNotes: function(problemId, notes) {
    localStorage.setItem(`notes_${problemId}`, notes);
  },

  /**
   * Add activity to recent activities
   * @param {Object} activity - Activity object containing type and text
   */
  addActivity: function(activity) {
    try {
      const activities = this.getRecentActivities() || [];
      activities.unshift(activity); // Add to beginning
      
      // Keep only last 20 activities
      const trimmedActivities = activities.slice(0, 20);
      
      localStorage.setItem('leetcode-activities', JSON.stringify(trimmedActivities));
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
  }
};