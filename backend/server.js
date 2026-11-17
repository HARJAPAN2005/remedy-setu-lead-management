const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the 'out' directory
app.use(express.static(path.join(__dirname, 'out')));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  dbName: 'LeadForm',
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// ── Schemas ────────────────────────────────────────────────────────────────────

const noteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String, required: true },
  businessType: {
    type: String,
    enum: ['Astrologer', 'Retailer', 'Distributor', 'Other'],
    required: true
  },
  productsInterested: [{
    type: String,
    enum: ['Gemstones', 'Rudraksha', 'Puja Services', 'Other']
  }],
  message: { type: String },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Quoted', 'Won', 'Lost'],
    default: 'New'
  },
  notes: [noteSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create model
const Lead = mongoose.model('Lead', leadSchema, 'Leads');

// ── Verify Token Middleware ────────────────────────────────────────────────────

const verifyToken = (req, res, next) => {
  // Get auth header value
  const bearerHeader = req.headers['authorization'];

  // Check if bearer is undefined
  if (typeof bearerHeader !== 'undefined') {
    // Split at the space
    const bearer = bearerHeader.split(' ');
    // Get token from array
    const bearerToken = bearer[1];

    // Directly compare with TOKEN_SECRET
    if (bearerToken === process.env.TOKEN_SECRET) {
      next();
    } else {
      return res.status(401).json({ message: 'Invalid token' });
    }
  } else {
    // Forbidden
    res.status(403).json({ message: 'No token provided' });
  }
};

// ── Public Routes ─────────────────────────────────────────────────────────────

// POST /api/leads — create a new lead (no auth required)
app.post('/api/leads', async (req, res) => {
  try {
    const { name, phone, city, businessType } = req.body;

    // Server-side validation of required fields
    if (!name || !phone || !city || !businessType) {
      return res.status(400).json({
        message: 'Missing required fields: name, phone, city, and businessType are required.'
      });
    }

    const newLead = new Lead(req.body);
    const savedLead = await newLead.save();
    res.status(201).json(savedLead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST /api/verify-token — token verification (no auth required)
app.post('/api/verify-token', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ valid: false, message: 'Token is required' });
    }

    // Direct comparison with TOKEN_SECRET
    const isValid = token === process.env.TOKEN_SECRET;

    if (isValid) {
      return res.status(200).json({ valid: true, message: 'Token is valid' });
    } else {
      return res.status(200).json({ valid: false, message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ valid: false, message: 'Internal server error' });
  }
});

// ── Protected Routes ──────────────────────────────────────────────────────────

// GET /api/leads/stats — lead counts by status (must be before /:id routes)
app.get('/api/leads/stats', verifyToken, async (req, res) => {
  try {
    const [total, newCount, contacted, quoted, won, lost] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ status: 'New' }),
      Lead.countDocuments({ status: 'Contacted' }),
      Lead.countDocuments({ status: 'Quoted' }),
      Lead.countDocuments({ status: 'Won' }),
      Lead.countDocuments({ status: 'Lost' }),
    ]);

    res.status(200).json({ total, new: newCount, contacted, quoted, won, lost });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/leads — return all leads sorted by createdAt desc
app.get('/api/leads', verifyToken, async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/leads/:id/status — update lead status
app.patch('/api/leads/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['New', 'Contacted', 'Quoted', 'Won', 'Lost'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      { status, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!updatedLead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.status(200).json(updatedLead);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid lead ID format' });
    }
    res.status(500).json({ message: error.message });
  }
});

// POST /api/leads/:id/notes — add a note to a lead
app.post('/api/leads/:id/notes', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Note text is required' });
    }

    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      {
        $push: { notes: { text } },
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!updatedLead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.status(200).json(updatedLead);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid lead ID format' });
    }
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/leads/:id — delete a lead
app.delete('/api/leads/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Lead ID is required' });
    }

    // Check if lead exists
    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Delete the lead
    await Lead.findByIdAndDelete(id);

    res.status(200).json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);

    // Handle invalid ID format
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid lead ID format' });
    }

    res.status(500).json({ message: 'Error deleting lead', error: error.message });
  }
});

// ── Static File Routes ────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'out', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'out', 'admin.html'));
});

// Fallback route for any other requests
app.use((req, res, next) => {
  // Skip API routes
  if (req.url.startsWith('/api')) {
    return next();
  }

  // Clean up URL to prevent path traversal
  const cleanUrl = req.url.split('?')[0]; // Remove query parameters

  // Try to serve the file directly first
  const filePath = path.join(__dirname, 'out', cleanUrl);

  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return res.sendFile(filePath);
    }

    return res.sendFile(path.join(__dirname, 'out', 'index.html'));
  } catch (error) {
    console.error('Error serving static file:', error);
    return res.sendFile(path.join(__dirname, 'out', 'index.html'));
  }
});

// ── Start Server ──────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving static files from ${path.join(__dirname, 'out')}`);
});
