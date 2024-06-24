const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
    },
    (accessToken, refreshToken, profile, done) => {
      console.log('Google profile:', profile);

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
            console.log('Temp user:', tempUser);
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
    console.log('Serializing user:', user);
    if (user._id) {
      done(null, user._id);
    } else {
      // For new users not yet saved in the database
      done(null, user);
    }
  });

  passport.deserializeUser((id, done) => {
    console.log('Deserializing user with id:', id);
    if (typeof id === 'object' && id.googleId) {
      // New user, not yet saved in the database
      done(null, id);
    } else {
      // User is already in the database
      User.findById(id)
        .then(user => done(null, user))
        .catch(err => done(err));
    }
  });
};
