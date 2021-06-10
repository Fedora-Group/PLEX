'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

let UsersSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      default: 'user',
      enum: ['user', 'editor', 'admin'],
    },
  },
  { timestamps: true },
);

UsersSchema.pre('save', async function () {
  if(this.isModified('password'))
    this.password=await bcrypt.hash(this.password,10);
});

UsersSchema.virtual('token').get(function () {
  //TODO
});
UsersSchema.virtual('cabailites').get(function () {
  //TODO
});

//Static method for sign in and authentication
UsersSchema.statics.basicAuth = async function (username, password) {
  //TODO
  const user= await this.findOne({username});
  console.log('after', user);
  const valid= await bcrypt.compare(password, user.password);
 
  console.log('valid', valid);
  if (valid){
    return user;
  }
  throw new Error ('Invalid User or password!');
};
//Static method for bearer token
UsersSchema.statics.bearerAuth = function (token) {
  //TODO
};

const UserModel = mongoose.model('User', UsersSchema);
module.exports = UserModel;
