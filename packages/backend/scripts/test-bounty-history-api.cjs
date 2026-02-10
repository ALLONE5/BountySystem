const http = require('http');

// Test the bounty history API endpoint
async function testAPI() {
  // Get a user ID first
  const { Pool } = require('pg');
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'bounty_hunter',
    user: 'postgres',
    password: '123456',
  });
  
  try {
    const userResult = await pool.query("SELECT id, username FROM users WHERE username = 'user1' LIMIT 1");
    
    if (userResult.rows.length === 0) {
      console.log('❌ No user found with username "user1"');
      return;
    }
    
    const userId = userResult.rows[0].id;
    const username = userResult.rows[0].username;
    
    console.log(`Testing API for user: ${username} (${userId})\n`);
    
    // Test the API endpoint
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/bounty-history/${userId}?page=1&limit=20`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    console.log(`Making request to: http://localhost:3000${options.path}\n`);
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Headers:`, res.headers);
        console.log('\nResponse Body:');
        
        try {
          const json = JSON.parse(data);
          console.log(JSON.stringify(json, null, 2));
          
          if (json.transactions) {
            console.log(`\n✓ Found ${json.transactions.length} transactions`);
            console.log(`✓ Total count: ${json.pagination.totalCount}`);
            console.log(`✓ Summary: Earned ${json.summary.totalEarned}, Spent ${json.summary.totalSpent}`);
          }
        } catch (e) {
          console.log(data);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      console.error('\nMake sure the backend server is running on port 3000');
    });
    
    req.end();
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

testAPI();
