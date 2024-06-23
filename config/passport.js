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
    done(null, user.id);
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
}  
