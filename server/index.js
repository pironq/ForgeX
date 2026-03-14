import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
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
    await db.collection('credential_requests').createIndex({ enterpriseAddress: 1, status: 1 });
    await db.collection('credential_requests').createIndex({ workerAddress: 1 });
    await db.collection('credentials').createIndex({ workerAddress: 1 });
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
  const { walletAddress, name, phone, address, city, state, pincode, verificationStatus, role } = req.body;

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
          role: role || '',
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

// POST /api/credential-requests - Worker requests credential from enterprise
app.post('/api/credential-requests', async (req, res) => {
  const { workerAddress, enterpriseAddress, message } = req.body;

  if (!workerAddress || !enterpriseAddress) {
    return res.status(400).json({ error: 'Missing workerAddress or enterpriseAddress' });
  }

  try {
    const doc = {
      workerAddress: workerAddress.toLowerCase(),
      enterpriseAddress: enterpriseAddress.toLowerCase(),
      message: message || '',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db.collection('credential_requests').insertOne(doc);
    res.json({ success: true, request: { ...doc, _id: result.insertedId } });
  } catch (error) {
    console.error('Error creating credential request:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/credential-requests?enterprise=0x...&worker=0x...
app.get('/api/credential-requests', async (req, res) => {
  const { enterprise, worker } = req.query;

  if (!enterprise && !worker) {
    return res.status(400).json({ error: 'Missing enterprise or worker parameter' });
  }

  try {
    const filter = {};
    if (enterprise) filter.enterpriseAddress = enterprise.toLowerCase();
    if (worker) filter.workerAddress = worker.toLowerCase();

    const requests = await db.collection('credential_requests')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    res.json(requests);
  } catch (error) {
    console.error('Error fetching credential requests:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// PATCH /api/credential-requests/:id - Approve or reject a request
app.patch('/api/credential-requests/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be approved or rejected' });
  }

  try {
    const result = await db.collection('credential_requests').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ success: true, request: result });
  } catch (error) {
    console.error('Error updating credential request:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/credentials - Save credential server-side when enterprise issues
app.post('/api/credentials', async (req, res) => {
  const { workerAddress, enterpriseAddress, platform, rating, deliveries, years, type, txHash, onChain } = req.body;

  if (!workerAddress || !enterpriseAddress || !platform) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const doc = {
      workerAddress: workerAddress.toLowerCase(),
      enterpriseAddress: enterpriseAddress.toLowerCase(),
      platform,
      rating: parseFloat(rating) || 0,
      deliveries: parseInt(deliveries) || 0,
      years: parseFloat(years) || 0,
      type: type || 'WorkRating',
      txHash: txHash || null,
      onChain: onChain || false,
      issuedAt: new Date(),
    };
    const result = await db.collection('credentials').insertOne(doc);
    res.json({ success: true, credential: { ...doc, _id: result.insertedId } });
  } catch (error) {
    console.error('Error saving credential:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/discover/workers - Discover workers with city/state/rating filters
app.get('/api/discover/workers', async (req, res) => {
  const { city, state, minRating, page = 1, limit = 20 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  try {
    const pipeline = [];

    // Match workers by role
    const matchStage = { role: 'worker' };
    if (city) matchStage.city = { $regex: new RegExp(city, 'i') };
    if (state) matchStage.state = { $regex: new RegExp(state, 'i') };
    pipeline.push({ $match: matchStage });

    // Lookup credentials
    pipeline.push({
      $lookup: {
        from: 'credentials',
        localField: 'walletAddress',
        foreignField: 'workerAddress',
        as: 'credentialsList',
      },
    });

    // Calculate aggregated fields
    pipeline.push({
      $addFields: {
        avgRating: {
          $cond: {
            if: { $gt: [{ $size: '$credentialsList' }, 0] },
            then: { $round: [{ $avg: '$credentialsList.rating' }, 1] },
            else: 0,
          },
        },
        totalCredentials: { $size: '$credentialsList' },
        totalDeliveries: { $sum: '$credentialsList.deliveries' },
      },
    });

    // Filter by minimum rating
    if (minRating) {
      pipeline.push({ $match: { avgRating: { $gte: parseFloat(minRating) } } });
    }

    // Count total before pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await db.collection('profiles').aggregate(countPipeline).toArray();
    const total = countResult[0]?.total || 0;

    // Sort, paginate, project
    pipeline.push({ $sort: { avgRating: -1 } });
    pipeline.push({ $skip: (pageNum - 1) * limitNum });
    pipeline.push({ $limit: limitNum });
    pipeline.push({
      $project: {
        _id: 0,
        walletAddress: 1,
        name: 1,
        city: 1,
        state: 1,
        phone: 1,
        avgRating: 1,
        totalCredentials: 1,
        totalDeliveries: 1,
        credentials: {
          $map: {
            input: '$credentialsList',
            as: 'cred',
            in: {
              platform: '$$cred.platform',
              rating: '$$cred.rating',
              deliveries: '$$cred.deliveries',
              years: '$$cred.years',
            },
          },
        },
      },
    });

    const workers = await db.collection('profiles').aggregate(pipeline).toArray();
    res.json({ workers, total });
  } catch (error) {
    console.error('Error discovering workers:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/discover/filters - Get distinct cities and states for filters
app.get('/api/discover/filters', async (req, res) => {
  try {
    const cities = await db.collection('profiles').distinct('city', { role: 'worker', city: { $ne: '' } });
    const states = await db.collection('profiles').distinct('state', { role: 'worker', state: { $ne: '' } });
    res.json({ cities: cities.sort(), states: states.sort() });
  } catch (error) {
    console.error('Error fetching discover filters:', error);
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
