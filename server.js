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
  // Check if user exists in database based on email
  User.findOne({ googleId: profile.id })
    .then(existingUser => {
      if (existingUser) {
        console.log('User already exists:', existingUser);
        // User exists, proceed with authentication
        return done(null, existingUser);
      } else {
        // Create a new user if not found
        const newUser = new User({
          googleId: profile.id,
          email: profile.emails[0].value // Adjust as per your profile structure
        });
        newUser.save()
          .then(user => {
            console.log('New user created:', user);
            return done(null, user);
          })
          .catch(err => {
            console.error('Error creating new user:', err);
            return done(err);
          });
      }
    })
    .catch(err => {
      console.error('Error finding user:', err);
      return done(err);
    });
}
));

passport.serializeUser((user, done) => {
  done(null, user.id); // Serialize user by ID
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then(user => {
      done(null, user);
    })
    .catch(err => {
      done(err);
    });
});


// Routes
app.get('/logout', (req, res) => {
  res.render('auth/logout', { title: 'Logout', body: '' });
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    if (!req.user.username) {
      res.redirect('/select-username');
    } else {
      res.redirect('/');
    }
  }
);

app.get('/select-username', (req, res) => {
  res.render('auth/select-username', { title: 'Logout', body: '' });
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
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
