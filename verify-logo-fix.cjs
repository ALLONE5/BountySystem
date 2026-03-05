const axios = require('axios');

async function verifyLogoFix() {
  console.log('🔍 Verifying Logo Display Fix...\n');

  try {
    // 1. Test system config API
    console.log('1. Testing System Config API...');
    const configResponse = await axios.get('http://localhost:3000/api/public/config');
    const config = configResponse.data.data;
    
    console.log('✅ System Config loaded:');
    console.log(`   Site Name: "${config.siteName}"`);
    console.log(`   Logo URL: "${config.logoUrl}"`);
    
    // 2. Test logo accessibility with correct URL construction
    console.log('\n2. Testing Logo URL Construction...');
    if (config.logoUrl) {
      const baseUrl = 'http://localhost:3000';
      const fullLogoUrl = config.logoUrl.startsWith('http') 
        ? config.logoUrl 
        : `${baseUrl}${config.logoUrl}`;
      
      console.log(`   Constructed URL: ${fullLogoUrl}`);
      
      try {
        const logoResponse = await axios.head(fullLogoUrl);
        console.log('✅ Logo is accessible with correct URL construction');
        console.log(`   Status: ${logoResponse.status}`);
        console.log(`   Content-Type: ${logoResponse.headers['content-type']}`);
      } catch (logoError) {
        console.log('❌ Logo still not accessible');
        console.log(`   Error: ${logoError.response?.status} - ${logoError.response?.statusText}`);
      }
    }
    
    // 3. Verify frontend components have been updated
    console.log('\n3. Verifying Frontend Component Updates...');
    const fs = require('fs');
    
    const filesToCheck = [
      'packages/frontend/src/layouts/ModernLayout.tsx',
      'packages/frontend/src/layouts/DiscordLayout.tsx',
      'packages/frontend/src/pages/auth/LoginPage.tsx',
      'packages/frontend/src/pages/auth/SimpleLoginPage.tsx',
      'packages/frontend/src/contexts/SystemConfigContext.tsx'
    ];
    
    let allFilesFixed = true;
    
    for (const filePath of filesToCheck) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check if file has proper URL construction
        const hasCorrectUrlConstruction = 
          content.includes('systemConfig.logoUrl.startsWith(\'http\')') ||
          content.includes('VITE_API_URL?.replace(\'/api\', \'\')') ||
          content.includes('http://localhost:3000${systemConfig.logoUrl}');
        
        if (hasCorrectUrlConstruction) {
          console.log(`✅ ${filePath.split('/').pop()} - Has correct URL construction`);
        } else {
          console.log(`⚠️  ${filePath.split('/').pop()} - May need URL construction fix`);
          allFilesFixed = false;
        }
      }
    }
    
    console.log('\n4. Fix Summary:');
    if (allFilesFixed) {
      console.log('✅ All components updated with correct URL construction');
    } else {
      console.log('⚠️  Some components may still need updates');
    }
    
    console.log('\n5. Expected Behavior:');
    console.log('   - Logo URLs will be constructed as: http://localhost:3000/uploads/logos/xxx.png');
    console.log('   - Frontend components will display logos correctly');
    console.log('   - Fallback to OCT text logo when image fails to load');
    console.log('   - Error handling for failed logo loads');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Restart frontend development server: cd packages/frontend && npm run dev');
    console.log('2. Clear browser cache and refresh the page');
    console.log('3. Check browser console for any logo loading errors');
    console.log('4. Verify logo displays correctly in all layouts');
    
    return true;
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🚨 Backend server is not running!');
      console.log('   Please start the backend server: cd packages/backend && npm run dev');
    }
    return false;
  }
}

verifyLogoFix().then(success => {
  if (success) {
    console.log('\n✅ Logo fix verification complete!');
  } else {
    console.log('\n❌ Logo fix verification failed. Please check the logs above.');
  }
});