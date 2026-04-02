const { Schema, model } = require('mongoose');

const foodItemSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  quantity: String,
  expiry: String,
  address: String,
  owner: String,
  contact: String,
  userEmail: String,
  image: String,
  status: {
    type: String,
    enum: ['available', 'requested', 'collected'],
    default: 'available',
  },
  requested: {
    type: Boolean,
    default: false,
  },
  requestedBy: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = model('FoodItem', foodItemSchema);
