const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: String,
  email: String,
  username: String,
  selectedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Updated to an array of selected users
});

module.exports = mongoose.model('User', UserSchema);
