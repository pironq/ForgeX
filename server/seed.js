import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

function randomAddress() {
  return '0x' + crypto.randomBytes(20).toString('hex');
}

const WORKERS = [
  // === FARIDABAD (20 workers) ===
  { name: 'Rohit Sharma', city: 'Faridabad', state: 'Haryana', pincode: '121001', phone: '+91 98100 10001', address: 'Sector 15, NIT' },
  { name: 'Pooja Yadav', city: 'Faridabad', state: 'Haryana', pincode: '121002', phone: '+91 98100 10002', address: 'Sector 21C, NHPC Chowk' },
  { name: 'Vikas Tomar', city: 'Faridabad', state: 'Haryana', pincode: '121003', phone: '+91 98100 10003', address: 'Sector 28, Mathura Road' },
  { name: 'Neha Chauhan', city: 'Faridabad', state: 'Haryana', pincode: '121001', phone: '+91 98100 10004', address: 'Sector 16A, Market' },
  { name: 'Amit Kumar', city: 'Faridabad', state: 'Haryana', pincode: '121004', phone: '+91 98100 10005', address: 'Sector 37, Dabua Colony' },
  { name: 'Priya Singh', city: 'Faridabad', state: 'Haryana', pincode: '121006', phone: '+91 98100 10006', address: 'Sector 46, Surajkund Road' },
  { name: 'Deepak Panwar', city: 'Faridabad', state: 'Haryana', pincode: '121002', phone: '+91 98100 10007', address: 'Sector 19, Old Faridabad' },
  { name: 'Ritu Devi', city: 'Faridabad', state: 'Haryana', pincode: '121005', phone: '+91 98100 10008', address: 'Ballabgarh, Main Road' },
  { name: 'Saurabh Malik', city: 'Faridabad', state: 'Haryana', pincode: '121001', phone: '+91 98100 10009', address: 'Sector 14, Crown Mall' },
  { name: 'Anjali Rawat', city: 'Faridabad', state: 'Haryana', pincode: '121003', phone: '+91 98100 10010', address: 'Sector 31, BPTP' },
  { name: 'Manish Goel', city: 'Faridabad', state: 'Haryana', pincode: '121009', phone: '+91 98100 10011', address: 'Greenfields Colony' },
  { name: 'Sunita Rani', city: 'Faridabad', state: 'Haryana', pincode: '121004', phone: '+91 98100 10012', address: 'Sector 36, Ashoka Enclave' },
  { name: 'Pankaj Verma', city: 'Faridabad', state: 'Haryana', pincode: '121001', phone: '+91 98100 10013', address: 'NIT 5, Main Market' },
  { name: 'Kavita Jain', city: 'Faridabad', state: 'Haryana', pincode: '121007', phone: '+91 98100 10014', address: 'Sector 62, Ballabgarh' },
  { name: 'Rahul Bhardwaj', city: 'Faridabad', state: 'Haryana', pincode: '121002', phone: '+91 98100 10015', address: 'Sector 20, Ajronda' },
  { name: 'Monika Aggarwal', city: 'Faridabad', state: 'Haryana', pincode: '121003', phone: '+91 98100 10016', address: 'Sector 29, Town Park' },
  { name: 'Naveen Saini', city: 'Faridabad', state: 'Haryana', pincode: '121001', phone: '+91 98100 10017', address: 'Sector 17, Huda Market' },
  { name: 'Sapna Dagar', city: 'Faridabad', state: 'Haryana', pincode: '121005', phone: '+91 98100 10018', address: 'Sector 48, Neelam Chowk' },
  { name: 'Yogesh Tanwar', city: 'Faridabad', state: 'Haryana', pincode: '121006', phone: '+91 98100 10019', address: 'Sector 43, Aravali Hills' },
  { name: 'Rekha Pundir', city: 'Faridabad', state: 'Haryana', pincode: '121004', phone: '+91 98100 10020', address: 'Sector 33, SRS Residency' },

  // === OTHER HARYANA CITIES (5 workers) ===
  { name: 'Sunil Hooda', city: 'Gurugram', state: 'Haryana', pincode: '122001', phone: '+91 98100 10021', address: 'Sector 29, Cyber City' },
  { name: 'Preeti Sangwan', city: 'Gurugram', state: 'Haryana', pincode: '122018', phone: '+91 98100 10022', address: 'DLF Phase 3' },
  { name: 'Rakesh Dahiya', city: 'Palwal', state: 'Haryana', pincode: '121102', phone: '+91 98100 10023', address: 'GT Road, Bus Stand' },
  { name: 'Aarti Phogat', city: 'Rohtak', state: 'Haryana', pincode: '124001', phone: '+91 98100 10024', address: 'Model Town' },
  { name: 'Vikrant Sehrawat', city: 'Sonipat', state: 'Haryana', pincode: '131001', phone: '+91 98100 10025', address: 'Sector 14, Atlas Road' },

  // === DELHI NCR (5 workers) ===
  { name: 'Rajesh Kumar', city: 'New Delhi', state: 'Delhi', pincode: '110001', phone: '+91 98100 10026', address: 'Connaught Place' },
  { name: 'Meena Kumari', city: 'New Delhi', state: 'Delhi', pincode: '110025', phone: '+91 98100 10027', address: 'Lajpat Nagar' },
  { name: 'Arun Thakur', city: 'Noida', state: 'Uttar Pradesh', pincode: '201301', phone: '+91 98100 10028', address: 'Sector 18, Atta Market' },
  { name: 'Nisha Gupta', city: 'Ghaziabad', state: 'Uttar Pradesh', pincode: '201001', phone: '+91 98100 10029', address: 'Raj Nagar Extension' },
  { name: 'Tarun Choudhary', city: 'Greater Noida', state: 'Uttar Pradesh', pincode: '201310', phone: '+91 98100 10030', address: 'Pari Chowk' },

  // === OTHER CITIES (5 workers) ===
  { name: 'Sneha Reddy', city: 'Hyderabad', state: 'Telangana', pincode: '500001', phone: '+91 98100 10031', address: 'Banjara Hills' },
  { name: 'Anita Desai', city: 'Bangalore', state: 'Karnataka', pincode: '560001', phone: '+91 98100 10032', address: 'Koramangala' },
  { name: 'Rahul Verma', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', phone: '+91 98100 10033', address: 'Andheri West' },
  { name: 'Karthik Rajan', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001', phone: '+91 98100 10034', address: 'T Nagar' },
  { name: 'Pooja Joshi', city: 'Jaipur', state: 'Rajasthan', pincode: '302001', phone: '+91 98100 10035', address: 'MI Road' },
];

const PLATFORMS = ['Swiggy', 'Zomato', 'Uber', 'Ola', 'Dunzo', 'Urban Company', 'Blinkit', 'BigBasket', 'Rapido', 'Porter'];

async function seed() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('credchain');

  // Build profiles with random wallet addresses
  const profiles = WORKERS.map((w) => ({
    walletAddress: randomAddress(),
    name: w.name,
    phone: w.phone,
    address: w.address,
    city: w.city,
    state: w.state,
    pincode: w.pincode,
    role: 'worker',
    verificationStatus: 'verified',
    createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  }));

  // Insert profiles
  await db.collection('profiles').insertMany(profiles);
  console.log(`Inserted ${profiles.length} worker profiles`);

  // Build credentials (2-3 per worker)
  const credentials = [];
  for (const profile of profiles) {
    const numCreds = 2 + Math.floor(Math.random() * 2); // 2 or 3
    const usedPlatforms = new Set();
    for (let i = 0; i < numCreds; i++) {
      let platform;
      do {
        platform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
      } while (usedPlatforms.has(platform));
      usedPlatforms.add(platform);

      credentials.push({
        workerAddress: profile.walletAddress,
        enterpriseAddress: randomAddress(),
        platform,
        rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
        deliveries: 100 + Math.floor(Math.random() * 2400),
        years: parseFloat((0.5 + Math.random() * 4.0).toFixed(1)),
        type: 'WorkRating',
        txHash: null,
        onChain: false,
        issuedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      });
    }
  }

  await db.collection('credentials').insertMany(credentials);
  console.log(`Inserted ${credentials.length} credential records`);

  await client.close();
  console.log('Seed complete!');
}

seed().catch(console.error);
