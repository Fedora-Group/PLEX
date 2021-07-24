'use strict';
require('dotenv').config();
const UserModel = require('../models/Users.js');
const { model } = require('mongoose');
const { OAuth2Client } = require('google-auth-library');
const CLIENT_ID = process.env.CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);
module.exports = async (req, res, next) => {
  let token = req.body.token;

  let user = {};
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });
    console.log('inside middleware2');

    const payload = ticket.getPayload();

    user.name= payload.name;
    user.email= payload.email;
    

    const username = payload.email;
    const password = '1111';
    let obj = {
      username: username,
      password: password,
    };

    try {
      // news
      console.log('inside middleware3');
      let document = await UserModel.findOne({ username: obj.username });
      if (document) {
        res.cookie('token', document.token);
        res.cookie('username', document.username.split('@')[0]);
      } else {
        let user = new UserModel(obj); //news
        const userRecord = await user.save(); //news
        res.cookie('token', userRecord.token);
        res.cookie('username', userRecord.username.split('@')[0]);
      }
    } catch (error) {
      // news
      // res.redirect('/login'); // news
      // next(error)
    }
  }


  verify()
    .then(() => {
      req.user = user;
      next();
    })
    .catch(error => {
      // res.redirect('/login');
      next(error);
    });
};
