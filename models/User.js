const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: String,
  email: String,
  username: String
});

module.exports = mongoose.model('User', UserSchema);
