const express = require('express');
const { createServer } = require('http');
const path = require('path');
const dotenv = require('dotenv');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const session = require('express-session');

// Load environment variables from .env file
dotenv.config();
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(error => console.error('Error connecting to MongoDB:', error));
  
// Define User model
const User = mongoose.model('User', { googleId: String, email: String, username: String });

const app = express();
const server = createServer(app);

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(passport.initialize());
// Configure express-session middleware
app.use(session({
  secret: process.env.SECRET, 
  resave: false,
  saveUninitialized: true
}));

app.use(passport.session());

// Passport configuration
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback',
},
(accessToken, refreshToken, profile, done) => {
  // Handle Google authentication callback
  // Check if user exists in database based on googleId
  User.findOne({ googleId: profile.id })
    .then(existingUser => {
      if (existingUser) {
        console.log('User already exists:', existingUser);
        // User exists, proceed with authentication
        return done(null, existingUser);
      } else {
        // Store user information in session and redirect to select-username page
        const tempUser = {
          googleId: profile.id,
          email: profile.emails[0].value
        };
        return done(null, tempUser);
      }
    })
    .catch(err => {
      console.error('Error finding user:', err);
      return done(err);
    });
}
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  if (obj._id) {
    // User is already in the database
    User.findById(obj._id)
      .then(user => done(null, user))
      .catch(err => done(err));
  } else {
    // User is not yet in the database
    done(null, obj);
  }
});


// Routes
app.get('/logout', (req, res) => {
  res.render('auth/logout', { title: 'Logout', body: '' });
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Authentication callback
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    if (req.user) {
      if (req.user.username) {
        // User exists, redirect to homepage
        res.redirect('/');
      } else {
        // New user, redirect to select-username page
        res.redirect('/select-username');
      }
    } else {
      // Handle authentication failure
      res.redirect('/login');
    }
  }
);

app.get('/select-username', (req, res) => {
  res.render('auth/select-username', { title: 'Select Username', body: '' });
});

// Route to check username availability
app.get('/check-username', async (req, res) => {
  const { username } = req.query;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.json({ available: false });
    } else {
      res.json({ available: true });
    }
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/select-username', async (req, res) => {
  const tempUser = req.user; // Get the temporary user information from the session

  // If there's no session data, redirect to the logout page
  if (!tempUser) {
    return res.redirect('/logout');
  }

  const { username } = req.body;

  // Perform server-side validation
  let errors = [];
  if (username.length < 5) {
    errors.push('Your username must be at least 5 characters long.');
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Your username can only contain letters, numbers, and \'_\'.');
  }

  // Check if username already exists in the database
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    errors.push('This username is already taken.');
  }

  if (errors.length > 0) {
    // Return errors as JSON response
    return res.status(400).json({ error: errors.join(' ') });
  }

  // Create a new user with the provided username
  const newUser = new User({
    googleId: tempUser.googleId,
    email: tempUser.email,
    username
  });
  console.log(newUser)
  try {
    await newUser.save();
    req.login(newUser, function(err) {
      if (err) {
        console.error('Error logging in newly created user:', err);
        return res.status(500).json({ error: 'Server error' });
      }
      res.json({ success: true });
    });
  } catch (error) {
    console.error('Error creating new user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
