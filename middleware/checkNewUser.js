const User = require('../models/User');

const checkNewUser = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.redirect('/logout');
  }

  try {
    const existingUser = await User.findOne({ googleId: req.user.googleId });
    if (existingUser && existingUser.username) {
      // User already exists with a username
      return res.redirect('/');
    } else {
      // User is new and needs to select a username
      next();
    }
  } catch (error) {
    console.error('Error checking user:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = checkNewUser;
