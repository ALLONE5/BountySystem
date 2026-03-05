const axios = require('axios');

async function testLogoAccess() {
  try {
    console.log('Testing logo access...');
    
    const logoUrl = 'http://localhost:3000/uploads/logos/logo_1770711966867.png';
    console.log('Testing URL:', logoUrl);
    
    const response = await axios.head(logoUrl);
    console.log('Logo accessible - Status:', response.status);
    console.log('Content-Type:', response.headers['content-type']);
    console.log('Content-Length:', response.headers['content-length']);
    
  } catch (error) {
    if (error.response) {
      console.log('Logo not accessible - Status:', error.response.status);
      console.log('Error:', error.response.statusText);
    } else {
      console.log('Network error:', error.message);
    }
  }
}

testLogoAccess();