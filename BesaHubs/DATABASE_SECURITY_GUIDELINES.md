# Database Query Security Guidelines

## Overview

This document provides comprehensive guidelines for preventing SQL injection vulnerabilities in our application. All developers must follow these practices when writing database queries.

## Table of Contents

1. [Security Principles](#security-principles)
2. [Safe Query Patterns](#safe-query-patterns)
3. [Unsafe Patterns to Avoid](#unsafe-patterns-to-avoid)
4. [Using the SQL Validator](#using-the-sql-validator)
5. [Query Validation Middleware](#query-validation-middleware)
6. [Common Use Cases](#common-use-cases)
7. [ESLint Configuration](#eslint-configuration)
8. [Testing for SQL Injection](#testing-for-sql-injection)

---

## Security Principles

### Core Rules

1. **NEVER concatenate user input directly into SQL queries**
2. **ALWAYS use parameterized queries with bind parameters**
3. **Use Sequelize ORM methods and operators whenever possible**
4. **Validate and sanitize all user input**
5. **Use the safeQuery() wrapper for raw SQL**
6. **Log all raw SQL queries for audit trail**

---

## Safe Query Patterns

### 1. Using Sequelize ORM (Preferred)

#### ✅ Safe: Object Notation for WHERE Clauses

```javascript
// Simple equality
const users = await User.findAll({
  where: { email: userEmail }
});

// Using Sequelize operators
const { Op } = require('sequelize');

const contacts = await Contact.findAll({
  where: {
    firstName: { [Op.iLike]: `%${search}%` },
    status: { [Op.in]: ['active', 'pending'] },
    createdAt: { [Op.gte]: startDate }
  }
});
```

#### ✅ Safe: Using buildSafeWhereClause Helper

```javascript
const { buildSafeWhereClause } = require('../utils/sqlValidator');
const { Op } = require('sequelize');

const filters = {
  city: { operator: 'ilike', value: req.query.city },
  price: { operator: 'gte', value: req.query.minPrice },
  status: { operator: 'in', value: ['active', 'pending'] }
};

const where = buildSafeWhereClause(filters, Op);

const properties = await Property.findAll({ where });
```

### 2. Raw SQL with Bind Parameters

#### ✅ Safe: Using safeQuery() Wrapper

```javascript
const { safeQuery } = require('../utils/sqlValidator');
const { sequelize } = require('../models');

// Positional parameters ($1, $2, etc.)
const result = await safeQuery(
  sequelize,
  'SELECT * FROM users WHERE email = $1 AND status = $2',
  {
    type: Sequelize.QueryTypes.SELECT,
    bind: [email, status]
  }
);

// Named parameters (:email, :status)
const result = await safeQuery(
  sequelize,
  'SELECT * FROM users WHERE email = :email AND status = :status',
  {
    type: Sequelize.QueryTypes.SELECT,
    replacements: { email, status }
  }
);
```

#### ✅ Safe: Direct sequelize.query() with Bind Parameters

```javascript
// Only when safeQuery() wrapper is not needed
const result = await sequelize.query(
  'SELECT * FROM properties WHERE city = $1 AND price > $2',
  {
    type: Sequelize.QueryTypes.SELECT,
    bind: [city, minPrice]
  }
);
```

### 3. Safe LIKE Queries

#### ✅ Safe: Sanitized LIKE Input

```javascript
const { sanitizeLikeInput } = require('../utils/sqlValidator');
const { Op } = require('sequelize');

// Sanitize user input before using in LIKE
const sanitizedSearch = sanitizeLikeInput(req.query.search);

const contacts = await Contact.findAll({
  where: {
    name: { [Op.iLike]: `%${sanitizedSearch}%` }
  }
});
```

---

## Unsafe Patterns to Avoid

### ❌ NEVER: String Concatenation

```javascript
// DANGEROUS - SQL Injection vulnerability
const email = req.body.email;
const query = `SELECT * FROM users WHERE email = '${email}'`;
const result = await sequelize.query(query);

// Attacker input: ' OR '1'='1
// Resulting query: SELECT * FROM users WHERE email = '' OR '1'='1'
// This returns all users!
```

### ❌ NEVER: Template Literals with User Input

```javascript
// DANGEROUS - SQL Injection vulnerability
const city = req.query.city;
const query = `SELECT * FROM properties WHERE city = '${city}'`;
const result = await sequelize.query(query);
```

### ❌ NEVER: String Concatenation in WHERE Clauses

```javascript
// DANGEROUS - Don't build WHERE conditions as strings
const whereClause = `status = '${status}' AND city = '${city}'`;
const properties = await Property.findAll({
  where: sequelize.literal(whereClause) // UNSAFE!
});
```

### ❌ AVOID: Raw SQL Without Validation

```javascript
// RISKY - No validation or logging
const result = await sequelize.query(rawSqlQuery);

// BETTER - Use safeQuery() wrapper
const result = await safeQuery(sequelize, rawSqlQuery, options);
```

---

## Using the SQL Validator

### safeQuery() Wrapper

The `safeQuery()` function validates and logs all raw SQL queries:

```javascript
const { safeQuery } = require('../utils/sqlValidator');

try {
  const result = await safeQuery(
    sequelize,
    'SELECT * FROM deals WHERE status = $1',
    {
      type: Sequelize.QueryTypes.SELECT,
      bind: [status]
    }
  );
} catch (error) {
  if (error.validationErrors) {
    // Query failed validation
    console.error('Query validation failed:', error.validationErrors);
  }
  throw error;
}
```

### Validation Features

1. **Dangerous Pattern Detection**: Blocks queries with DROP, DELETE, UNION, etc.
2. **Bind Parameter Enforcement**: Requires bind parameters for placeholders
3. **String Interpolation Detection**: Flags template literals and concatenation
4. **Audit Logging**: Logs all queries to `server/logs/sql-audit.log`
5. **Performance Tracking**: Measures and logs execution time

---

## Query Validation Middleware

### Basic Usage

Apply to all routes to detect SQL injection attempts in user input:

```javascript
const { queryValidationMiddleware } = require('../middleware/queryValidator');

// Apply globally
app.use(queryValidationMiddleware);

// Or apply to specific routes
router.get('/search', queryValidationMiddleware, async (req, res) => {
  // Handler code
});
```

### Strict Validation for Sensitive Routes

```javascript
const { strictQueryValidation } = require('../middleware/queryValidator');

// Block any suspicious input on admin routes
router.use('/admin', strictQueryValidation);

// Or specific sensitive endpoints
router.post('/execute-report', strictQueryValidation, async (req, res) => {
  // Handler code
});
```

### Input Sanitization

```javascript
const { sanitizeInputs } = require('../middleware/queryValidator');

// Remove dangerous characters from all inputs
router.post('/contact', sanitizeInputs, async (req, res) => {
  // req.body is now sanitized
});
```

---

## Common Use Cases

### 1. Search with Multiple Filters

```javascript
const { Op } = require('sequelize');

const buildSearchWhere = (filters) => {
  const where = { isActive: true };

  if (filters.search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${filters.search}%` } },
      { email: { [Op.iLike]: `%${filters.search}%` } }
    ];
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.minPrice || filters.maxPrice) {
    where.price = {};
    if (filters.minPrice) where.price[Op.gte] = parseFloat(filters.minPrice);
    if (filters.maxPrice) where.price[Op.lte] = parseFloat(filters.maxPrice);
  }

  return where;
};

// Usage
const where = buildSearchWhere(req.query);
const results = await Property.findAll({ where });
```

### 2. Dynamic Sorting

```javascript
// Whitelist allowed sort fields
const ALLOWED_SORT_FIELDS = ['createdAt', 'name', 'price', 'status'];
const ALLOWED_SORT_ORDERS = ['ASC', 'DESC'];

const sortBy = ALLOWED_SORT_FIELDS.includes(req.query.sortBy) 
  ? req.query.sortBy 
  : 'createdAt';

const sortOrder = ALLOWED_SORT_ORDERS.includes(req.query.sortOrder?.toUpperCase()) 
  ? req.query.sortOrder.toUpperCase() 
  : 'DESC';

const results = await Property.findAll({
  order: [[sortBy, sortOrder]]
});
```

### 3. Complex Joins with Parameters

```javascript
const { safeQuery } = require('../utils/sqlValidator');

const results = await safeQuery(
  sequelize,
  `SELECT p.*, u.firstName, u.lastName 
   FROM properties p 
   INNER JOIN users u ON p.listing_agent_id = u.id 
   WHERE p.city = $1 AND p.status = $2 
   ORDER BY p.created_at DESC`,
  {
    type: Sequelize.QueryTypes.SELECT,
    bind: [city, status]
  }
);
```

### 4. Aggregate Queries

```javascript
// Use Sequelize aggregation methods
const stats = await Deal.findAll({
  attributes: [
    'stage',
    [sequelize.fn('COUNT', '*'), 'count'],
    [sequelize.fn('SUM', sequelize.col('value')), 'totalValue'],
    [sequelize.fn('AVG', sequelize.col('value')), 'avgValue']
  ],
  where: { isActive: true },
  group: ['stage']
});
```

### 5. Date Range Queries

```javascript
const { Op } = require('sequelize');

const startDate = new Date(req.query.startDate);
const endDate = new Date(req.query.endDate);

const deals = await Deal.findAll({
  where: {
    createdAt: {
      [Op.between]: [startDate, endDate]
    }
  }
});
```

---

## ESLint Configuration

Add these rules to detect unsafe SQL patterns:

### .eslintrc.js

```javascript
module.exports = {
  rules: {
    // Warn on template literals in potential SQL contexts
    'no-template-curly-in-string': 'warn',
    
    // Custom rules for SQL safety
    'no-unsafe-sql': 'error'
  },
  overrides: [
    {
      files: ['server/**/*.js'],
      rules: {
        // Enforce these rules more strictly in backend code
        'no-eval': 'error',
        'no-implied-eval': 'error'
      }
    }
  ]
};
```

### Custom ESLint Rule: no-unsafe-sql

Create `.eslintrc-custom-rules.js`:

```javascript
module.exports = {
  rules: {
    'no-unsafe-sql': {
      create(context) {
        return {
          TaggedTemplateExpression(node) {
            // Check for sequelize.query with template literal
            if (node.tag.property?.name === 'query') {
              context.report({
                node,
                message: 'Avoid template literals in SQL queries. Use bind parameters instead.'
              });
            }
          },
          CallExpression(node) {
            // Check for sequelize.query() calls
            if (node.callee.property?.name === 'query') {
              const firstArg = node.arguments[0];
              
              // Flag template literals
              if (firstArg?.type === 'TemplateLiteral' && 
                  firstArg.expressions.length > 0) {
                context.report({
                  node: firstArg,
                  message: 'SQL query uses template literal interpolation. Use bind parameters instead.'
                });
              }
              
              // Flag string concatenation
              if (firstArg?.type === 'BinaryExpression' && 
                  firstArg.operator === '+') {
                context.report({
                  node: firstArg,
                  message: 'SQL query uses string concatenation. Use bind parameters instead.'
                });
              }
            }
          }
        };
      }
    }
  }
};
```

---

## Testing for SQL Injection

### Manual Testing

Test your endpoints with these payloads:

```javascript
// Test payloads
const sqlInjectionTests = [
  "' OR '1'='1",
  "'; DROP TABLE users--",
  "' UNION SELECT * FROM users--",
  "admin'--",
  "' OR 1=1--",
  "1' AND '1'='1",
  "'; EXEC xp_cmdshell('dir')--"
];

// Test each endpoint
sqlInjectionTests.forEach(async (payload) => {
  try {
    const response = await axios.get('/api/users', {
      params: { search: payload }
    });
    
    // Should either return empty results or 400 error
    // Should NOT return all users or cause database error
    console.log('Response:', response.status, response.data);
  } catch (error) {
    console.log('Error (expected):', error.response.status);
  }
});
```

### Automated Testing

```javascript
const request = require('supertest');
const app = require('../app');

describe('SQL Injection Protection', () => {
  it('should block SQL injection in search parameter', async () => {
    const response = await request(app)
      .get('/api/contacts')
      .query({ search: "' OR '1'='1" });
    
    // Should either return 400 or filtered results (not all records)
    expect([400, 200]).toContain(response.status);
    
    if (response.status === 200) {
      // Should not return all contacts
      expect(response.body.contacts.length).toBeLessThan(10);
    }
  });

  it('should block dangerous SQL keywords', async () => {
    const response = await request(app)
      .get('/api/properties')
      .query({ city: "'; DROP TABLE properties--" });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBeTruthy();
  });
});
```

---

## Quick Reference

### ✅ DO

- Use Sequelize ORM methods
- Use object notation for WHERE clauses
- Use Sequelize operators (Op.like, Op.gte, etc.)
- Use bind parameters for raw SQL
- Use safeQuery() wrapper for raw queries
- Sanitize LIKE input with sanitizeLikeInput()
- Validate user input with express-validator
- Apply query validation middleware
- Whitelist allowed values for sorting/filtering
- Log all raw SQL queries

### ❌ DON'T

- Concatenate user input into SQL
- Use template literals with user input in SQL
- Build WHERE clauses as strings
- Use sequelize.literal() with user input
- Trust user input without validation
- Skip input sanitization
- Disable query validation in production
- Use raw SQL without bind parameters
- Allow arbitrary column names in ORDER BY
- Expose database errors to users

---

## Audit Checklist

Before deploying code that touches the database:

- [ ] All user inputs are validated
- [ ] No string concatenation in SQL queries
- [ ] All raw SQL uses bind parameters
- [ ] WHERE clauses use object notation
- [ ] LIKE queries use sanitizeLikeInput()
- [ ] Sort fields are whitelisted
- [ ] Query validation middleware is applied
- [ ] Error messages don't expose database structure
- [ ] Tested with SQL injection payloads
- [ ] Reviewed by security-conscious peer

---

## Resources

- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Sequelize Security Best Practices](https://sequelize.org/docs/v6/core-concepts/raw-queries/)
- [Node.js Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

---

## Questions?

If you're unsure whether a query is safe, ask yourself:

1. Does this query use user input?
2. Is the user input directly concatenated into the SQL?
3. Am I using bind parameters?
4. Could an attacker manipulate this input?

When in doubt, use the safeQuery() wrapper and apply strict validation middleware.
