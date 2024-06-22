const express = require('express');
const { createServer } = require('http');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const server = createServer(app);

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(path.resolve(), 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/logout', (req, res) => {
  res.render('auth/logout', { title: 'Logout', body: '' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
