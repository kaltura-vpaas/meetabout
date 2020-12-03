const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TopicSchema = new Schema({
  name: { type: String, default: '' }
});

const Topic = mongoose.model('Topic', TopicSchema);
module.exports = Topic;
