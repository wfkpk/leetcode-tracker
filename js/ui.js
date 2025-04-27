/**
 * UI handling for LeetCode tracker
 */
const UI = {
  /**
   * Initialize the UI
   */
  init: function() {
    console.log('Initializing UI...');
    this.initEventListeners();
    this.displayProblems();
    this.populateTopicFilters();
    this.updateCompletionCounters();
    this.updateRetryCount();
    console.log('UI initialized');
  },
  
  /**
   * Initialize event listeners
   */
  initEventListeners: function() {
    
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.openTab(tab.dataset.tab);
      });
    });
    
    // Add problem button
    const addProblemBtn = document.getElementById('add-problem-btn');
    if (addProblemBtn) {
      addProblemBtn.addEventListener('click', () => {
        this.addNewProblem('all');
      });
    }
    
    // Filter change events
    const topicFilter = document.getElementById('topic-filter');
    if (topicFilter) {
      topicFilter.addEventListener('change', () => {
        this.filterByTopic();
      });
    }
    
    const difficultyFilter = document.getElementById('difficulty-filter');
    if (difficultyFilter) {
      difficultyFilter.addEventListener('change', () => {
        this.filterByTopic();
      });
    }
    
    const retryFilter = document.getElementById('retry-filter');
    if (retryFilter) {
      retryFilter.addEventListener('change', () => {
        this.filterByTopic();
      });
    }
    
    const blind75TopicFilter = document.getElementById('blind75-topic-filter');
    if (blind75TopicFilter) {
      blind75TopicFilter.addEventListener('change', () => {
        this.filterByTopic('blind75');
      });
    }
    
    const blind75DifficultyFilter = document.getElementById('blind75-difficulty-filter');
    if (blind75DifficultyFilter) {
      blind75DifficultyFilter.addEventListener('change', () => {
        this.filterByTopic('blind75');
      });
    }
    
    // Table header sorting
    document.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const sortIndex = parseInt(th.dataset.sort);
        const tableId = th.closest('table').id;
        this.sortTable(sortIndex, tableId);
      });
    });
    
    // Modal close buttons
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
      closeBtn.addEventListener('click', () => {
        closeBtn.closest('.modal').style.display = 'none';
      });
    });
    
    // Save notes button
    const saveNotesBtn = document.getElementById('save-notes-btn');
    if (saveNotesBtn) {
      saveNotesBtn.addEventListener('click', () => {
        this.saveNotes();
      });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
      if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
      }
    });
    
    // Notes modal tab functionality
    document.querySelectorAll('.notes-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        // Toggle active class on tabs
        document.querySelectorAll('.notes-tab').forEach(t => {
          t.classList.remove('active');
        });
        tab.classList.add('active');
        
        // Toggle tab content
        document.querySelectorAll('.notes-tab-content').forEach(content => {
          content.classList.remove('active');
        });
        
        const tabName = tab.dataset.tab;
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // Update preview if
        if (tabName === 'preview') {
          this.updateMarkdownPreview();
        }
      });
    });
    
    // Handle "Got it" button in hint modal
    const closeHintBtn = document.querySelector('.close-hint-btn');
    if (closeHintBtn) {
      closeHintBtn.addEventListener('click', () => {
        document.getElementById('hintModal').style.display = 'none';
      });
    }
    
    // Handle Cancel button in Notes modal
    document.querySelector('.btn-cancel').addEventListener('click', function() {
      document.getElementById('notesModal').style.display = 'none';
    });
    
  },
  
  /**
   * Display problems in tables
   */
  displayProblems: function() {
    
    if (!ProblemManager.problems || !Array.isArray(ProblemManager.problems)) {
      console.error('Problems array is not valid:', ProblemManager.problems);
      return;
    }
    
    const allTable = document.getElementById('all-problems-table');
    const blind75Table = document.getElementById('blind75-table');
    
    if (!allTable || !blind75Table) {
      console.error('Could not find tables');
      return;
    }
    
    // Clear tables except headers
    while (allTable.rows.length > 1) {
      allTable.deleteRow(1);
    }
    
    while (blind75Table.rows.length > 1) {
      blind75Table.deleteRow(1);
    }
    
    
    // Filter problems for each table
    const userAddedProblems = ProblemManager.problems.filter(p => !p.isBlind75);
    const blind75Problems = ProblemManager.problems.filter(p => p.isBlind75);
    
    
    // Add problems to their respective tables
    userAddedProblems.forEach(problem => {
      this.addProblemToTable(problem, allTable);
    });
    
    blind75Problems.forEach(problem => {
      this.addProblemToTable(problem, blind75Table);
    });
    
    // Update completion counters
    this.updateCompletionCounters();
  },
  
  /**
   * Add a problem to a table
   * @param {object} problem - Problem object
   * @param {HTMLElement} table - Table element
   */
  addProblemToTable: function(problem, table) {
    try {
      if (!problem || !table) return;
      
      const row = table.insertRow();
      
      // Problem title with link
      const titleCell = row.insertCell();
      const link = document.createElement('a');
      link.href = problem.url;
      link.textContent = problem.title;
      link.target = "_blank";
      titleCell.appendChild(link);
      
      // Topics
      const topicsCell = row.insertCell();
      if (problem.topics && Array.isArray(problem.topics)) {
        problem.topics.forEach(topic => {
          const pill = document.createElement('span');
          pill.className = 'pill';
          pill.textContent = topic;
          topicsCell.appendChild(pill);
        });
      }
      
      // Difficulty
      const difficultyCell = row.insertCell();
      difficultyCell.textContent = problem.difficulty || "Unknown";
      
      // Checkbox
      const checkboxCell = row.insertCell();
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `q${problem.id}`;
      checkbox.checked = Storage.isProblemCompleted(problem.id);
      checkbox.addEventListener('change', () => {
        Storage.setProblemCompletion(problem.id, checkbox.checked);
        
        // Update checkboxes with the same ID in other tables
        document.querySelectorAll(`#${checkbox.id}`).forEach(cb => {
          if (cb !== checkbox) {
            cb.checked = checkbox.checked;
          }
        });
        
        // Update the completion counters
        this.updateCompletionCounters();
      });
      checkboxCell.appendChild(checkbox);
      
      // Retry button
      const retryCell = row.insertCell();
      const retryBtn = document.createElement('button');
      retryBtn.className = 'retry-btn';
      retryBtn.dataset.problemid = problem.id; // Store problem ID as data attribute
      const isRetry = Storage.isRetryProblem(problem.id);
      retryBtn.textContent = isRetry ? 'Retry' : 'Good';
      if (isRetry) {
        retryBtn.classList.add('active');
      }
      retryBtn.addEventListener('click', () => {
        this.toggleRetry(problem.id);
      });
      retryCell.appendChild(retryBtn);
      
      // Notes button
      const notesCell = row.insertCell();
      const notesBtn = document.createElement('button');
      notesBtn.className = 'note-btn';
      notesBtn.dataset.problemid = problem.id; // Store problem ID as data attribute
      notesBtn.textContent = 'Notes';
      notesBtn.addEventListener('click', () => {
        this.openNotes(problem.id);
      });
      notesCell.appendChild(notesBtn);
      
      // Hint button
      const hintCell = row.insertCell();
      const hintBtn = document.createElement('button');
      hintBtn.className = 'hint-btn';
      hintBtn.textContent = 'Hint';
      hintBtn.addEventListener('click', () => {
        this.showHint(problem.id);
      });
      hintCell.appendChild(hintBtn);
      
      // Add edit button - only allow editing for non-Blind75 problems
      const actionsCell = row.insertCell();
      const actionsWrapper = document.createElement('div');
      actionsWrapper.className = 'action-buttons';
      
      // Only show edit/delete for non-Blind75 problems
      if (!problem.isBlind75) {
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.dataset.problemid = problem.id;
        editBtn.innerHTML = '<i class="fa fa-edit"></i> Edit';
        editBtn.title = 'Edit problem';
        editBtn.addEventListener('click', () => {
          this.editProblem(problem.id);
        });
        actionsWrapper.appendChild(editBtn);
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.dataset.problemid = problem.id;
        deleteBtn.innerHTML = '<i class="fa fa-trash"></i> Delete';
        deleteBtn.title = 'Delete problem';
        deleteBtn.addEventListener('click', () => {
          this.deleteProblem(problem.id);
        });
        actionsWrapper.appendChild(deleteBtn);
      } else {
        // Display a message for Blind75 problems
        const lockIcon = document.createElement('span');
        lockIcon.className = 'locked-icon';
        lockIcon.title = 'Blind 75 problems cannot be edited or deleted';
        lockIcon.innerHTML = '<i class="fa fa-lock"></i>';
        actionsWrapper.appendChild(lockIcon);
      }
      
      actionsCell.appendChild(actionsWrapper);
      
      // Highlight notes button if there are notes
      this.highlightNotesButton(problem.id);
    } catch (error) {
      console.error('Error adding problem to table:', error, problem);
    }
  },
  
  /**
   * Show hint for a problem
   * @param {number} problemId - Problem ID
   */
  showHint: function(problemId) {
    const modal = document.getElementById('hintModal');
    const hintContent = document.getElementById('hintContent');
    const modalTitle = document.getElementById('hint-modal-title');
    const problem = ProblemManager.getProblemById(problemId);
    
    if (!problem) return;
    
    // Set title with icon
    modalTitle.innerHTML = '<i class="fas fa-lightbulb"></i> Hint for ' + problem.title;
    
    // Set content and ensure it's centered
    hintContent.textContent = problem.hint || "No hint available for this problem.";
    
    // Display the modal
    modal.style.display = 'block';
    
    // Make sure the Got It button works - using direct onclick handler
    const closeHintBtn = document.querySelector('.close-hint-btn');
    if (closeHintBtn) {
      closeHintBtn.onclick = function() {
        modal.style.display = 'none';
      };
    }
    
    // Also ensure the X button works
    const closeX = modal.querySelector('.close');
    if (closeX) {
      closeX.onclick = function() {
        modal.style.display = 'none';
      };
    }
    
    // Close on outside click
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = 'none';
      }
    };
  },
  
  /**
   * Toggle retry status for a problem
   * @param {number} problemId - Problem ID
   */
  toggleRetry: function(problemId) {
    // Get the button that was clicked
    const retryBtns = document.querySelectorAll(`.retry-btn[data-problemid="${problemId}"]`);
    const isRetry = Storage.isRetryProblem(problemId);
    
    // Toggle retry status in storage
    if (isRetry) {
      Storage.removeRetryProblem(problemId);
    } else {
      Storage.addRetryProblem(problemId);
    }
    
    // Update button appearance (ensure it happens synchronously)
    retryBtns.forEach(btn => {
      if (!isRetry) {
        // Was "Good", now "Retry" - turn red
        btn.classList.add('active');
        btn.textContent = 'Retry';
        btn.style.cssText = 'background-color: #f44336 !important; color: white !important;';
      } else {
        // Was "Retry", now "Good" - turn back to green
        btn.classList.remove('active');
        btn.textContent = 'Good';
        btn.style.cssText = 'background-color: #4caf50 !important; color: white !important;';
      }
    });
    
    // Update retry counter
    this.updateRetryCount();
    this.filterByTopic();
  },
  
  /**
   * Open the notes modal for a problem
   * @param {number} problemId - Problem ID
   */
  openNotes: function(problemId) {
    const modal = document.getElementById('notesModal');
    const notesContent = document.getElementById('notesContent');
    const modalTitle = document.getElementById('modal-title');
    const problem = ProblemManager.getProblemById(problemId);
    
    if (!problem) return;
    
    modalTitle.textContent = `Notes for ${problem.title}`;
    ProblemManager.currentProblemId = problemId;
    
    // Load existing notes if they exist
    const notes = Storage.getNotes(problemId);
    notesContent.value = notes || '';
    
    // Initial preview update
    this.updateMarkdownPreview();
    
    // Add input event listener for live preview
    notesContent.addEventListener('input', () => {
      this.updateMarkdownPreview();
    });
    
    // Display the modal
    modal.style.display = 'block';
  },
  
  /**
   * Update the markdown preview
   */
  updateMarkdownPreview: function() {
    const notesContent = document.getElementById('notesContent');
    const markdownPreview = document.getElementById('markdownPreview');
    
    if (!notesContent || !markdownPreview) return;
    
    const rawMarkdown = notesContent.value;
    
    // Use marked.js to parse markdown
    markdownPreview.innerHTML = marked.parse(rawMarkdown);
    
    // Apply syntax highlighting to code blocks
    document.querySelectorAll('#markdownPreview pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
  },
  
  /**
   * Save notes for the current problem
   */
  saveNotes: function() {
    if (ProblemManager.currentProblemId) {
      const notesContent = document.getElementById('notesContent').value;
      Storage.saveNotes(ProblemManager.currentProblemId, notesContent);
      this.highlightNotesButton(ProblemManager.currentProblemId);
      document.getElementById('notesModal').style.display = 'none';
    }
  },
  
  /**
   * Highlight buttons for problems that have notes
   * @param {number} problemId - Problem ID
   */
  highlightNotesButton: function(problemId) {
    const notes = Storage.getNotes(problemId);
    const noteBtns = document.querySelectorAll(`.note-btn[data-problemid="${problemId}"]`);
    
    noteBtns.forEach(btn => {
      if (notes && notes.trim() !== '') {
        btn.classList.add('has-notes');
      } else {
        btn.classList.remove('has-notes');
      }
    });
  },
  
  /**
   * Open a tab
   * @param {string} tabName - Tab name ('all' or 'blind75')
   */
  openTab: function(tabName) {
    // Hide all tab contents
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
      tabContents[i].classList.remove('active');
    }
    
    // Deactivate all tabs
    const tabs = document.getElementsByClassName('tab');
    for (let i = 0; i < tabs.length; i++) {
      tabs[i].classList.remove('active');
    }
    
    // Show the selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Find and activate the clicked tab
    const clickedTab = Array.from(tabs).find(tab => tab.dataset.tab === tabName);
    if (clickedTab) clickedTab.classList.add('active');
  },
  
  /**
   * Filter problems by topic, difficulty, and retry status
   * @param {string} tabName - Tab name ('all' or 'blind75')
   */
  filterByTopic: function(tabName = 'all') {
    const tableId = tabName === 'blind75' ? 'blind75-table' : 'all-problems-table';
    const table = document.getElementById(tableId);
    const topicFilter = document.getElementById(tabName === 'blind75' ? 'blind75-topic-filter' : 'topic-filter').value;
    const difficultyFilter = document.getElementById(tabName === 'blind75' ? 'blind75-difficulty-filter' : 'difficulty-filter').value;
    const retryFilter = document.getElementById(tabName === 'blind75' ? 'blind75-retry-filter' : 'retry-filter');
    
    // Get all rows except header
    const rows = Array.from(table.rows).slice(1);
    
    rows.forEach(row => {
      let showRow = true;
      
      // Check topic filter
      if (topicFilter !== 'all') {
        const topicPills = row.cells[1].querySelectorAll('.pill');
        const topics = Array.from(topicPills).map(pill => pill.textContent);
        if (!topics.includes(topicFilter)) {
          showRow = false;
        }
      }
      
      // Check difficulty filter
      if (difficultyFilter !== 'all') {
        const difficulty = row.cells[2].textContent;
        if (difficulty !== difficultyFilter) {
          showRow = false;
        }
      }
      
      // Check retry filter
      if (retryFilter && retryFilter.checked) {
        const problemId = parseInt(row.cells[3].querySelector('input').id.substring(1)); // Remove the 'q' prefix
        if (!Storage.isRetryProblem(problemId)) {
          showRow = false;
        }
      }
      
      // Show or hide row
      row.style.display = showRow ? '' : 'none';
    });
  },
  
  /**
   * Populate topic filters
   */
  populateTopicFilters: function() {
    const topics = ProblemManager.getAllTopics();
    
    // Update both filter dropdowns
    this.updateTopicDropdown('topic-filter', topics);
    this.updateTopicDropdown('blind75-topic-filter', topics);
  },
  
  /**
   * Update a topic dropdown with provided topics
   * @param {string} dropdownId - Dropdown element ID
   * @param {Array} topics - Array of topic names
   */
  updateTopicDropdown: function(dropdownId, topics) {
    const dropdown = document.getElementById(dropdownId);
    
    // Keep the "All Topics" option
    while (dropdown.options.length > 1) {
      dropdown.remove(1);
    }
    
    // Add new topic options
    topics.forEach(topic => {
      const option = document.createElement('option');
      option.value = topic;
      option.textContent = topic;
      dropdown.appendChild(option);
    });
  },
  
  /**
   * Sort a table by column
   * @param {number} columnIndex - Column index to sort by
   * @param {string} tableId - Table element ID
   */
  sortTable: function(columnIndex, tableId) {
    const table = document.getElementById(tableId);
    let switching = true;
    let direction = "asc";
    let switchcount = 0;
    
    while (switching) {
      switching = false;
      const rows = table.rows;
      
      for (let i = 1; i < (rows.length - 1); i++) {
        let shouldSwitch = false;
        const x = rows[i].getElementsByTagName("TD")[columnIndex];
        const y = rows[i + 1].getElementsByTagName("TD")[columnIndex];
        
        // For checkbox column, compare checked status
        if (columnIndex === 3) {
          const xChecked = x.querySelector('input[type="checkbox"]').checked;
          const yChecked = y.querySelector('input[type="checkbox"]').checked;
          
          if (direction === "asc") {
            shouldSwitch = !xChecked && yChecked;
          } else {
            shouldSwitch = xChecked && !yChecked;
          }
        } 
        // For text columns
        else {
          const xText = x.textContent.toLowerCase();
          const yText = y.textContent.toLowerCase();
          
          if (direction === "asc") {
            shouldSwitch = xText > yText;
          } else {
            shouldSwitch = xText < yText;
          }
        }
        
        if (shouldSwitch) {
          rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
          switching = true;
          switchcount++;
        }
      }
      
      if (switchcount === 0 && direction === "asc") {
        direction = "desc";
        switching = true;
      }
    }
  },
  
  /**
   * Update the completion counters and progress bars
   */
  updateCompletionCounters: function() {
    try {
      const allCompleted = ProblemManager.countCompleted();
      const allTotal = ProblemManager.problems.length;
      const blind75Completed = ProblemManager.countCompleted(true);
      
      // Update the counter displays
      document.getElementById('all-completed').textContent = allCompleted;
      document.getElementById('all-total').textContent = allTotal;
      document.getElementById('blind75-completed').textContent = blind75Completed;
      
      // Update progress bars
      if (allTotal > 0) {
        const allProgressPercent = (allCompleted / allTotal) * 100;
        document.querySelector('.progress-item:nth-child(1) .progress-bar').style.width = `${allProgressPercent}%`;
      }
      
      if (blind75Completed >= 0) {
        const blind75ProgressPercent = (blind75Completed / 75) * 100;
        document.querySelector('.progress-item:nth-child(2) .progress-bar').style.width = `${blind75ProgressPercent}%`;
      }
    } catch (error) {
      console.error('Error updating completion counters:', error);
    }
  },
  
  /**
   * Update the retry count
   */
  updateRetryCount: function() {
    const retryCount = ProblemManager.countRetryProblems();
    const retryCountElement = document.getElementById('retry-count');
    if (retryCountElement) retryCountElement.textContent = retryCount;
  },
  
  /**
   * Add a new problem
   * @param {string} tabName - Tab name ('all' or 'blind75')
   */
  addNewProblem: function(tabName) {
    // Only allow adding to the "all" tab
    if (tabName !== 'all') {
      alert('You cannot add problems to the Blind 75 list.');
      return;
    }
    
    const titleInput = document.getElementById('problem-title');
    const urlInput = document.getElementById('problem-url');
    const topicInput = document.getElementById('problem-topic');
    const difficultySelect = document.getElementById('problem-difficulty');
    const hintInput = document.getElementById('problem-hint');
    
    if (!titleInput.value || !urlInput.value || !topicInput.value) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Check if the problem is already in the list
    const problemTitle = titleInput.value.trim();
    const isDuplicate = ProblemManager.problems.some(p => 
      p.title.toLowerCase() === problemTitle.toLowerCase()
    );
    
    if (isDuplicate) {
      alert('This problem is already in the list.');
      return;
    }
    
    // Create problem data object
    const problemData = {
      title: problemTitle,
      url: urlInput.value.trim(),
      topics: topicInput.value.split(',').map(t => t.trim()).filter(t => t.length > 0),
      difficulty: difficultySelect.value,
      hint: hintInput.value.trim() || "No hint provided."
    };
    
    
    // Add the problem using ProblemManager
    const newProblem = ProblemManager.addProblem(problemData);
    
    if (!newProblem) {
      alert('Failed to add the problem. Please try again.');
      return;
    }
    
    // Record this activity
    Storage.addActivity({
      type: 'add',
      text: `Added new problem "${problemTitle}"`,
      timestamp: new Date().toISOString()
    });
    
    // Update the UI
    this.displayProblems();
    this.populateTopicFilters();
    this.updateCompletionCounters();
    this.updateRetryCount();
    
    // Clear form fields
    titleInput.value = '';
    urlInput.value = '';
    topicInput.value = '';
    difficultySelect.value = 'Easy';
    hintInput.value = '';
    
    // Show success message
    const successMsg = document.createElement('div');
    successMsg.className = 'save-success-message';
    successMsg.textContent = `Problem "${problemTitle}" added successfully!`;
    document.body.appendChild(successMsg);
    
    setTimeout(() => {
      successMsg.remove();
    }, 3000);
  },
  
  /**
   * Edit a problem
   * @param {number} problemId - Problem ID
   */
  editProblem: function(problemId) {
    const problem = ProblemManager.getProblemById(problemId);
    if (!problem) {
      console.error('Problem not found:', problemId);
      return;
    }
        
    // Make sure the edit modal exists
    if (!document.getElementById('editProblemModal')) {
      this.createEditProblemModal();
    }
    
    // Fill the form with problem data
    document.getElementById('edit-problem-id').value = problem.id;
    document.getElementById('edit-problem-title').value = problem.title || '';
    document.getElementById('edit-problem-url').value = problem.url || '';
    document.getElementById('edit-problem-topic').value = problem.topics ? problem.topics.join(', ') : '';
    document.getElementById('edit-problem-difficulty').value = problem.difficulty || 'Easy';
    document.getElementById('edit-problem-hint').value = problem.hint || '';
    
    // Show the modal
    const modal = document.getElementById('editProblemModal');
    modal.style.display = 'block';
    
    // Set up direct event handlers for buttons
    const closeBtn = modal.querySelector('.close');
    const cancelBtn = modal.querySelector('.edit-cancel-btn');
    const saveBtn = modal.querySelector('.edit-save-btn');
    
    // Make sure these buttons work properly with direct assignments
    if (closeBtn) {
      closeBtn.onclick = () => {
        modal.style.display = 'none';
      };
    }
    
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        modal.style.display = 'none';
      };
    }
    
    if (saveBtn) {
      saveBtn.onclick = () => {
        this.saveEditedProblem();
      };
    }
    
    // Also handle outside clicks
    window.onclick = (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    };
  },
  
  /**
   * Create the edit problem modal
   */
  createEditProblemModal: function() {
    // Check if modal already exists
    if (document.getElementById('editProblemModal')) {
      return;
    }
    
    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'editProblemModal';
    modal.className = 'modal';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'edit-modal-content';
    
    // Create header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'edit-modal-header';
    
    // Create title
    const title = document.createElement('h2');
    title.textContent = 'Edit Problem';
    
    // Create close button
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close';
    closeBtn.innerHTML = '&times;';
    
    // Append title and close button to header
    modalHeader.appendChild(title);
    modalHeader.appendChild(closeBtn);
    
    // Create form with grid layout
    const formGrid = document.createElement('div');
    formGrid.className = 'add-form-grid';
    
    // Hidden ID field
    const idInput = document.createElement('input');
    idInput.type = 'hidden';
    idInput.id = 'edit-problem-id';
    formGrid.appendChild(idInput);
    
    // Problem title
    const titleGroup = document.createElement('div');
    titleGroup.className = 'form-group-enhanced';
    const titleLabel = document.createElement('label');
    titleLabel.htmlFor = 'edit-problem-title';
    titleLabel.textContent = 'Problem Title';
    titleLabel.className = 'required-field';
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.id = 'edit-problem-title';
    titleInput.placeholder = 'e.g., Two Sum (1)';
    titleInput.required = true;
    titleGroup.appendChild(titleLabel);
    titleGroup.appendChild(titleInput);
    formGrid.appendChild(titleGroup);
    
    // Problem URL
    const urlGroup = document.createElement('div');
    urlGroup.className = 'form-group-enhanced';
    const urlLabel = document.createElement('label');
    urlLabel.htmlFor = 'edit-problem-url';
    urlLabel.textContent = 'LeetCode URL';
    urlLabel.className = 'required-field';
    const urlInput = document.createElement('input');
    urlInput.type = 'url';
    urlInput.id = 'edit-problem-url';
    urlInput.placeholder = 'https://leetcode.com/problems/...';
    urlInput.required = true;
    urlGroup.appendChild(urlLabel);
    urlGroup.appendChild(urlInput);
    formGrid.appendChild(urlGroup);
    
    // Topics
    const topicGroup = document.createElement('div');
    topicGroup.className = 'form-group-enhanced';
    const topicLabel = document.createElement('label');
    topicLabel.htmlFor = 'edit-problem-topic';
    topicLabel.textContent = 'Topic(s)';
    topicLabel.className = 'required-field';
    const topicInput = document.createElement('input');
    topicInput.type = 'text';
    topicInput.id = 'edit-problem-topic';
    topicInput.placeholder = 'e.g., Array, Hash Table (comma-separated)';
    topicInput.required = true;
    topicGroup.appendChild(topicLabel);
    topicGroup.appendChild(topicInput);
    formGrid.appendChild(topicGroup);
    
    // Difficulty
    const diffGroup = document.createElement('div');
    diffGroup.className = 'form-group-enhanced';
    const diffLabel = document.createElement('label');
    diffLabel.htmlFor = 'edit-problem-difficulty';
    diffLabel.textContent = 'Difficulty';
    const diffSelect = document.createElement('select');
    diffSelect.id = 'edit-problem-difficulty';
    ['Easy', 'Medium', 'Hard'].forEach(diff => {
      const option = document.createElement('option');
      option.value = diff;
      option.textContent = diff;
      diffSelect.appendChild(option);
    });
    diffGroup.appendChild(diffLabel);
    diffGroup.appendChild(diffSelect);
    formGrid.appendChild(diffGroup);
    
    // Hint
    const hintGroup = document.createElement('div');
    hintGroup.className = 'form-group-enhanced full-width hint-container';
    const hintLabel = document.createElement('label');
    hintLabel.htmlFor = 'edit-problem-hint';
    hintLabel.textContent = 'Problem Hint';
    const hintInput = document.createElement('textarea');
    hintInput.id = 'edit-problem-hint';
    hintInput.placeholder = 'Enter a helpful hint for solving this problem';
    hintGroup.appendChild(hintLabel);
    hintGroup.appendChild(hintInput);
    formGrid.appendChild(hintGroup);
    
    // Create footer with buttons
    const modalFooter = document.createElement('div');
    modalFooter.className = 'edit-modal-footer';
    
    const btnActions = document.createElement('div');
    btnActions.className = 'edit-btn-actions';
    
    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'edit-cancel-btn';
    cancelBtn.textContent = 'Cancel';
    
    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'edit-save-btn';
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    
    // Add buttons to actions container
    btnActions.appendChild(cancelBtn);
    btnActions.appendChild(saveBtn);
    
    // Add actions to footer
    modalFooter.appendChild(btnActions);
    
    // Assemble modal
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(formGrid);
    modalContent.appendChild(modalFooter);
    modal.appendChild(modalContent);
    
    // Add to document
    document.body.appendChild(modal);
    
    // Add event listeners after the modal is added to the DOM
    closeBtn.addEventListener('click', () => {
      document.getElementById('editProblemModal').style.display = 'none';
    });
    
    cancelBtn.addEventListener('click', () => {
      document.getElementById('editProblemModal').style.display = 'none';
    });
    
    saveBtn.addEventListener('click', () => {
      this.saveEditedProblem();
    });
    
    // Close when clicking outside
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  },
  
  /**
   * Save edited problem
   */
  saveEditedProblem: function() {
    const id = parseInt(document.getElementById('edit-problem-id').value);
    const title = document.getElementById('edit-problem-title').value.trim();
    const url = document.getElementById('edit-problem-url').value.trim();
    const topics = document.getElementById('edit-problem-topic').value.split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    const difficulty = document.getElementById('edit-problem-difficulty').value;
    const hint = document.getElementById('edit-problem-hint').value.trim();
    
    if (!title || !url || topics.length === 0) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Get original problem to compare changes
    const originalProblem = ProblemManager.getProblemById(id);
    
    // Create updated problem data
    const updatedData = {
      title,
      url,
      topics,
      difficulty,
      hint: hint || 'No hint provided.',
      // Preserve isBlind75 status
      isBlind75: originalProblem ? originalProblem.isBlind75 : false
    };
    
    
    // Update problem in ProblemManager
    const success = ProblemManager.updateProblem(id, updatedData);
    
    if (success) {
      // Add activity record for the edit
      Storage.addActivity({
        type: 'edit',
        text: `Edited problem "${title}"`,
        timestamp: new Date().toISOString()
      });
      
      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className = 'save-success-message';
      successMsg.textContent = 'Problem updated successfully!';
      document.body.appendChild(successMsg);
      
      setTimeout(() => {
        successMsg.remove();
      }, 3000);
      
      // Close modal
      document.getElementById('editProblemModal').style.display = 'none';
      
      // Update UI
      this.displayProblems();
      this.populateTopicFilters();
      
    } else {
      console.error('Failed to update problem:', id);
      alert('Error updating problem');
    }
  },
  
  /**
   * Delete a problem
   * @param {number} problemId - Problem ID
   */
  deleteProblem: function(problemId) {
    const problem = ProblemManager.getProblemById(problemId);
    if (!problem) return;
    
    // Confirm deletion
    const confirmDelete = confirm(`Are you sure you want to delete "${problem.title}"?`);
    if (!confirmDelete) return;
    
    // Delete problem from ProblemManager
    const success = ProblemManager.deleteProblem(problemId);
    
    if (success) {
      // Update UI
      this.displayProblems();
      this.populateTopicFilters();
      this.updateCompletionCounters();
      
      // Show success message
      alert(`Problem "${problem.title}" deleted successfully!`);
    } else {
      alert('Error deleting problem. Please try again.');
    }
  },
};