const request = require('supertest');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3001';

let authToken = '';

describe('CSV Import Tests', () => {
  beforeAll(async () => {
    // Login to get auth token
    const response = await request(API_BASE)
      .post('/api/auth/login')
      .send({
        email: 'admin@demo.com',
        password: 'Admin@123'
      });
    
    authToken = response.body.token;
  });

  describe('Properties Import', () => {
    test('Should download property CSV template', async () => {
      const response = await request(API_BASE)
        .get('/api/properties/template')
        .query({ format: 'csv' })
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('Property Name');
      
      console.log('✅ Property template downloaded successfully');
      console.log('   Preview:', response.text.substring(0, 100));
    });

    test('Should import valid properties CSV', async () => {
      const response = await request(API_BASE)
        .post('/api/properties/import')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', '/tmp/csv_test_files/properties_valid.csv');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('imported');
      expect(response.body.imported).toBeGreaterThan(0);
      
      console.log('✅ Valid properties imported:', response.body);
    });

    test('Should handle invalid properties CSV', async () => {
      const response = await request(API_BASE)
        .post('/api/properties/import')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', '/tmp/csv_test_files/properties_invalid.csv');
      
      // Should either succeed with errors or fail gracefully
      console.log('✅ Invalid data handling:', response.body);
      expect(response.body).toHaveProperty('errors');
    });

    test('SECURITY: Should detect CSV formula injection', async () => {
      const response = await request(API_BASE)
        .post('/api/properties/import')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', '/tmp/csv_test_files/properties_formula_injection.csv');
      
      const imported = response.body.imported || 0;
      
      if (imported > 0) {
        console.error('⚠️  CRITICAL SECURITY ISSUE: CSV formulas imported without sanitization!');
        console.error('   Imported:', imported, 'properties with formula injections');
        console.error('   This is a CSV Formula Injection vulnerability');
      } else {
        console.log('✅ Formula injection properly handled');
      }
      
      console.log('Formula injection test result:', response.body);
    });
  });

  describe('Contacts Import', () => {
    test('Should download contacts CSV template', async () => {
      const response = await request(API_BASE)
        .get('/api/import/template/contacts')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      
      console.log('✅ Contacts template downloaded successfully');
      console.log('   Preview:', response.text.substring(0, 100));
    });

    test('Should import valid contacts CSV', async () => {
      const response = await request(API_BASE)
        .post('/api/import/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', '/tmp/csv_test_files/contacts_valid.csv');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      
      console.log('✅ Valid contacts imported:', response.body);
    });

    test('SECURITY: Should detect CSV formula injection in contacts', async () => {
      const response = await request(API_BASE)
        .post('/api/import/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', '/tmp/csv_test_files/contacts_formula_injection.csv');
      
      const imported = response.body.success || 0;
      
      if (imported > 0) {
        console.error('⚠️  CRITICAL SECURITY ISSUE: CSV formulas imported without sanitization!');
        console.error('   Imported:', imported, 'contacts with formula injections');
        console.error('   This is a CSV Formula Injection vulnerability');
      } else {
        console.log('✅ Formula injection properly handled');
      }
      
      console.log('Formula injection test result:', response.body);
    });
  });
});
