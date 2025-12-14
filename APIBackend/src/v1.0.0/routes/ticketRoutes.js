const express = require('express');
const router = express.Router();
const { 
    getTickets, 
    getTicket, 
    createNewTicket, 
    updateExistingTicket, 
    deleteExistingTicket,
    addNewComment
} = require('../controllers/ticketController');

const { auth } = require('../authorization/auth');

//Get | www.localhost:3872/api/v1.0.0/tickets
router.get("/", auth, getTickets);
router.get("/:id", auth, getTicket);

//Post | www.localhost:3872/api/v1.0.0/tickets
router.post("/", auth, createNewTicket);
router.post("/:id/comments", auth, addNewComment);

//Put | www.localhost:3872/api/v1.0.0/tickets
router.put("/:id", auth, updateExistingTicket);

//Delete | www.localhost:3872/api/v1.0.0/tickets
router.delete("/:id", auth, deleteExistingTicket);

module.exports = router;