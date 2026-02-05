/**
 * Script to populate ranking data
 * This should be run by an admin to calculate rankings for all periods
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

async function populateRankings() {
  console.log('Starting ranking population...');

  // You need to provide an admin token
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken) {
    console.error('Error: ADMIN_TOKEN environment variable is required');
    console.log('Usage: ADMIN_TOKEN=your_admin_token node populate-rankings.js');
    process.exit(1);
  }

  try {
    console.log('Calling update-all rankings endpoint...');
    const response = await axios.post(
      `${API_URL}/rankings/update-all`,
      {},
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

    console.log('Success!');
    console.log(`Monthly rankings: ${response.data.monthly} records`);
    console.log(`Quarterly rankings: ${response.data.quarterly} records`);
    console.log(`All-time rankings: ${response.data.allTime} records`);
  } catch (error) {
    console.error('Error populating rankings:', error.response?.data || error.message);
    process.exit(1);
  }
}

populateRankings();
