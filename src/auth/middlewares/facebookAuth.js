'use strict';
require('dotenv').config();
const superagent = require('superagent');
const UserModel = require('../models/Users.js');

//facebook Oauth needed data

const facebookLoginUrl = 'https://graph.facebook.com/v10.0/oauth/access_token';
const remoteAPI = 'https://graph.facebook.com/me';
// const REDIRECT_URI='https://plex-jo.herokuapp.com/facebooklogin';
const REDIRECT_URI='http://localhost:3000/facebooklogin';
const CLIENT_IDFacebook = process.env.CLIENT_IDFacebook;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

//to make our life easier:
//CLIENT_IDFacebook='517100576141220'
//CLIENT_SECRET='20a911ee92a25a6bed0487062201ef19'

module.exports = async (req, res, next) => {
  try {
    const code = req.query.code;
    console.log('code', code);
    const remoteToken = await exchangeCode(code);
    const remoteUser = await getRemoteUserInfo(remoteToken);
    const [user, token] = await getUser(remoteUser);
    console.log('after save to db', user, token);
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    next(error.message);
  }
};
async function exchangeCode(code) {
  const tokenResponse = await superagent.get(facebookLoginUrl).query({
    code: code,
    client_id: CLIENT_IDFacebook,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
  });
  const accessToken = tokenResponse.body.access_token;
  return accessToken;
}
async function getRemoteUserInfo(token) {
  const userResponse = await superagent
    .get(remoteAPI)
    .set('Authorization', `Bearer ${token}`)
    .set('Accept', 'application/json');
  const user = userResponse.body;
  console.log('user info provided by facebook', user);
  return user;
}
async function getUser(remoteUser) {
  const user = {
    username: remoteUser.name+remoteUser.id,
    password: '11111',
  };
  try{
   
    const document= await UserModel.findOne({username:user.username});
    if (document){
      const token = document.token;
      return [document, token];
    }
    else{
      const userObj = new UserModel(user);
      const userDoc = await userObj.save();
      // console.log('userDoc',userDoc);
      const token = userDoc.token;
      return [userDoc, token];
    }
   
  }
  catch(e){
    console.log(e);
  }

}
