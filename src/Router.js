'use strict';
//requireing express to use it's router
const express = require('express');
const router = express.Router();

// getting auth middlewares to use them inside the routes
const UserModel = require('./auth/models/Users.js');
const basicAuth = require('./auth/middlewares/basic.js');
const isLogged = require('./auth/middlewares/isLogged');
const bearer = require('./auth/middlewares/bearer.js');
const checkOwner = require('./auth/middlewares/checkOwner');
const Room = require('./auth/models/Room');
const roomValidator = require('./auth/middlewares/roomValidiator');
const privatRoomValidator = require('./auth/middlewares/privateRoomValidator.js');

//using the environment variables
require('dotenv').config();

//requireign the path module to provide a way of working with directories
const path = require('path');

//requiring Oauth files
const googleAuth = require('../src/auth/middlewares/googleAuth');
const facebookOAuth = require('../src/auth/middlewares/facebookAuth');
const { OAuth2Client } = require('google-auth-library');
const CLIENT_ID = process.env.CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

// requiring uuid to generate unique id
const uuid = require('uuid').v4;
const { model } = require('mongoose');

//requiring base64 to do encoding and decoding
let base64 = require('base-64');

//telling the router the path of public files
router.use(express.static(path.join(__dirname, '../public/broadcast')));

//this route is for handling the sign-up for a new user
router.post('/signup', async (req, res, next) => {
  try {
    //saving the information of the user to the database
    let user = new UserModel(req.body);
    const userRecord = await user.save();
    const output = {
      user: userRecord,
      token: userRecord.token,
    };
    //redirecing the user to the signin page
    // res.redirect('/signin.html');
    res.json(output);

  } catch (error) {
    next(error.message);
  }
});
let name;

//handling the signin route for the user

router.post('/signin', basicAuth, (req, res, next) => {
  const userObject = {
    user: req.user.username,
    token: req.user.token,
  };
  //setting a user name in the cookies
  res.cookie('username', req.user.username);
  name = userObject.user.username;
  res.json(userObject);
});

router.get('/logout', (req, res) => {
  res.clearCookie('session-token'); // new
  res.clearCookie('token'); // new
  res.clearCookie('username');

  res.redirect('/signin.html');
});
// facebook
router.get('/facebooklogin', facebookOAuth, (req, res) => {
 
    // .cookie('session-token', req.token)
    // .sendFile('home.html', { root: path.join(__dirname, '../public') });
  res.json({ token: req.token, user: req.user });
});

router.get('/', rootHandler);

router.post('/ctreatRoom', isLogged, createRoom);
router.get('/:id', isLogged, roomValidator, checkOwner, roomHandler);
router.get('/p/:id', isLogged, privatRoomValidator, checkOwner, roomHandler);

router.post('/googleLogin', (req, res,next) => {

  let token = req.body.token;
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const userid = payload['sub'];
  }
  verify()
    .then(() => {
      googleAuth(req, res, next);
        })
    .catch(console.error);
});




function rootHandler(req, res) {
  res.send('root is working');
}
/**
 * if the user is owner for the room then give him a broadcaster page
 * @param {*} req
 * @param {*} res
 */
function roomHandler(req, res) {
  req.isOwner
    // ? res.sendFile('broadcaster.html', {
    //     root: path.join(__dirname, '../public/broadcast'),
    //   })
    // : res.sendFile('watcher.html', {
    //     root: path.join(__dirname, '../public/broadcast'),
    //   });
    res.json(
      {OwnerFlag:  req.isOwner
    });
}
/**
 * this function generate a unique id for the room save it to the db and redirect the user to the event page
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
async function createRoom(req, res, next) {
  try {
    let roomId = uuid();
    if (req.body.category === 'private') {
      let room = new Room({
        roomId: roomId,
        owner: req.user.username,
        category: req.body.category,
        password: req.body.password,
      });
      const record = await room.save();
      console.log(record);

      let encoded = base64.encode(req.body.password);
      res.json({record,encoded});
    } else {
      let room = new Room({
        roomId: roomId,
        owner: req.user.username,
        category: req.body.category,
      });
      const record = await room.save();
      res.json({record});
    }
  } catch (error) {
    next(error);
  }
}
module.exports = router;
