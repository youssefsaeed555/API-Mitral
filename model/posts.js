const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    specialty:
    {
        type:String,
        required:true
    },
    comments:
    [{
      type:Schema.Types.ObjectId,
      ref:'Comment'
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);
