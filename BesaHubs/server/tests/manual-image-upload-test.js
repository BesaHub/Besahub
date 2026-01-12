const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';

const createTestImage = (filename, size = 1024) => {
  const buffer = Buffer.alloc(size);
  buffer.writeUInt8(0xFF, 0);
  buffer.writeUInt8(0xD8, 1);
  buffer.writeUInt8(0xFF, 2);
  buffer.write('JFIF', 6);
  return buffer;
};

const createTestPNG = (size = 1024) => {
  const buffer = Buffer.alloc(size);
  const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  pngSignature.forEach((byte, index) => {
    buffer.writeUInt8(byte, index);
  });
  return buffer;
};

const createMaliciousFile = (type) => {
  const buffer = Buffer.alloc(1024);
  
  if (type === 'script') {
    buffer.write('<?php eval($_GET["cmd"]); ?>');
  } else if (type === 'executable') {
    buffer.writeUInt8(0x4D, 0);
    buffer.writeUInt8(0x5A, 1);
  }
  
  return buffer;
};

const testResults = {
  passed: [],
  failed: [],
  security: {
    passed: [],
    failed: []
  }
};

async function login() {
  try {
    console.log('\n🔐 Logging in as admin...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: process.env.ADMIN_EMAIL || 'admin@demo.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@Demo123'
    });
    
    console.log('✅ Login successful');
    return response.data.token;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function getTestProperty(token) {
  try {
    const response = await axios.get(`${BASE_URL}/properties?limit=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.properties && response.data.properties.length > 0) {
      return response.data.properties[0];
    }
    return null;
  } catch (error) {
    console.error('Error getting test property:', error.message);
    return null;
  }
}

async function getTestContact(token) {
  try {
    const response = await axios.get(`${BASE_URL}/contacts?limit=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.contacts && response.data.contacts.length > 0) {
      return response.data.contacts[0];
    }
    return null;
  } catch (error) {
    console.error('Error getting test contact:', error.message);
    return null;
  }
}

async function getTestCompany(token) {
  try {
    const response = await axios.get(`${BASE_URL}/companies?limit=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.companies && response.data.companies.length > 0) {
      return response.data.companies[0];
    }
    return null;
  } catch (error) {
    console.error('Error getting test company:', error.message);
    return null;
  }
}

async function getCurrentUser(token) {
  try {
    const response = await axios.get(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.user;
  } catch (error) {
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return meResponse.data.user;
  }
}

async function testPropertyImageUpload(token, propertyId) {
  console.log('\n📸 Testing Property Image Upload...');
  
  try {
    const testImagePath = path.join(__dirname, 'temp-property-test.jpg');
    fs.writeFileSync(testImagePath, createTestImage(500 * 1024));
    
    const formData = new FormData();
    formData.append('files', fs.createReadStream(testImagePath));
    
    const response = await axios.post(
      `${BASE_URL}/properties/${propertyId}/images`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    fs.unlinkSync(testImagePath);
    
    if (response.status === 200 && response.data.images) {
      console.log('✅ Property image upload successful');
      console.log('   Uploaded images:', response.data.images);
      testResults.passed.push('Property Image Upload');
      return true;
    }
    
    testResults.failed.push({test: 'Property Image Upload', reason: 'No images in response'});
    return false;
  } catch (error) {
    fs.existsSync(path.join(__dirname, 'temp-property-test.jpg')) && 
      fs.unlinkSync(path.join(__dirname, 'temp-property-test.jpg'));
    console.error('❌ Property image upload failed:', error.response?.data || error.message);
    testResults.failed.push({test: 'Property Image Upload', reason: error.message});
    return false;
  }
}

async function testUserAvatarUpload(token, userId) {
  console.log('\n👤 Testing User Avatar Upload...');
  
  try {
    const testImagePath = path.join(__dirname, 'temp-avatar-test.jpg');
    fs.writeFileSync(testImagePath, createTestImage(500 * 1024));
    
    const formData = new FormData();
    formData.append('files', fs.createReadStream(testImagePath));
    
    const response = await axios.post(
      `${BASE_URL}/users/${userId}/avatar`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    fs.unlinkSync(testImagePath);
    
    if (response.status === 200 && response.data.avatar) {
      console.log('✅ User avatar upload successful');
      console.log('   Avatar URL:', response.data.avatar);
      testResults.passed.push('User Avatar Upload');
      return true;
    }
    
    testResults.failed.push({test: 'User Avatar Upload', reason: 'No avatar in response'});
    return false;
  } catch (error) {
    fs.existsSync(path.join(__dirname, 'temp-avatar-test.jpg')) && 
      fs.unlinkSync(path.join(__dirname, 'temp-avatar-test.jpg'));
    console.error('❌ User avatar upload failed:', error.response?.data || error.message);
    testResults.failed.push({test: 'User Avatar Upload', reason: error.message});
    return false;
  }
}

async function testContactAvatarUpload(token, contactId) {
  console.log('\n📇 Testing Contact Avatar Upload...');
  
  try {
    const testImagePath = path.join(__dirname, 'temp-contact-avatar-test.jpg');
    fs.writeFileSync(testImagePath, createTestImage(500 * 1024));
    
    const formData = new FormData();
    formData.append('avatar', fs.createReadStream(testImagePath));
    
    const response = await axios.post(
      `${BASE_URL}/contacts/${contactId}/avatar`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    fs.unlinkSync(testImagePath);
    
    if (response.status === 200 && response.data.avatar) {
      console.log('✅ Contact avatar upload successful');
      console.log('   Avatar URL:', response.data.avatar);
      testResults.passed.push('Contact Avatar Upload');
      return true;
    }
    
    testResults.failed.push({test: 'Contact Avatar Upload', reason: 'No avatar in response'});
    return false;
  } catch (error) {
    fs.existsSync(path.join(__dirname, 'temp-contact-avatar-test.jpg')) && 
      fs.unlinkSync(path.join(__dirname, 'temp-contact-avatar-test.jpg'));
    console.error('❌ Contact avatar upload failed:', error.response?.data || error.message);
    testResults.failed.push({test: 'Contact Avatar Upload', reason: error.message});
    return false;
  }
}

async function testCompanyLogoUpload(token, companyId) {
  console.log('\n🏢 Testing Company Logo Upload...');
  
  try {
    const testImagePath = path.join(__dirname, 'temp-company-logo-test.png');
    fs.writeFileSync(testImagePath, createTestPNG(500 * 1024));
    
    const formData = new FormData();
    formData.append('logo', fs.createReadStream(testImagePath));
    
    const response = await axios.post(
      `${BASE_URL}/companies/${companyId}/logo`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    fs.unlinkSync(testImagePath);
    
    if (response.status === 200 && response.data.logo) {
      console.log('✅ Company logo upload successful');
      console.log('   Logo URL:', response.data.logo);
      testResults.passed.push('Company Logo Upload');
      return true;
    }
    
    testResults.failed.push({test: 'Company Logo Upload', reason: 'No logo in response'});
    return false;
  } catch (error) {
    fs.existsSync(path.join(__dirname, 'temp-company-logo-test.png')) && 
      fs.unlinkSync(path.join(__dirname, 'temp-company-logo-test.png'));
    console.error('❌ Company logo upload failed:', error.response?.data || error.message);
    testResults.failed.push({test: 'Company Logo Upload', reason: error.message});
    return false;
  }
}

async function testFileSizeLimit(token, propertyId) {
  console.log('\n📏 Testing File Size Limit (should reject >5MB)...');
  
  try {
    const testImagePath = path.join(__dirname, 'temp-large-test.jpg');
    fs.writeFileSync(testImagePath, createTestImage(6 * 1024 * 1024));
    
    const formData = new FormData();
    formData.append('files', fs.createReadStream(testImagePath));
    
    try {
      await axios.post(
        `${BASE_URL}/properties/${propertyId}/images`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      fs.unlinkSync(testImagePath);
      console.error('❌ File size limit test failed: Large file was accepted');
      testResults.security.failed.push({test: 'File Size Limit', reason: 'Large file accepted'});
      return false;
    } catch (error) {
      fs.unlinkSync(testImagePath);
      
      if (error.response?.status === 400 && error.response?.data?.error?.includes('too large')) {
        console.log('✅ File size limit working correctly');
        testResults.security.passed.push('File Size Limit Enforcement');
        return true;
      }
      
      console.error('❌ Unexpected error in file size test:', error.message);
      testResults.security.failed.push({test: 'File Size Limit', reason: error.message});
      return false;
    }
  } catch (error) {
    console.error('❌ File size limit test error:', error.message);
    testResults.security.failed.push({test: 'File Size Limit', reason: error.message});
    return false;
  }
}

async function testMaliciousFile(token, propertyId) {
  console.log('\n🛡️  Testing Malicious File Rejection...');
  
  try {
    const testFilePath = path.join(__dirname, 'temp-malware-test.jpg');
    fs.writeFileSync(testFilePath, createMaliciousFile('script'));
    
    const formData = new FormData();
    formData.append('files', fs.createReadStream(testFilePath));
    
    try {
      await axios.post(
        `${BASE_URL}/properties/${propertyId}/images`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      fs.unlinkSync(testFilePath);
      console.error('❌ Malicious file test failed: Script was accepted');
      testResults.security.failed.push({test: 'Malicious File Rejection', reason: 'Script accepted'});
      return false;
    } catch (error) {
      fs.unlinkSync(testFilePath);
      
      if (error.response?.status === 400) {
        console.log('✅ Malicious file rejected correctly');
        testResults.security.passed.push('Malicious File Rejection');
        return true;
      }
      
      console.error('❌ Unexpected error in malicious file test:', error.message);
      testResults.security.failed.push({test: 'Malicious File Rejection', reason: error.message});
      return false;
    }
  } catch (error) {
    console.error('❌ Malicious file test error:', error.message);
    testResults.security.failed.push({test: 'Malicious File Rejection', reason: error.message});
    return false;
  }
}

async function testDoubleExtension(token, propertyId) {
  console.log('\n🔒 Testing Double Extension Rejection...');
  
  try {
    const testFilePath = path.join(__dirname, 'temp-double.php.jpg');
    fs.writeFileSync(testFilePath, createTestImage());
    
    const formData = new FormData();
    formData.append('files', fs.createReadStream(testFilePath));
    
    try {
      await axios.post(
        `${BASE_URL}/properties/${propertyId}/images`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      fs.unlinkSync(testFilePath);
      console.error('❌ Double extension test failed: File was accepted');
      testResults.security.failed.push({test: 'Double Extension Rejection', reason: 'Double extension accepted'});
      return false;
    } catch (error) {
      fs.unlinkSync(testFilePath);
      
      if (error.response?.status === 400 && error.response?.data?.error?.includes('Double extensions')) {
        console.log('✅ Double extension rejected correctly');
        testResults.security.passed.push('Double Extension Rejection');
        return true;
      }
      
      console.error('❌ Unexpected error in double extension test:', error.message);
      testResults.security.failed.push({test: 'Double Extension Rejection', reason: error.message});
      return false;
    }
  } catch (error) {
    console.error('❌ Double extension test error:', error.message);
    testResults.security.failed.push({test: 'Double Extension Rejection', reason: error.message});
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Image Upload Tests\n');
  console.log('═'.repeat(60));
  
  try {
    const token = await login();
    const user = await getCurrentUser(token);
    
    console.log(`\n👤 Testing as: ${user.firstName} ${user.lastName} (${user.role})`);
    
    const property = await getTestProperty(token);
    const contact = await getTestContact(token);
    const company = await getTestCompany(token);
    
    if (property) {
      console.log(`\n🏢 Test Property: ${property.name} (ID: ${property.id})`);
      await testPropertyImageUpload(token, property.id);
      await testFileSizeLimit(token, property.id);
      await testMaliciousFile(token, property.id);
      await testDoubleExtension(token, property.id);
    } else {
      console.log('\n⚠️  No properties found to test property image upload');
    }
    
    if (user) {
      await testUserAvatarUpload(token, user.id);
    }
    
    if (contact) {
      console.log(`\n📇 Test Contact: ${contact.firstName} ${contact.lastName} (ID: ${contact.id})`);
      await testContactAvatarUpload(token, contact.id);
    } else {
      console.log('\n⚠️  No contacts found to test contact avatar upload');
    }
    
    if (company) {
      console.log(`\n🏢 Test Company: ${company.name} (ID: ${company.id})`);
      await testCompanyLogoUpload(token, company.id);
    } else {
      console.log('\n⚠️  No companies found to test company logo upload');
    }
    
    console.log('\n═'.repeat(60));
    console.log('\n📊 TEST RESULTS SUMMARY\n');
    console.log(`✅ Passed: ${testResults.passed.length}`);
    testResults.passed.forEach(test => console.log(`   - ${test}`));
    
    console.log(`\n❌ Failed: ${testResults.failed.length}`);
    testResults.failed.forEach(result => {
      console.log(`   - ${result.test}: ${result.reason}`);
    });
    
    console.log(`\n🛡️  Security Tests:`);
    console.log(`   ✅ Passed: ${testResults.security.passed.length}`);
    testResults.security.passed.forEach(test => console.log(`      - ${test}`));
    
    console.log(`   ❌ Failed: ${testResults.security.failed.length}`);
    testResults.security.failed.forEach(result => {
      console.log(`      - ${result.test}: ${result.reason}`);
    });
    
    console.log('\n═'.repeat(60));
    
    const totalTests = testResults.passed.length + testResults.failed.length + 
                       testResults.security.passed.length + testResults.security.failed.length;
    const passedTests = testResults.passed.length + testResults.security.passed.length;
    const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
    
    console.log(`\n📈 Overall Success Rate: ${successRate}% (${passedTests}/${totalTests})`);
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ Test run failed:', error.message);
    process.exit(1);
  }
}

runTests().catch(console.error);
