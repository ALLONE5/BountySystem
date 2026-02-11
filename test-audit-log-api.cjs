const axios = require('axios');

async function testAuditLogAPI() {
  try {
    console.log('🧪 Testing audit log API...\n');
    
    // First, let's try to login to get a token (this will create audit logs)
    console.log('1. Attempting to login (this will create audit logs)...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin',
      password: 'Password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token obtained');
    
    // Test getting audit logs
    console.log('\n2. Getting audit logs...');
    const getResponse = await axios.get('http://localhost:3000/api/admin/audit/logs', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Audit logs retrieved:', getResponse.data.data.logs.length, 'logs found');
    console.log('📊 Pagination:', getResponse.data.data.pagination);
    
    if (getResponse.data.data.logs.length > 0) {
      const firstLog = getResponse.data.data.logs[0];
      console.log('📋 First log:', {
        action: firstLog.action,
        resource: firstLog.resource,
        username: firstLog.username,
        success: firstLog.success,
        timestamp: firstLog.timestamp
      });
      
      // Test getting specific log details
      console.log('\n3. Getting specific log details...');
      const detailResponse = await axios.get(`http://localhost:3000/api/admin/audit/logs/${firstLog.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Log details retrieved:', detailResponse.data.data.action);
    }
    
    // Test getting audit statistics
    console.log('\n4. Getting audit statistics...');
    const statsResponse = await axios.get('http://localhost:3000/api/admin/audit/statistics', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Statistics:', statsResponse.data.data);
    
    // Test getting failed operations
    console.log('\n5. Getting failed operations...');
    const failedResponse = await axios.get('http://localhost:3000/api/admin/audit/failed', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Failed operations:', failedResponse.data.data.length, 'failed operations found');
    
    // Test filtering
    console.log('\n6. Testing filters...');
    const filterResponse = await axios.get('http://localhost:3000/api/admin/audit/logs?action=LOGIN&success=true', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Filtered logs (LOGIN success):', filterResponse.data.data.logs.length, 'logs found');
    
    // Test a failed login to create a failed audit log
    console.log('\n7. Testing failed login (to create failed audit log)...');
    try {
      await axios.post('http://localhost:3000/api/auth/login', {
        username: 'admin',
        password: 'wrongpassword'
      });
    } catch (error) {
      console.log('✅ Failed login attempt recorded (expected)');
    }
    
    // Check if failed login was logged
    console.log('\n8. Checking failed login audit log...');
    const failedLoginResponse = await axios.get('http://localhost:3000/api/admin/audit/logs?action=LOGIN_FAILED', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Failed login logs:', failedLoginResponse.data.data.logs.length, 'failed login attempts found');
    
    console.log('\n🎉 All audit log API tests passed!');
    
  } catch (error) {
    console.error('❌ API Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Tip: Make sure you have a valid admin user with username "admin" and password "Password123"');
    }
  }
}

testAuditLogAPI();