const {
    getAllTickets: getAllTicketsDB,
    getTicketById,
    getTicketsByOwner,
    createTicket,
    updateTicket,
    deleteTicket,
    addComment,
    validateTicketData
} = require('../data/ticketDatabase');

function getTickets(req, res) {
    try {
        const tickets = getAllTicketsDB();
        res.status(200).json({
            message: 'Tickets retrieved successfully',
            tickets: tickets
        });
    } catch (err) {
        console.error('Error fetching tickets:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

function getTicket(req, res) {
    try {
        const { id } = req.params;
        const ticket = getTicketById(id);
        
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        
        res.status(200).json({ ticket });
    } catch (err) {
        console.error('Error fetching ticket:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

function createNewTicket(req, res) {
    try {
        const { ticketName, description, priority, status, deadline, owner, customer, tags } = req.body;
        
        const errors = validateTicketData({ ticketName, status, priority });
        if (errors.length > 0) {
            return res.status(400).json({
                message: 'Validation errors',
                errors: errors
            });
        }

        const ticketData = {
            ticketName,
            description: description || '',
            priority: priority || 'low',
            status: status || 'open',
            deadline: deadline || null,
            owner: owner || req.user?.username || null,
            customer: customer || null,
            tags: tags || []
        };

        const newTicket = createTicket(ticketData);
        res.status(201).json({
            message: 'Ticket created successfully',
            ticket: newTicket
        });
    } catch (err) {
        console.error('Error creating ticket:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

function updateExistingTicket(req, res) {
    try {
        const { id } = req.params;
        const { ticketName, description, status, priority, deadline, owner, customer, tags } = req.body;
        
        const ticket = getTicketById(id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const updates = {};
        if (ticketName !== undefined) updates.ticketName = ticketName;
        if (description !== undefined) updates.description = description;
        if (status !== undefined) updates.status = status;
        if (priority !== undefined) updates.priority = priority;
        if (deadline !== undefined) updates.deadline = deadline;
        if (owner !== undefined) updates.owner = owner;
        if (customer !== undefined) updates.customer = customer;
        if (tags !== undefined) updates.tags = tags;

        const errors = validateTicketData(updates);
        if (errors.length > 0) {
            return res.status(400).json({
                message: 'Validation errors',
                errors: errors
            });
        }

        const updatedTicket = updateTicket(id, updates);
        res.status(200).json({
            message: 'Ticket updated successfully',
            ticket: updatedTicket
        });
    } catch (err) {
        console.error('Error updating ticket:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

function deleteExistingTicket(req, res) {
    try {
        const { id } = req.params;
        const ticket = getTicketById(id);
        
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const success = deleteTicket(id);
        if (success) {
            res.status(200).json({ message: 'Ticket deleted successfully' });
        } else {
            res.status(500).json({ message: 'Failed to delete ticket' });
        }
    } catch (err) {
        console.error('Error deleting ticket:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

function addNewComment(req, res) {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!content || typeof content !== 'string') {
            return res.status(400).json({ message: 'Content is required' });
        }

        const ticket = getTicketById(id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const comment = addComment(id, {
            author: req.user?.username || 'Anonymous',
            content: content
        });

        res.status(201).json({
            message: 'Comment added successfully',
            comment: comment
        });
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    getTickets,
    getTicket,
    createNewTicket,
    updateExistingTicket,
    deleteExistingTicket,
    addNewComment
};
