'use strict';
const userModel = require('../models/Users.js');
module.exports = async (req, res, next) => {
  try {
    //getting the token from the cookies
    let token = req.cookies['token'];
    console.log('sad',token)

    //checking if the token is related to the user
    let user = await userModel.bearerAuth(token);
    req.user = user;


    token ? next() : res.redirect('/signin.html');
  } catch (error) {
    res.status(403).json(error);
  }
};
