const express = require('express');
const { createServer } = require('http');
const path = require('path');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const { csrfMiddleware, csrfVerifyMiddleware } = require('./middleware/csrfMiddleware');
const initializePassport = require('./config/passport');
const User = require('./models/User');
const MongoStore = require('connect-mongo');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
const connectDB = require('./config/mongoose');
connectDB();

const app = express();

// Initialize Passport
initializePassport(passport);
const server = createServer(app);

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Configure express-session middleware
app.use(session({
  secret: process.env.SECRET, 
  resave: false,
  saveUninitialized: false,  // Only save sessions that have been modified
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions'
  }),
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day in milliseconds
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Initialize csrf middleware
app.use(csrfMiddleware); 

// Make CSRF token available in views
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Routes
const authRoutes = require('./controllers/authControllers/authRoutes');
const usernameRoutes = require('./controllers/authControllers/usernameRoutes');

app.use('/', authRoutes);
app.use('/', usernameRoutes);

// New route to save selected user
app.post('/api/select-user', async (req, res) => {
  const { userId, selectedUserId } = req.body;
  console.log(`Received request to select user - userId: ${userId}, selectedUserId: ${selectedUserId}`);
  
  try {
    // Fetch the user to log the existing selected users
    const user = await User.findById(userId);
    if (user) {
      console.log(`Existing selected users for user ${userId}:`, user.selectedUsers);
    } else {
      console.log(`User ${userId} not found`);
      return res.status(404).send('User not found');
    }

    // Attempt to update the user
    console.log(`Attempting to update user ${userId} to add selected user ${selectedUserId}`);
    await User.findByIdAndUpdate(userId, { $addToSet: { selectedUsers: selectedUserId } }); // Updated to add to the selectedUsers array
    
    // Fetch the updated user to log the new selected users
    const updatedUser = await User.findById(userId);
    if (updatedUser) {
      console.log(`Updated selected users for user ${userId}:`, updatedUser.selectedUsers);
    }

    console.log(`Successfully updated user ${userId} with selected user ${selectedUserId}`);
    res.status(200).json({ message: 'Selected user updated' });
  } catch (error) {
    console.error(`Error updating user ${userId} with selected user ${selectedUserId}:`, error);
    res.status(500).send('Server Error');
  }
});

// Get selected user and render the view
app.get('/messages', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.error('User not found in request');
      return res.status(400).send('User not found');
    }

    const user = await User.findById(req.user.id).populate('selectedUsers'); // Updated to populate selectedUsers array
    if (!user) {
      console.error(`User with id ${req.user.id} not found`);
      return res.status(404).send('User not found');
    }

    const selectedUserId = req.query.user;
    let selectedUser = null;
    if (selectedUserId) {
      selectedUser = await User.findById(selectedUserId);
    }

    res.render('messages', { 
      title: 'Messages', 
      selectedUsers: user.selectedUsers, // Updated to pass selectedUsers array
      selectedUser: selectedUser, // Pass the selected user if any
      body: '',
      user: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).send('Server Error');
  }
});

app.get('/messages/settings', (req, res) => {
  res.render('messages', { title: 'Settings', body: '' });
});

app.get('/api/users', async (req, res) => {
  const { username } = req.query;
  const currentUserUsername = req.user.username; 

   try {
    // Fetch the current user to get the selectedUsers array
    const currentUser = await User.findOne({ username: currentUserUsername });

    if (!currentUser) {
      return res.status(404).send('Current user not found');
    }

    const selectedUserIds = currentUser.selectedUsers.map(user => user._id);
    console.log('Selected users to exclude:', selectedUserIds);

    // Find users matching the query but exclude the current user and selected users
    const users = await User.find({ 
      username: new RegExp(username, 'i'), 
      username: { $ne: currentUserUsername }, // Exclude the current user's username
      _id: { $nin: selectedUserIds } // Exclude already selected users
    }).limit(10);

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
