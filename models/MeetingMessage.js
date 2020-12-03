const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MeetingMessageSchema = new Schema({
  meetingId: { type: Schema.Types.ObjectId, ref: 'Meeting' },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  message: { type: String, default: '' }
},{
  timestamps: { createdAt: 'created_at' }
});

const MeetingMessage = mongoose.model('MeetingMessage', MeetingMessageSchema);
module.exports = MeetingMessage;