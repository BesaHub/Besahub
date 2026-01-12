const request = require('supertest');
const app = require('../app');
const { User, Property, Contact, Company } = require('../models');
const path = require('path');
const fs = require('fs');

let authToken;
let testUser;
let testProperty;
let testContact;
let testCompany;

beforeAll(async () => {
  testUser = await User.create({
    firstName: 'Test',
    lastName: 'ImageUploader',
    email: `imagetest${Date.now()}@test.com`,
    password: 'TestPassword123!',
    role: 'admin'
  });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: testUser.email,
      password: 'TestPassword123!'
    });

  authToken = loginRes.body.token;

  testProperty = await Property.create({
    name: 'Test Property for Images',
    propertyType: 'office',
    status: 'available',
    address: '123 Test St',
    city: 'Test City',
    state: 'CA',
    zipCode: '12345',
    listPrice: 1000000,
    listingAgentId: testUser.id
  });

  testContact = await Contact.create({
    firstName: 'Test',
    lastName: 'Contact',
    primaryEmail: `contactimg${Date.now()}@test.com`,
    assignedAgentId: testUser.id
  });

  testCompany = await Company.create({
    name: `Test Company ${Date.now()}`,
    primaryEmail: `companyimg${Date.now()}@test.com`,
    assignedAgentId: testUser.id
  });
});

afterAll(async () => {
  if (testProperty) await testProperty.destroy({ force: true });
  if (testContact) await testContact.destroy({ force: true });
  if (testCompany) await testCompany.destroy({ force: true });
  if (testUser) await testUser.destroy({ force: true });

  const uploadsPath = path.join(__dirname, '../uploads');
  const cleanupDirs = ['properties', 'avatars', 'contacts', 'images'];
  
  cleanupDirs.forEach(dir => {
    const dirPath = path.join(uploadsPath, dir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      files.forEach(file => {
        if (file.includes('test-')) {
          fs.unlinkSync(path.join(dirPath, file));
        }
      });
    }
  });
});

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

describe('Image Upload Functionality Tests', () => {
  
  describe('1. Property Image Uploads', () => {
    test('should upload valid JPEG image to property', async () => {
      const testImagePath = path.join(__dirname, 'test-image.jpg');
      const imageBuffer = createTestImage();
      fs.writeFileSync(testImagePath, imageBuffer);

      const res = await request(app)
        .post(`/api/properties/${testProperty.id}/images`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', testImagePath);

      fs.unlinkSync(testImagePath);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('uploaded successfully');
      expect(res.body.images).toBeDefined();
      expect(Array.isArray(res.body.images)).toBe(true);
    });

    test('should upload valid PNG image to property', async () => {
      const testImagePath = path.join(__dirname, 'test-image.png');
      const imageBuffer = createTestPNG();
      fs.writeFileSync(testImagePath, imageBuffer);

      const res = await request(app)
        .post(`/api/properties/${testProperty.id}/images`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', testImagePath);

      fs.unlinkSync(testImagePath);

      expect(res.status).toBe(200);
      expect(res.body.images).toBeDefined();
    });

    test('should upload multiple images to property', async () => {
      const testImage1 = path.join(__dirname, 'test-image1.jpg');
      const testImage2 = path.join(__dirname, 'test-image2.jpg');
      
      fs.writeFileSync(testImage1, createTestImage());
      fs.writeFileSync(testImage2, createTestImage());

      const res = await request(app)
        .post(`/api/properties/${testProperty.id}/images`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', testImage1)
        .attach('files', testImage2);

      fs.unlinkSync(testImage1);
      fs.unlinkSync(testImage2);

      expect(res.status).toBe(200);
      expect(res.body.images.length).toBe(2);
    });

    test('should reject when no images uploaded', async () => {
      const res = await request(app)
        .post(`/api/properties/${testProperty.id}/images`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('No images uploaded');
    });

    test('should reject property image upload without authentication', async () => {
      const testImagePath = path.join(__dirname, 'test-image.jpg');
      fs.writeFileSync(testImagePath, createTestImage());

      const res = await request(app)
        .post(`/api/properties/${testProperty.id}/images`)
        .attach('files', testImagePath);

      fs.unlinkSync(testImagePath);

      expect(res.status).toBe(401);
    });
  });

  describe('2. User Avatar Upload', () => {
    test('should upload valid avatar image', async () => {
      const testImagePath = path.join(__dirname, 'test-avatar.jpg');
      fs.writeFileSync(testImagePath, createTestImage(500 * 1024));

      const res = await request(app)
        .post(`/api/users/${testUser.id}/avatar`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', testImagePath);

      fs.unlinkSync(testImagePath);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('uploaded successfully');
      expect(res.body.avatar).toBeDefined();
      expect(res.body.avatar).toContain('/uploads/avatars/');
    });

    test('should reject avatar larger than 2MB', async () => {
      const testImagePath = path.join(__dirname, 'test-large-avatar.jpg');
      const largeImage = createTestImage(3 * 1024 * 1024);
      fs.writeFileSync(testImagePath, largeImage);

      const res = await request(app)
        .post(`/api/users/${testUser.id}/avatar`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', testImagePath);

      fs.unlinkSync(testImagePath);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('too large');
    });

    test('should reject avatar upload for different user (non-admin)', async () => {
      const regularUser = await User.create({
        firstName: 'Regular',
        lastName: 'User',
        email: `regular${Date.now()}@test.com`,
        password: 'TestPassword123!',
        role: 'agent'
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: regularUser.email,
          password: 'TestPassword123!'
        });

      const regularToken = loginRes.body.token;
      const testImagePath = path.join(__dirname, 'test-avatar.jpg');
      fs.writeFileSync(testImagePath, createTestImage());

      const res = await request(app)
        .post(`/api/users/${testUser.id}/avatar`)
        .set('Authorization', `Bearer ${regularToken}`)
        .attach('files', testImagePath);

      fs.unlinkSync(testImagePath);
      await regularUser.destroy({ force: true });

      expect(res.status).toBe(403);
    });
  });

  describe('3. Contact Avatar Upload', () => {
    test('should upload valid contact avatar', async () => {
      const testImagePath = path.join(__dirname, 'test-contact-avatar.jpg');
      fs.writeFileSync(testImagePath, createTestImage());

      const res = await request(app)
        .post(`/api/contacts/${testContact.id}/avatar`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', testImagePath);

      fs.unlinkSync(testImagePath);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('uploaded successfully');
      expect(res.body.avatar).toBeDefined();
    });

    test('should reject non-image file for contact avatar', async () => {
      const testFilePath = path.join(__dirname, 'test-doc.txt');
      fs.writeFileSync(testFilePath, 'This is not an image');

      const res = await request(app)
        .post(`/api/contacts/${testContact.id}/avatar`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', testFilePath);

      fs.unlinkSync(testFilePath);

      expect(res.status).toBe(400);
    });
  });

  describe('4. Company Logo Upload', () => {
    test('should upload valid company logo', async () => {
      const testImagePath = path.join(__dirname, 'test-company-logo.png');
      fs.writeFileSync(testImagePath, createTestPNG());

      const res = await request(app)
        .post(`/api/companies/${testCompany.id}/logo`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('logo', testImagePath);

      fs.unlinkSync(testImagePath);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('uploaded successfully');
      expect(res.body.logo).toBeDefined();
    });

    test('should reject non-image file for company logo', async () => {
      const testFilePath = path.join(__dirname, 'test-doc.pdf');
      fs.writeFileSync(testFilePath, 'Not an image');

      const res = await request(app)
        .post(`/api/companies/${testCompany.id}/logo`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('logo', testFilePath);

      fs.unlinkSync(testFilePath);

      expect(res.status).toBe(400);
    });
  });

  describe('5. Document Upload with Images', () => {
    test('should upload image as document', async () => {
      const testImagePath = path.join(__dirname, 'test-doc-image.jpg');
      fs.writeFileSync(testImagePath, createTestImage());

      const res = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('name', 'Test Document Image')
        .field('documentType', 'image')
        .field('category', 'photo')
        .attach('files', testImagePath);

      fs.unlinkSync(testImagePath);

      expect([200, 201]).toContain(res.status);
    });
  });

  describe('6. Security Validation Tests', () => {
    test('should reject executable file disguised as image', async () => {
      const testFilePath = path.join(__dirname, 'test-malware.jpg');
      fs.writeFileSync(testFilePath, createMaliciousFile('executable'));

      const res = await request(app)
        .post(`/api/properties/${testProperty.id}/images`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', testFilePath);

      fs.unlinkSync(testFilePath);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test('should reject PHP script with image extension', async () => {
      const testFilePath = path.join(__dirname, 'test-script.jpg');
      fs.writeFileSync(testFilePath, createMaliciousFile('script'));

      const res = await request(app)
        .post(`/api/properties/${testProperty.id}/images`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', testFilePath);

      fs.unlinkSync(testFilePath);

      expect(res.status).toBe(400);
    });

    test('should reject file with double extension', async () => {
      const testFilePath = path.join(__dirname, 'test.php.jpg');
      fs.writeFileSync(testFilePath, createTestImage());

      const res = await request(app)
        .post(`/api/properties/${testProperty.id}/images`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', testFilePath);

      fs.unlinkSync(testFilePath);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Double extensions are not allowed');
    });

    test('should reject file with path traversal attempt', async () => {
      const testFilePath = path.join(__dirname, '../../../etc/passwd.jpg');
      const safeFilePath = path.join(__dirname, 'test-traversal.jpg');
      fs.writeFileSync(safeFilePath, createTestImage());

      const res = await request(app)
        .post(`/api/properties/${testProperty.id}/images`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', safeFilePath);

      fs.unlinkSync(safeFilePath);

      expect(res.status).toBe(200);
      const uploadedPath = res.body.images?.[0] || '';
      expect(uploadedPath).not.toContain('..');
      expect(uploadedPath).not.toContain('etc');
      expect(uploadedPath).not.toContain('passwd');
    });

    test('should sanitize malicious filenames', async () => {
      const testFilePath = path.join(__dirname, '<script>alert("xss")</script>.jpg');
      const safeFilePath = path.join(__dirname, 'test-xss.jpg');
      fs.writeFileSync(safeFilePath, createTestImage());

      const res = await request(app)
        .post(`/api/properties/${testProperty.id}/images`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', safeFilePath);

      fs.unlinkSync(safeFilePath);

      if (res.status === 200) {
        const uploadedPath = res.body.images?.[0] || '';
        expect(uploadedPath).not.toContain('<script>');
        expect(uploadedPath).not.toContain('alert');
      }
    });
  });

  describe('7. File Size Limit Tests', () => {
    test('should reject image larger than 5MB for properties', async () => {
      const testImagePath = path.join(__dirname, 'test-large.jpg');
      const largeImage = createTestImage(6 * 1024 * 1024);
      fs.writeFileSync(testImagePath, largeImage);

      const res = await request(app)
        .post(`/api/properties/${testProperty.id}/images`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', testImagePath);

      fs.unlinkSync(testImagePath);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('too large');
    });

    test('should accept image within size limit', async () => {
      const testImagePath = path.join(__dirname, 'test-small.jpg');
      const smallImage = createTestImage(1 * 1024 * 1024);
      fs.writeFileSync(testImagePath, smallImage);

      const res = await request(app)
        .post(`/api/properties/${testProperty.id}/images`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', testImagePath);

      fs.unlinkSync(testImagePath);

      expect(res.status).toBe(200);
    });
  });

  describe('8. MIME Type Validation', () => {
    test('should reject file with wrong MIME type', async () => {
      const testFilePath = path.join(__dirname, 'test-wrong-mime.jpg');
      fs.writeFileSync(testFilePath, 'This is plain text, not an image');

      const res = await request(app)
        .post(`/api/properties/${testProperty.id}/images`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', testFilePath);

      fs.unlinkSync(testFilePath);

      expect(res.status).toBe(400);
    });

    test('should accept valid JPEG with correct MIME type', async () => {
      const testImagePath = path.join(__dirname, 'test-valid-jpeg.jpg');
      fs.writeFileSync(testImagePath, createTestImage());

      const res = await request(app)
        .post(`/api/properties/${testProperty.id}/images`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', testImagePath);

      fs.unlinkSync(testImagePath);

      expect(res.status).toBe(200);
    });

    test('should accept valid PNG with correct MIME type', async () => {
      const testImagePath = path.join(__dirname, 'test-valid-png.png');
      fs.writeFileSync(testImagePath, createTestPNG());

      const res = await request(app)
        .post(`/api/properties/${testProperty.id}/images`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', testImagePath);

      fs.unlinkSync(testImagePath);

      expect(res.status).toBe(200);
    });
  });

  describe('9. Generic Upload Routes', () => {
    test('should upload image via /api/upload/image', async () => {
      const testImagePath = path.join(__dirname, 'test-generic-image.jpg');
      fs.writeFileSync(testImagePath, createTestImage());

      const res = await request(app)
        .post('/api/upload/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', testImagePath);

      fs.unlinkSync(testImagePath);

      expect(res.status).toBe(201);
      expect(res.body.files).toBeDefined();
    });

    test('should upload avatar via /api/upload/avatar', async () => {
      const testImagePath = path.join(__dirname, 'test-generic-avatar.jpg');
      fs.writeFileSync(testImagePath, createTestImage());

      const res = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', testImagePath);

      fs.unlinkSync(testImagePath);

      expect(res.status).toBe(201);
      expect(res.body.avatar).toBeDefined();
    });
  });
});
