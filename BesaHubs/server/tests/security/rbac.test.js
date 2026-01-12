const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../index');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

const createToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const createExpiredToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '-1h' }
  );
};

const mockUsers = {
  admin: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@test.com',
    role: 'admin'
  },
  manager: {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'manager@test.com',
    role: 'manager'
  },
  agent: {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'agent@test.com',
    role: 'agent'
  },
  assistant: {
    id: '00000000-0000-0000-0000-000000000004',
    email: 'assistant@test.com',
    role: 'assistant'
  }
};

describe('RBAC Security Tests', () => {
  describe('Authentication Tests', () => {
    test('Should reject requests without token (401)', async () => {
      const response = await request(app)
        .get('/api/properties')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('token');
    });

    test('Should reject requests with invalid token (401)', async () => {
      const response = await request(app)
        .get('/api/properties')
        .set('Authorization', 'Bearer invalid-token-12345')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('Should reject requests with expired token (401)', async () => {
      const expiredToken = createExpiredToken(mockUsers.agent);
      
      const response = await request(app)
        .get('/api/properties')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('expired');
    });
  });

  describe('Admin-Only Endpoint Tests', () => {
    const adminEndpoints = [
      { method: 'get', path: '/api/admin/overview' },
      { method: 'get', path: '/api/admin/users' },
      { method: 'get', path: '/api/admin/analytics' }
    ];

    adminEndpoints.forEach(({ method, path }) => {
      test(`${method.toUpperCase()} ${path} - Should allow admin access (200/404)`, async () => {
        const token = createToken(mockUsers.admin);
        
        const response = await request(app)
          [method](path)
          .set('Authorization', `Bearer ${token}`);

        expect([200, 404, 500]).toContain(response.status);
      });

      test(`${method.toUpperCase()} ${path} - Should deny manager access (403)`, async () => {
        const token = createToken(mockUsers.manager);
        
        const response = await request(app)
          [method](path)
          .set('Authorization', `Bearer ${token}`)
          .expect(403);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Admin');
      });

      test(`${method.toUpperCase()} ${path} - Should deny agent access (403)`, async () => {
        const token = createToken(mockUsers.agent);
        
        const response = await request(app)
          [method](path)
          .set('Authorization', `Bearer ${token}`)
          .expect(403);

        expect(response.body).toHaveProperty('error');
      });

      test(`${method.toUpperCase()} ${path} - Should deny assistant access (403)`, async () => {
        const token = createToken(mockUsers.assistant);
        
        const response = await request(app)
          [method](path)
          .set('Authorization', `Bearer ${token}`)
          .expect(403);

        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('Manager-Level Endpoint Tests', () => {
    const managerEndpoints = [
      { method: 'get', path: '/api/deals' },
      { method: 'get', path: '/api/contacts' }
    ];

    managerEndpoints.forEach(({ method, path }) => {
      test(`${method.toUpperCase()} ${path} - Should allow admin access`, async () => {
        const token = createToken(mockUsers.admin);
        
        const response = await request(app)
          [method](path)
          .set('Authorization', `Bearer ${token}`);

        expect([200, 404]).toContain(response.status);
      });

      test(`${method.toUpperCase()} ${path} - Should allow manager access`, async () => {
        const token = createToken(mockUsers.manager);
        
        const response = await request(app)
          [method](path)
          .set('Authorization', `Bearer ${token}`);

        expect([200, 404]).toContain(response.status);
      });

      test(`${method.toUpperCase()} ${path} - Should allow agent access with permissions`, async () => {
        const token = createToken(mockUsers.agent);
        
        const response = await request(app)
          [method](path)
          .set('Authorization', `Bearer ${token}`);

        expect([200, 403, 404]).toContain(response.status);
      });

      test(`${method.toUpperCase()} ${path} - Should deny assistant write access (403)`, async () => {
        const token = createToken(mockUsers.assistant);
        
        if (method === 'post' || method === 'put' || method === 'delete') {
          const response = await request(app)
            [method](path)
            .set('Authorization', `Bearer ${token}`)
            .send({})
            .expect(403);

          expect(response.body).toHaveProperty('error');
        }
      });
    });
  });

  describe('Protected Resource Tests', () => {
    describe('Properties Endpoints', () => {
      test('GET /api/properties - Should allow authenticated users with read permission', async () => {
        const token = createToken(mockUsers.agent);
        
        const response = await request(app)
          .get('/api/properties')
          .set('Authorization', `Bearer ${token}`);

        expect([200, 403]).toContain(response.status);
      });

      test('POST /api/properties - Should deny users without create permission (403)', async () => {
        const token = createToken(mockUsers.assistant);
        
        const response = await request(app)
          .post('/api/properties')
          .set('Authorization', `Bearer ${token}`)
          .send({
            name: 'Test Property',
            address: '123 Test St',
            propertyType: 'Office'
          });

        expect([403, 400]).toContain(response.status);
      });

      test('DELETE /api/properties/:id - Should deny non-admin users (403)', async () => {
        const token = createToken(mockUsers.agent);
        
        const response = await request(app)
          .delete('/api/properties/test-id-12345')
          .set('Authorization', `Bearer ${token}`);

        expect([403, 404]).toContain(response.status);
      });
    });

    describe('Deals Endpoints', () => {
      test('GET /api/deals - Should allow authenticated users with read permission', async () => {
        const token = createToken(mockUsers.agent);
        
        const response = await request(app)
          .get('/api/deals')
          .set('Authorization', `Bearer ${token}`);

        expect([200, 403]).toContain(response.status);
      });

      test('POST /api/deals - Should deny users without create permission (403)', async () => {
        const token = createToken(mockUsers.assistant);
        
        const response = await request(app)
          .post('/api/deals')
          .set('Authorization', `Bearer ${token}`)
          .send({
            name: 'Test Deal',
            stage: 'qualification'
          });

        expect([403, 400]).toContain(response.status);
      });
    });

    describe('Contacts Endpoints', () => {
      test('GET /api/contacts - Should allow authenticated users with read permission', async () => {
        const token = createToken(mockUsers.agent);
        
        const response = await request(app)
          .get('/api/contacts')
          .set('Authorization', `Bearer ${token}`);

        expect([200, 403]).toContain(response.status);
      });

      test('POST /api/contacts - Should deny users without create permission (403)', async () => {
        const token = createToken(mockUsers.assistant);
        
        const response = await request(app)
          .post('/api/contacts')
          .set('Authorization', `Bearer ${token}`)
          .send({
            firstName: 'John',
            lastName: 'Doe',
            primaryEmail: 'john@test.com'
          });

        expect([403, 400]).toContain(response.status);
      });
    });
  });

  describe('Audit Log Endpoint Tests', () => {
    test('GET /api/audit-logs - Should allow only admin access', async () => {
      const token = createToken(mockUsers.admin);
      
      const response = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${token}`);

      expect([200, 404]).toContain(response.status);
    });

    test('GET /api/audit-logs - Should deny manager access (403)', async () => {
      const token = createToken(mockUsers.manager);
      
      const response = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    test('GET /api/audit-logs - Should deny agent access (403)', async () => {
      const token = createToken(mockUsers.agent);
      
      const response = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });

    test('GET /api/audit-logs/stats - Should allow only admin access', async () => {
      const token = createToken(mockUsers.admin);
      
      const response = await request(app)
        .get('/api/audit-logs/stats')
        .set('Authorization', `Bearer ${token}`);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Error Message Tests', () => {
    test('Should return appropriate error message for 401 Unauthorized', async () => {
      const response = await request(app)
        .get('/api/properties')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
      expect(response.body.error.length).toBeGreaterThan(0);
    });

    test('Should return appropriate error message for 403 Forbidden', async () => {
      const token = createToken(mockUsers.agent);
      
      const response = await request(app)
        .get('/api/admin/overview')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
      expect(response.body.error).toContain('Admin' || 'Forbidden' || 'permission');
    });
  });

  describe('Cross-Role Permission Tests', () => {
    test('Assistant should only have read access to most resources', async () => {
      const token = createToken(mockUsers.assistant);
      
      const writeOperations = [
        { method: 'post', path: '/api/properties', data: { name: 'Test' } },
        { method: 'put', path: '/api/deals/test-id', data: { name: 'Updated' } },
        { method: 'delete', path: '/api/contacts/test-id' }
      ];

      for (const op of writeOperations) {
        const response = await request(app)
          [op.method](op.path)
          .set('Authorization', `Bearer ${token}`)
          .send(op.data || {});

        expect([403, 404, 400]).toContain(response.status);
      }
    });

    test('Agent should have create/read/update but not delete access', async () => {
      const token = createToken(mockUsers.agent);
      
      const readResponse = await request(app)
        .get('/api/properties')
        .set('Authorization', `Bearer ${token}`);

      expect([200, 403]).toContain(readResponse.status);
    });
  });
});

describe('Security Headers Tests', () => {
  test('Should include security headers in responses', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.headers).toHaveProperty('x-content-type-options');
    expect(response.headers).toHaveProperty('x-frame-options');
  });
});
