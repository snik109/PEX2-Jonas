const fs = require('fs');
const path = require('path');

const ticketsFilePath = path.join(__dirname, 'databaseStorage.json');
console.log(ticketsFilePath);

function readTickets() {
    try {
        const data = fs.readFileSync(ticketsFilePath, 'utf-8');
        const parsed = JSON.parse(data);
        return parsed.tickets || [];
    } catch (err) {
        console.error('Error reading tickets:', err);
        return [];
    }
}

function writeTickets(tickets) {
    try {
        const data = fs.readFileSync(ticketsFilePath, 'utf-8');
        const parsed = JSON.parse(data);
        parsed.tickets = tickets;
        fs.writeFileSync(ticketsFilePath, JSON.stringify(parsed, null, 2));
        console.log(ticketsFilePath);
    } catch (err) {
        console.error('Error writing tickets:', err);
    }
}

function getAllTickets() {
    return readTickets();
}

function getTicketById(id) {
    const tickets = readTickets();
    return tickets.find(t => t.id === parseInt(id));
}

function getTicketsByOwner(owner) {
    const tickets = readTickets();
    return tickets.filter(t => t.owner === owner);
}

function createTicket(ticketData) {
    const tickets = readTickets();
    const newId = tickets.length > 0 ? Math.max(...tickets.map(t => t.id)) + 1 : 1;
    const now = new Date().toISOString();
    
    const newTicket = {
        id: newId,
        ticketName: ticketData.ticketName,
        description: ticketData.description || '',
        status: ticketData.status || 'open',
        priority: ticketData.priority || 'low',
        createdAt: now,
        updatedAt: now,
        deadline: ticketData.deadline || null,
        owner: ticketData.owner || null,
        customer: ticketData.customer || null,
        comments: [],
        tags: ticketData.tags || []
    };

    tickets.push(newTicket);
    writeTickets(tickets);
    return newTicket;
}

function updateTicket(id, updates) {
    const tickets = readTickets();
    const ticketIndex = tickets.findIndex(t => t.id === parseInt(id));
    
    if (ticketIndex === -1) return null;

    const allowedFields = [
        'ticketName',
        'description',
        'status',
        'priority',
        'deadline',
        'owner',
        'customer',
        'tags'
    ];

    allowedFields.forEach(field => {
        if (field in updates) {
            tickets[ticketIndex][field] = updates[field];
        }
    });

    tickets[ticketIndex].updatedAt = new Date().toISOString();
    writeTickets(tickets);
    return tickets[ticketIndex];
}

function deleteTicket(id) {
    const tickets = readTickets();
    const filteredTickets = tickets.filter(t => t.id !== parseInt(id));
    
    if (filteredTickets.length === tickets.length) return false;
    
    writeTickets(filteredTickets);
    return true;
}

function addComment(ticketId, comment) {
    const tickets = readTickets();
    const ticket = tickets.find(t => t.id === parseInt(ticketId));
    
    if (!ticket) return null;

    const commentId = ticket.comments.length > 0 
        ? Math.max(...ticket.comments.map(c => c.commentId)) + 1 
        : 1;

    const newComment = {
        commentId: commentId,
        author: comment.author,
        content: comment.content,
        createdAt: new Date().toISOString()
    };

    ticket.comments.push(newComment);
    ticket.updatedAt = new Date().toISOString();
    writeTickets(tickets);
    return newComment;
}

function validateTicketData(data) {
    const errors = [];
    
    if (!data.ticketName || typeof data.ticketName !== 'string') {
        errors.push('ticketName is required and must be a string');
    }
    
    if (data.status && !['open', 'in-progress', 'resolved'].includes(data.status)) {
        errors.push('status must be one of: open, in-progress, resolved');
    }
    
    if (data.priority && !['low', 'medium', 'high', '1', '2', '3'].includes(data.priority)) {
        errors.push('priority must be one of: low, medium, high, 1, 2, 3');
    }
    
    return errors;
}

module.exports = {
    getAllTickets,
    getTicketById,
    getTicketsByOwner,
    createTicket,
    updateTicket,
    deleteTicket,
    addComment,
    validateTicketData
};
