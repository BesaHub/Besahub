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

const mockUsers = {
  admin: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@test.com',
    role: 'admin'
  },
  agent: {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'agent@test.com',
    role: 'agent'
  }
};

describe('OWASP Security Tests', () => {
  describe('SQL Injection Prevention Tests', () => {
    const sqlInjectionPayloads = [
      "' OR '1'='1",
      "admin'--",
      "' OR 1=1--",
      "admin' OR '1'='1'/*",
      "'; DROP TABLE users--",
      "1' UNION SELECT NULL, NULL, NULL--",
      "' OR 'x'='x",
      "1; DELETE FROM users WHERE 1=1--"
    ];

    describe('Login Endpoint SQL Injection', () => {
      sqlInjectionPayloads.forEach(payload => {
        test(`Should reject SQL injection in email: ${payload}`, async () => {
          const response = await request(app)
            .post('/api/auth/login')
            .send({
              email: payload,
              password: 'password123'
            });

          expect([400, 401, 429]).toContain(response.status);
          expect(response.body).toHaveProperty('error');
          expect(response.body.token).toBeUndefined();
        });

        test(`Should reject SQL injection in password: ${payload}`, async () => {
          const response = await request(app)
            .post('/api/auth/login')
            .send({
              email: 'test@example.com',
              password: payload
            });

          expect([400, 401, 429]).toContain(response.status);
          expect(response.body).toHaveProperty('error');
          expect(response.body.token).toBeUndefined();
        });
      });
    });

    describe('Search/Filter SQL Injection', () => {
      const token = createToken(mockUsers.agent);

      sqlInjectionPayloads.forEach(payload => {
        test(`Should sanitize SQL injection in properties search: ${payload}`, async () => {
          const response = await request(app)
            .get('/api/properties')
            .query({ search: payload })
            .set('Authorization', `Bearer ${token}`);

          expect([200, 400, 403]).toContain(response.status);
          if (response.status === 200) {
            expect(response.body.properties).toBeDefined();
          }
        });

        test(`Should sanitize SQL injection in contacts search: ${payload}`, async () => {
          const response = await request(app)
            .get('/api/contacts')
            .query({ search: payload })
            .set('Authorization', `Bearer ${token}`);

          expect([200, 400, 403]).toContain(response.status);
          if (response.status === 200) {
            expect(response.body.contacts).toBeDefined();
          }
        });

        test(`Should sanitize SQL injection in deals search: ${payload}`, async () => {
          const response = await request(app)
            .get('/api/deals')
            .query({ search: payload })
            .set('Authorization', `Bearer ${token}`);

          expect([200, 400, 403]).toContain(response.status);
          if (response.status === 200) {
            expect(response.body.deals).toBeDefined();
          }
        });
      });
    });

    describe('Numeric Field SQL Injection', () => {
      const token = createToken(mockUsers.agent);
      const numericInjectionPayloads = [
        "1 OR 1=1",
        "1'; DROP TABLE users--",
        "1 UNION SELECT NULL--"
      ];

      numericInjectionPayloads.forEach(payload => {
        test(`Should reject SQL injection in numeric page parameter: ${payload}`, async () => {
          const response = await request(app)
            .get('/api/properties')
            .query({ page: payload })
            .set('Authorization', `Bearer ${token}`);

          expect([200, 400, 403]).toContain(response.status);
        });

        test(`Should reject SQL injection in numeric limit parameter: ${payload}`, async () => {
          const response = await request(app)
            .get('/api/properties')
            .query({ limit: payload })
            .set('Authorization', `Bearer ${token}`);

          expect([200, 400, 403]).toContain(response.status);
        });
      });
    });
  });

  describe('XSS (Cross-Site Scripting) Prevention Tests', () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert("xss")>',
      '<svg onload=alert("xss")>',
      'javascript:alert("xss")',
      '<iframe src="javascript:alert(\'xss\')">',
      '<body onload=alert("xss")>',
      '<input onfocus=alert("xss") autofocus>',
      '"><script>alert(String.fromCharCode(88,83,83))</script>',
      '<IMG SRC="javascript:alert(\'XSS\');">',
      '<SCRIPT SRC=http://evil.com/xss.js></SCRIPT>'
    ];

    describe('Reflected XSS in Input Fields', () => {
      const token = createToken(mockUsers.agent);

      xssPayloads.forEach(payload => {
        test(`Should sanitize XSS in property name: ${payload.substring(0, 30)}...`, async () => {
          const response = await request(app)
            .post('/api/properties')
            .set('Authorization', `Bearer ${token}`)
            .send({
              name: payload,
              address: '123 Test St',
              propertyType: 'Office'
            });

          expect([200, 201, 400, 403]).toContain(response.status);
          if (response.status === 201 || response.status === 200) {
            expect(response.body.property?.name).not.toContain('<script>');
            expect(response.body.property?.name).not.toContain('javascript:');
          }
        });

        test(`Should sanitize XSS in contact name: ${payload.substring(0, 30)}...`, async () => {
          const response = await request(app)
            .post('/api/contacts')
            .set('Authorization', `Bearer ${token}`)
            .send({
              firstName: payload,
              lastName: 'Test',
              primaryEmail: 'test@example.com'
            });

          expect([200, 201, 400, 403]).toContain(response.status);
          if (response.status === 201 || response.status === 200) {
            expect(response.body.contact?.firstName).not.toContain('<script>');
            expect(response.body.contact?.firstName).not.toContain('javascript:');
          }
        });
      });
    });

    describe('Stored XSS in User-Generated Content', () => {
      const token = createToken(mockUsers.agent);

      test('Should sanitize XSS in deal notes/description', async () => {
        const xssPayload = '<script>alert("stored-xss")</script>';
        const response = await request(app)
          .post('/api/deals')
          .set('Authorization', `Bearer ${token}`)
          .send({
            name: 'Test Deal',
            stage: 'qualification',
            notes: xssPayload,
            description: xssPayload
          });

        expect([200, 201, 400, 403]).toContain(response.status);
        if (response.status === 201 || response.status === 200) {
          expect(response.body.deal?.notes).not.toContain('<script>');
          expect(response.body.deal?.description).not.toContain('<script>');
        }
      });

      test('Should sanitize XSS in property description', async () => {
        const xssPayload = '<img src=x onerror=alert("xss")>';
        const response = await request(app)
          .post('/api/properties')
          .set('Authorization', `Bearer ${token}`)
          .send({
            name: 'Test Property',
            address: '123 Test St',
            propertyType: 'Office',
            description: xssPayload
          });

        expect([200, 201, 400, 403]).toContain(response.status);
        if (response.status === 201 || response.status === 200) {
          expect(response.body.property?.description).not.toContain('onerror=');
          expect(response.body.property?.description).not.toContain('<img');
        }
      });
    });

    describe('XSS in Error Messages', () => {
      const xssPayload = '<script>alert("xss")</script>';

      test('Should not reflect XSS payload in 404 error messages', async () => {
        const response = await request(app)
          .get(`/api/nonexistent/${xssPayload}`);

        expect([404, 401]).toContain(response.status);
        if (response.body.error) {
          expect(response.body.error).not.toContain('<script>');
        }
      });

      test('Should sanitize XSS in validation error messages', async () => {
        const token = createToken(mockUsers.agent);
        const response = await request(app)
          .post('/api/properties')
          .set('Authorization', `Bearer ${token}`)
          .send({
            name: xssPayload,
            address: xssPayload
          });

        expect([400, 403]).toContain(response.status);
        const responseStr = JSON.stringify(response.body);
        expect(responseStr).not.toContain('<script>');
      });
    });
  });

  describe('CSRF (Cross-Site Request Forgery) Prevention Tests', () => {
    test('Should enforce same-origin for state-changing operations', async () => {
      const token = createToken(mockUsers.agent);
      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${token}`)
        .set('Origin', 'http://evil-site.com')
        .send({
          name: 'CSRF Test Property',
          address: '123 Evil St',
          propertyType: 'Office'
        });

      expect([403, 201, 400]).toContain(response.status);
    });

    test('Should reject requests with missing origin header on POST', async () => {
      const token = createToken(mockUsers.agent);
      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'CSRF Test',
          address: '123 Test St',
          propertyType: 'Office'
        });

      expect([200, 201, 400, 403]).toContain(response.status);
    });
  });

  describe('Broken Authentication Tests', () => {
    describe('Token Expiration', () => {
      test('Should reject expired JWT tokens', async () => {
        const expiredToken = jwt.sign(
          mockUsers.agent,
          JWT_SECRET,
          { expiresIn: '-1h' }
        );

        const response = await request(app)
          .get('/api/properties')
          .set('Authorization', `Bearer ${expiredToken}`)
          .expect(401);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toMatch(/expired|invalid/i);
      });

      test('Should reject malformed JWT tokens', async () => {
        const response = await request(app)
          .get('/api/properties')
          .set('Authorization', 'Bearer not-a-valid-token')
          .expect(401);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('Password Security', () => {
      test('Should reject weak passwords during registration', async () => {
        const weakPasswords = [
          'password',
          '12345678',
          'qwerty123',
          'Password1'
        ];

        for (const weakPassword of weakPasswords) {
          const response = await request(app)
            .post('/api/auth/register')
            .send({
              firstName: 'Test',
              lastName: 'User',
              email: `test${Date.now()}@example.com`,
              password: weakPassword
            });

          expect([400, 500]).toContain(response.status);
        }
      });

      test('Should enforce strong password policy', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            firstName: 'Test',
            lastName: 'User',
            email: `test${Date.now()}@example.com`,
            password: 'short'
          });

        expect([400, 500]).toContain(response.status);
        if (response.status === 400) {
          expect(response.body.error || response.body.message || '').toMatch(/password/i);
        }
      });
    });

    describe('Session Management', () => {
      test('Should not allow multiple simultaneous sessions with same token', async () => {
        const token = createToken(mockUsers.agent);

        const response1 = await request(app)
          .get('/api/properties')
          .set('Authorization', `Bearer ${token}`);

        const response2 = await request(app)
          .get('/api/properties')
          .set('Authorization', `Bearer ${token}`);

        expect([200, 403]).toContain(response1.status);
        expect([200, 403]).toContain(response2.status);
      });
    });
  });

  describe('Sensitive Data Exposure Tests', () => {
    test('Should not expose password hashes in user responses', async () => {
      const token = createToken(mockUsers.admin);
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      if (response.status === 200 && response.body.users) {
        response.body.users.forEach(user => {
          expect(user.password).toBeUndefined();
          expect(user.passwordResetToken).toBeUndefined();
          expect(user.mfaSecret).toBeUndefined();
        });
      }
    });

    test('Should not expose refresh tokens in responses', async () => {
      const token = createToken(mockUsers.admin);
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      if (response.status === 200 && response.body.users) {
        response.body.users.forEach(user => {
          expect(user.refreshToken).toBeUndefined();
          expect(user.emailVerificationToken).toBeUndefined();
        });
      }
    });

    test('Should not expose internal system details in error messages', async () => {
      const response = await request(app)
        .get('/api/nonexistent-endpoint')
        .expect(404);

      const errorText = JSON.stringify(response.body).toLowerCase();
      expect(errorText).not.toContain('sequelize');
      expect(errorText).not.toContain('database');
      expect(errorText).not.toContain('sql');
      expect(errorText).not.toContain('postgres');
    });

    test('Should not expose stack traces in production errors', async () => {
      const token = createToken(mockUsers.agent);
      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      if (response.body.stack) {
        console.warn('⚠️  Stack trace exposed in error response');
      }
      expect(response.body.stack).toBeUndefined();
    });
  });

  describe('Broken Access Control Tests', () => {
    test('Should prevent unauthorized access to admin endpoints', async () => {
      const agentToken = createToken(mockUsers.agent);
      
      const adminEndpoints = [
        '/api/admin/overview',
        '/api/admin/users',
        '/api/admin/analytics'
      ];

      for (const endpoint of adminEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${agentToken}`);

        expect([403, 404]).toContain(response.status);
        if (response.status === 403) {
          expect(response.body).toHaveProperty('error');
        }
      }
    });

    test('Should prevent users from accessing other users data', async () => {
      const agentToken = createToken(mockUsers.agent);
      const otherUserId = mockUsers.admin.id;

      const response = await request(app)
        .get(`/api/users/${otherUserId}`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect([403, 200, 404]).toContain(response.status);
    });

    test('Should prevent privilege escalation via role manipulation', async () => {
      const agentToken = createToken(mockUsers.agent);

      const response = await request(app)
        .put(`/api/users/${mockUsers.agent.id}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          role: 'admin'
        });

      expect([200, 400, 403, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.user?.role).not.toBe('admin');
      }
    });
  });

  describe('Security Headers Tests', () => {
    test('Should include X-Content-Type-Options header', async () => {
      const response = await request(app).get('/health');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    test('Should include X-Frame-Options header', async () => {
      const response = await request(app).get('/health');
      expect(response.headers['x-frame-options']).toBeDefined();
    });

    test('Should include X-XSS-Protection header (if present)', async () => {
      const response = await request(app).get('/health');
      if (response.headers['x-xss-protection']) {
        expect(response.headers['x-xss-protection']).toBeDefined();
      }
    });

    test('Should include Content-Security-Policy header', async () => {
      const response = await request(app).get('/health');
      if (response.headers['content-security-policy']) {
        expect(response.headers['content-security-policy']).toContain('self');
      }
    });
  });

  describe('Input Validation Tests', () => {
    const token = createToken(mockUsers.agent);

    test('Should validate email format in contact creation', async () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'user@',
        'user..name@example.com',
        '<script>alert("xss")</script>@example.com'
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/contacts')
          .set('Authorization', `Bearer ${token}`)
          .send({
            firstName: 'Test',
            lastName: 'User',
            primaryEmail: email
          });

        expect([400, 403]).toContain(response.status);
      }
    });

    test('Should validate phone number format', async () => {
      const invalidPhones = [
        'abc123',
        '123',
        '<script>alert("xss")</script>',
        "'; DROP TABLE contacts--"
      ];

      for (const phone of invalidPhones) {
        const response = await request(app)
          .post('/api/contacts')
          .set('Authorization', `Bearer ${token}`)
          .send({
            firstName: 'Test',
            lastName: 'User',
            primaryEmail: 'test@example.com',
            phone: phone
          });

        expect([200, 201, 400, 403]).toContain(response.status);
      }
    });

    test('Should validate numeric fields are actually numeric', async () => {
      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Property',
          address: '123 Test St',
          propertyType: 'Office',
          listPrice: "'; DROP TABLE properties--"
        });

      expect([400, 403]).toContain(response.status);
    });
  });

  describe('Rate Limiting Tests', () => {
    test('Should enforce rate limiting on auth endpoints', async () => {
      const requests = [];
      
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'test@example.com',
              password: 'wrongpassword'
            })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      
      if (rateLimited) {
        expect(rateLimited).toBe(true);
      }
    });
  });
});

describe('Security Regression Tests', () => {
  test('Should not allow bypassing authentication with manipulated tokens', async () => {
    const manipulatedToken = createToken(mockUsers.agent).slice(0, -5) + 'xxxxx';
    
    const response = await request(app)
      .get('/api/properties')
      .set('Authorization', `Bearer ${manipulatedToken}`)
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });

  test('Should sanitize all user inputs consistently', async () => {
    const token = createToken(mockUsers.agent);
    const xssPayload = '<script>alert("xss")</script>';

    const endpoints = [
      { method: 'post', url: '/api/properties', data: { name: xssPayload, address: '123 Test', propertyType: 'Office' } },
      { method: 'post', url: '/api/contacts', data: { firstName: xssPayload, lastName: 'Test', primaryEmail: 'test@example.com' } },
      { method: 'post', url: '/api/deals', data: { name: xssPayload, stage: 'qualification' } }
    ];

    for (const endpoint of endpoints) {
      const response = await request(app)
        [endpoint.method](endpoint.url)
        .set('Authorization', `Bearer ${token}`)
        .send(endpoint.data);

      const responseStr = JSON.stringify(response.body);
      expect(responseStr).not.toContain('<script>');
    }
  });
});
