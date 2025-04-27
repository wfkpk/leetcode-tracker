/**
 * Main application for LeetCode tracker
 */
document.addEventListener('DOMContentLoaded', async () => {
  
  try {
    // Initialize syntax highlighting
    hljs.configure({
      languages: ['javascript', 'python', 'java', 'cpp', 'csharp']
    });
    
    // Initialize problem manager without clearing localStorage
    await ProblemManager.init();
    
    // Initialize UI
    UI.init();
    
  } catch (error) {
    console.error('Error initializing application:', error);
    alert('There was an error initializing the application. Please check the console for details.');
  }
});