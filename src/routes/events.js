'use strict';
const express = require('express');
const router = express.Router();
// const isLogged = require('../auth/middlewares/isLogged.js');
const bearer = require('../auth/middlewares/bearer.js')
const acl =require('../auth/middlewares/acl.js'); 
const DataMngr = require('../models/DataCollection.js');
const Events = require('../models/events/model.js');
const eventsMngr = new DataMngr(Events);


router.get('/',getHandlerList);
router.get('/:id',bearer,getHandler);
router.post('/',bearer,acl('create'),postHandler);
router.put('/:id',bearer,acl('update'),putHandler);
router.delete('/:id',bearer,acl('delete'),deleteHandler);

 async function getHandlerList(req,res,next){
     try {
        let resObj = await eventsMngr.get();
        res.status(200).json(resObj);
     } catch (error) {
         next(error);         
     }
    

 }

 async function getHandler(req,res,next){
     try {
         let id =req.params.id;
         let resObj = await eventsMngr.get(id);
         res.status(200).json(resObj);

         
     } catch (error) {
        next(error); 
       
     }
     
}

async function postHandler(req,res,next){

    try {
        let reqObj ={}; 
        reqObj =req.body;
        reqObj['room_owner']= req.cookies['username'];
        let resObj = await eventsMngr.create(reqObj);
        res.status(201).json(resObj);

        
    } catch (error) {
       next(error); 
      
    }
     
}

async function putHandler (req,res,next){
    try {
        let reqObj =req.body;
        let id =req.params.id;
        let resObj = await eventsMngr.update(id,reqObj);
        res.status(200).json(resObj);

        
    } catch (error) {
       next(error); 
      
    }
     
}

async function deleteHandler (req,res,next){

    try {
        let id =req.params.id;
        let resObj = await eventsMngr.delete(id)
        res.status(200).json(resObj);

        
    } catch (error) {
       next(error); 
      
    }
     
}

module.exports = router;
