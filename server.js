const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors'); // You may need to install this: npm install cors

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Handle the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Special middleware to handle problems.json and remove comments
app.get('/problems.json', (req, res) => {
  fs.readFile(path.join(__dirname, 'problems.json'), 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading problems.json:', err);
      return res.status(404).send('Problems file not found');
    }
    
    try {
      // Remove any comments from the JSON file (which aren't valid JSON)
      const jsonData = data.replace(/\/\/.*$/gm, '');
      const parsedData = JSON.parse(jsonData);
      res.json(parsedData);
    } catch (error) {
      console.error('Error parsing problems.json:', error);
      res.status(500).send('Error parsing problems.json');
    }
  });
});

// Handle 404s
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Access the app at http://localhost:${PORT}/`);
});