
// import fetch from 'node-fetch'; // Built-in in Node 18+

async function testLogin() {
  console.log('Testing login for user "admin"...');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'Password123',
      }),
    });

    const data = await response.json();
    
    console.log('Status:', response.status);
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('Token:', data.token ? 'Present' : 'Missing');
      console.log('User:', data.user);
    } else {
      console.log('❌ Login failed!');
      console.log('Error:', data);
    }
  } catch (error) {
    console.error('Error connecting to server:', error);
  }
}

testLogin();
