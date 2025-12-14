const dotenv = require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());
app.use('/api/v1.0.0/tickets', require('./v1.0.0/routes/ticketRoutes'))
app.use('/api/v1.0.0/accounts', require('./v1.0.0/routes/accountRoutes'))


app.listen(3872, () => {
    console.log('Server is running on port 3872');
})