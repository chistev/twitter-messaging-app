const express = require('express');
const router = express.Router();
const User = require('../../models/User')
const checkNewUser = require('../../middleware/checkNewUser');

// Username routes
router.get('/select-username', checkNewUser, (req, res) => {
  res.render('auth/select-username', { title: 'Select Username', body: '' });
});

// Route to check username availability
router.get('/check-username', async (req, res) => {
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

router.post('/select-username', async (req, res) => {
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
        // Clear the temporary user data from the session
        req.session.passport.user = newUser._id;
        res.json({ success: true });
      });
    } catch (error) {
      console.error('Error creating new user:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  

module.exports = router;
