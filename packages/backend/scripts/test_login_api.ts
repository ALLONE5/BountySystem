
import fetch from 'node-fetch';

async function testLogin() {
  const url = 'http://localhost:3000/api/auth/login';
  const body = {
    username: 'admin',
    password: 'Password123'
  };

  console.log(`Attempting login to ${url}...`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('Login request failed:', error.message);
  }
}

testLogin();
