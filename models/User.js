const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: String,
  email: String,
  username: String,
  selectedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('User', UserSchema);
