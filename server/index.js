import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
let db;
const client = new MongoClient(process.env.MONGODB_URI);

async function connectDB() {
  try {
    await client.connect();
    db = client.db('credchain');
    console.log('Connected to MongoDB');

    // Create indexes for fast lookups
    await db.collection('profiles').createIndex({ walletAddress: 1 }, { unique: true });
    await db.collection('verified_enterprises').createIndex({ walletAddress: 1 }, { unique: true });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'CredChain API' });
});

// GET /api/profile?address=0x...
app.get('/api/profile', async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Missing address parameter' });
  }

  try {
    const profile = await db.collection('profiles').findOne({
      walletAddress: address.toLowerCase()
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/profile - Create or update profile
app.post('/api/profile', async (req, res) => {
  const { walletAddress, name, phone, address, city, state, pincode, verificationStatus } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Missing walletAddress' });
  }

  const normalizedAddress = walletAddress.toLowerCase();

  try {
    const result = await db.collection('profiles').findOneAndUpdate(
      { walletAddress: normalizedAddress },
      {
        $set: {
          walletAddress: normalizedAddress,
          name: name || '',
          phone: phone || '',
          address: address || '',
          city: city || '',
          state: state || '',
          pincode: pincode || '',
          verificationStatus: verificationStatus || 'pending',
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.json(result);
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/enterprise/verify?address=0x...
app.get('/api/enterprise/verify', async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Missing address parameter' });
  }

  try {
    const enterprise = await db.collection('verified_enterprises').findOne({
      walletAddress: address.toLowerCase()
    });

    if (!enterprise) {
      return res.json({ verified: false, enterpriseName: null });
    }

    res.json({
      verified: true,
      enterpriseName: enterprise.name || '',
      verifiedAt: enterprise.verifiedAt,
    });
  } catch (error) {
    console.error('Error checking enterprise verification:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/admin/verify-enterprise - Add a verified enterprise (admin use only)
app.post('/api/admin/verify-enterprise', async (req, res) => {
  const apiKey = req.headers['x-admin-key'];
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { walletAddress, name } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Missing walletAddress' });
  }

  try {
    const result = await db.collection('verified_enterprises').findOneAndUpdate(
      { walletAddress: walletAddress.toLowerCase() },
      {
        $set: {
          walletAddress: walletAddress.toLowerCase(),
          name: name || '',
          verifiedAt: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.json({ success: true, enterprise: result });
  } catch (error) {
    console.error('Error verifying enterprise:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
});
