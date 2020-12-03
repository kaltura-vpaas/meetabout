const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  userid: { type: String, default: ''},
  name: { type: String, default: '' },
  desc: { type: String, default: '' },
  email: { type: String, default: '' },
  topics: [{ type: Schema.Types.ObjectId, ref: 'Topic' }],
  profile_photo_url: { type: String, default: '' }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;
