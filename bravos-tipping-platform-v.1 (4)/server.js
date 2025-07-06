const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '')));

// For single-page applications, send all other requests to index.html
// This is important for React Router to work correctly.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Bravos Tipping App listening on port ${port}`);
});
