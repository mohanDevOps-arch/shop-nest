const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_carts')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err.message));

// Routes
app.use('/api/cart', require('./routes/cart'));

// Health check
app.get('/health', (req, res) => {
  res.json({ service: 'Cart Service', status: 'OK', port: PORT });
});

app.listen(PORT, () => {
  console.log(`Cart Service running on port ${PORT}`);
});