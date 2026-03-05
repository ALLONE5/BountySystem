const axios = require('axios');

async function diagnoseLogo() {
  console.log('🔍 Diagnosing Logo Display Issue...\n');

  try {
    // 1. Check system config API
    console.log('1. Checking System Config API...');
    const configResponse = await axios.get('http://localhost:3000/api/public/config');
    const config = configResponse.data.data;
    
    console.log('✅ System Config loaded:');
    console.log(`   Site Name: "${config.siteName}"`);
    console.log(`   Logo URL: "${config.logoUrl}"`);
    console.log(`   Description: "${config.siteDescription}"`);
    
    // 2. Test logo URL accessibility
    console.log('\n2. Testing Logo URL Accessibility...');
    if (config.logoUrl) {
      const fullLogoUrl = `http://localhost:3000${config.logoUrl}`;
      console.log(`   Testing: ${fullLogoUrl}`);
      
      try {
        const logoResponse = await axios.head(fullLogoUrl);
        console.log('✅ Logo is accessible');
        console.log(`   Status: ${logoResponse.status}`);
        console.log(`   Content-Type: ${logoResponse.headers['content-type']}`);
        console.log(`   Content-Length: ${logoResponse.headers['content-length']} bytes`);
      } catch (logoError) {
        console.log('❌ Logo is NOT accessible');
        console.log(`   Error: ${logoError.response?.status} - ${logoError.response?.statusText}`);
        console.log(`   Message: ${logoError.message}`);
      }
    } else {
      console.log('⚠️  No logo URL configured in system config');
    }
    
    // 3. Check frontend environment variables
    console.log('\n3. Checking Frontend Configuration...');
    console.log('   Frontend should be running on: http://localhost:5173');
    console.log('   Backend API should be: http://localhost:3000');
    
    // 4. Test CORS and static file serving
    console.log('\n4. Testing Static File Serving...');
    try {
      const staticResponse = await axios.get('http://localhost:3000/uploads/logos/', {
        validateStatus: () => true // Accept any status code
      });
      console.log(`   Static directory response: ${staticResponse.status}`);
      
      if (staticResponse.status === 200) {
        console.log('✅ Static file serving is working');
      } else if (staticResponse.status === 403) {
        console.log('⚠️  Directory listing disabled (normal)');
      } else {
        console.log('❌ Static file serving may have issues');
      }
    } catch (error) {
      console.log('❌ Static file serving error:', error.message);
    }
    
    // 5. Check if logo file exists on filesystem
    console.log('\n5. Checking Logo File on Filesystem...');
    const fs = require('fs');
    const path = require('path');
    
    if (config.logoUrl) {
      const logoPath = path.join('packages/backend/public', config.logoUrl);
      const altLogoPath = path.join('packages/backend', config.logoUrl);
      
      console.log(`   Checking: ${logoPath}`);
      if (fs.existsSync(logoPath)) {
        const stats = fs.statSync(logoPath);
        console.log('✅ Logo file exists on filesystem');
        console.log(`   Size: ${stats.size} bytes`);
        console.log(`   Modified: ${stats.mtime}`);
      } else {
        console.log('❌ Logo file NOT found at expected path');
        console.log(`   Also checking: ${altLogoPath}`);
        if (fs.existsSync(altLogoPath)) {
          const stats = fs.statSync(altLogoPath);
          console.log('✅ Logo file found at alternate path');
          console.log(`   Size: ${stats.size} bytes`);
        } else {
          console.log('❌ Logo file not found at alternate path either');
        }
      }
    }
    
    // 6. Provide troubleshooting steps
    console.log('\n6. Troubleshooting Steps:');
    console.log('   a) Check if backend server is running on port 3000');
    console.log('   b) Check if frontend can access backend API');
    console.log('   c) Verify static file serving configuration');
    console.log('   d) Check browser console for CORS errors');
    console.log('   e) Verify logo file exists and has correct permissions');
    
    // 7. Test frontend API client configuration
    console.log('\n7. Frontend API Configuration Check...');
    console.log('   The frontend should use VITE_API_BASE_URL or default to http://localhost:3000');
    console.log('   Logo URLs should be constructed as: baseURL + logoUrl');
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🚨 Backend server is not running!');
      console.log('   Please start the backend server first:');
      console.log('   cd packages/backend && npm run dev');
    }
  }
}

diagnoseLogo();