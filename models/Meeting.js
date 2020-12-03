const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MeetingSchema = new Schema({
  topic: { type: Schema.Types.ObjectId, ref: 'Topic' },
  user1: { type: Schema.Types.ObjectId, ref: 'User' },
  user2: { type: Schema.Types.ObjectId, ref: 'User' },
  kalturaResourceId: { type: String, default: '' }
});

const Meeting = mongoose.model('Meeting', MeetingSchema);
module.exports = Meeting;
