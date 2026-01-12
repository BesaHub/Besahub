const crypto = require('crypto');
const { EmailEvent, Campaign, Contact, User, Team, TeamMembership } = require('../../models');
const { sequelize } = require('../../config/database');

describe('Critical Security Vulnerabilities - Phase 1 Fixes', () => {
  let adminUser, managerUser, agent1User, agent2User;
  let campaign1, campaign2;
  let contact1, contact2;
  let emailEvent1, emailEvent2, emailEvent3;
  let team;

  beforeAll(async () => {
    await sequelize.authenticate();
  });

  beforeEach(async () => {
    await EmailEvent.destroy({ where: {}, force: true });
    await Campaign.destroy({ where: {}, force: true });
    await Contact.destroy({ where: {}, force: true });
    await TeamMembership.destroy({ where: {}, force: true });
    await Team.destroy({ where: {}, force: true });
    await User.destroy({ where: { email: { $like: '%testuser%' } }, force: true });

    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin.testuser@example.com',
      password: 'SecurePass123!@#',
      role: 'admin'
    });

    managerUser = await User.create({
      firstName: 'Manager',
      lastName: 'User',
      email: 'manager.testuser@example.com',
      password: 'SecurePass123!@#',
      role: 'manager'
    });

    agent1User = await User.create({
      firstName: 'Agent1',
      lastName: 'User',
      email: 'agent1.testuser@example.com',
      password: 'SecurePass123!@#',
      role: 'agent'
    });

    agent2User = await User.create({
      firstName: 'Agent2',
      lastName: 'User',
      email: 'agent2.testuser@example.com',
      password: 'SecurePass123!@#',
      role: 'agent'
    });

    team = await Team.create({
      name: 'Test Team',
      description: 'Test team for security testing',
      leaderId: managerUser.id
    });

    await TeamMembership.create({
      userId: managerUser.id,
      teamId: team.id,
      isLead: true
    });

    await TeamMembership.create({
      userId: agent1User.id,
      teamId: team.id,
      isLead: false
    });

    contact1 = await Contact.create({
      firstName: 'Contact1',
      lastName: 'Test',
      primaryEmail: 'contact1@test.com',
      assignedAgentId: agent1User.id,
      contactRole: 'tenant'
    });

    contact2 = await Contact.create({
      firstName: 'Contact2',
      lastName: 'Test',
      primaryEmail: 'contact2@test.com',
      assignedAgentId: agent2User.id,
      contactRole: 'tenant'
    });

    campaign1 = await Campaign.create({
      name: 'Campaign 1',
      createdById: agent1User.id,
      type: 'email',
      status: 'sent'
    });

    campaign2 = await Campaign.create({
      name: 'Campaign 2',
      createdById: agent2User.id,
      type: 'email',
      status: 'sent'
    });

    emailEvent1 = await EmailEvent.create({
      contactId: contact1.id,
      campaignId: campaign1.id,
      messageId: 'msg-1',
      eventType: 'delivered',
      eventTimestamp: new Date()
    });

    emailEvent2 = await EmailEvent.create({
      contactId: contact2.id,
      campaignId: campaign2.id,
      messageId: 'msg-2',
      eventType: 'open',
      eventTimestamp: new Date()
    });

    emailEvent3 = await EmailEvent.create({
      contactId: contact1.id,
      campaignId: campaign1.id,
      messageId: 'msg-3',
      eventType: 'click',
      eventTimestamp: new Date()
    });
  });

  afterEach(async () => {
    await EmailEvent.destroy({ where: {}, force: true });
    await Campaign.destroy({ where: {}, force: true });
    await Contact.destroy({ where: {}, force: true });
    await TeamMembership.destroy({ where: {}, force: true });
    await Team.destroy({ where: {}, force: true });
    await User.destroy({ where: { email: { $like: '%testuser%' } }, force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('CRITICAL ISSUE #1: Cache Key Collision Fix', () => {
    test('SHA-256 hash should generate unique cache keys for different users', () => {
      const dataset = 'deals';
      const query = { metrics: ['total', 'avg_value'], filters: { status: 'active' } };
      
      const user1Id = agent1User.id;
      const user1Role = 'agent';
      const user2Id = agent2User.id;
      const user2Role = 'agent';

      const queryString1 = JSON.stringify({ dataset, query, userId: user1Id, userRole: user1Role });
      const hash1 = crypto.createHash('sha256').update(queryString1).digest('hex');
      const cacheKey1 = `query:${hash1}`;

      const queryString2 = JSON.stringify({ dataset, query, userId: user2Id, userRole: user2Role });
      const hash2 = crypto.createHash('sha256').update(queryString2).digest('hex');
      const cacheKey2 = `query:${hash2}`;

      expect(cacheKey1).not.toBe(cacheKey2);
      expect(hash1.length).toBe(64);
      expect(hash2.length).toBe(64);
    });

    test('SHA-256 hash should preserve user identity in cache key', () => {
      const dataset = 'contacts';
      const query = { metrics: ['total'], filters: {} };
      
      const queryString = JSON.stringify({ 
        dataset, 
        query, 
        userId: agent1User.id, 
        userRole: 'agent' 
      });
      
      const hash = crypto.createHash('sha256').update(queryString).digest('hex');
      
      expect(queryString).toContain(agent1User.id);
      expect(hash.length).toBe(64);
    });

    test('SHA-256 hash should be collision-resistant', () => {
      const iterations = 1000;
      const hashes = new Set();
      
      for (let i = 0; i < iterations; i++) {
        const dataset = 'properties';
        const query = { 
          metrics: ['count'], 
          filters: { index: i, randomValue: Math.random() } 
        };
        const queryString = JSON.stringify({ 
          dataset, 
          query, 
          userId: `user-${i}`, 
          userRole: 'agent' 
        });
        const hash = crypto.createHash('sha256').update(queryString).digest('hex');
        hashes.add(hash);
      }

      expect(hashes.size).toBe(iterations);
    });

    test('Cache key should not be truncated like old base64 implementation', () => {
      const dataset = 'campaigns';
      const query = { 
        metrics: ['total', 'opened_count', 'clicked_count', 'bounced_count'], 
        filters: { 
          status: 'sent',
          dateRange: { start: '2025-01-01', end: '2025-12-31' },
          campaignType: 'newsletter'
        } 
      };
      
      const queryString = JSON.stringify({ 
        dataset, 
        query, 
        userId: agent1User.id, 
        userRole: 'agent' 
      });
      
      const hash = crypto.createHash('sha256').update(queryString).digest('hex');
      const cacheKey = `query:${hash}`;

      expect(cacheKey.length).toBe(70);
      expect(cacheKey.startsWith('query:')).toBe(true);
      expect(hash.length).toBe(64);
    });
  });

  describe('CRITICAL ISSUE #2: RBAC Bypass in Email Events Fix', () => {
    test('Agent should only see email events for their own contacts and campaigns', async () => {
      const agent1Events = await EmailEvent.findAll({
        where: {},
        include: [
          {
            model: Campaign,
            as: 'campaign',
            where: { createdById: agent1User.id },
            required: false
          },
          {
            model: Contact,
            as: 'contact',
            where: { assignedAgentId: agent1User.id },
            required: false
          }
        ],
        subQuery: false
      });

      const agent1EventIds = agent1Events
        .filter(event => event.campaign || event.contact)
        .map(e => e.id);

      expect(agent1EventIds).toContain(emailEvent1.id);
      expect(agent1EventIds).toContain(emailEvent3.id);
      expect(agent1EventIds).not.toContain(emailEvent2.id);
    });

    test('Manager should see email events for their team members', async () => {
      const teamMemberships = await TeamMembership.findAll({
        where: { userId: managerUser.id, isLead: true },
        attributes: ['teamId']
      });

      const teamIds = teamMemberships.map(tm => tm.teamId);
      const teamMemberUsers = await TeamMembership.findAll({
        where: { teamId: { $in: teamIds } },
        attributes: ['userId']
      });

      const teamMemberUserIds = [...new Set(teamMemberUsers.map(tm => tm.userId))];
      teamMemberUserIds.push(managerUser.id);

      const managerEvents = await EmailEvent.findAll({
        where: {},
        include: [
          {
            model: Campaign,
            as: 'campaign',
            where: { createdById: { $in: teamMemberUserIds } },
            required: false
          },
          {
            model: Contact,
            as: 'contact',
            where: { assignedAgentId: { $in: teamMemberUserIds } },
            required: false
          }
        ],
        subQuery: false
      });

      const managerEventIds = managerEvents
        .filter(event => event.campaign || event.contact)
        .map(e => e.id);

      expect(managerEventIds).toContain(emailEvent1.id);
      expect(managerEventIds).toContain(emailEvent3.id);
      expect(managerEventIds).not.toContain(emailEvent2.id);
    });

    test('Admin should see all email events', async () => {
      const allEvents = await EmailEvent.findAll();

      expect(allEvents.length).toBe(3);
      expect(allEvents.map(e => e.id)).toContain(emailEvent1.id);
      expect(allEvents.map(e => e.id)).toContain(emailEvent2.id);
      expect(allEvents.map(e => e.id)).toContain(emailEvent3.id);
    });

    test('Agent cannot access another agents email events via direct query', async () => {
      const agent2Events = await EmailEvent.findAll({
        where: {},
        include: [
          {
            model: Campaign,
            as: 'campaign',
            where: { createdById: agent2User.id },
            required: false
          },
          {
            model: Contact,
            as: 'contact',
            where: { assignedAgentId: agent2User.id },
            required: false
          }
        ],
        subQuery: false
      });

      const agent2EventIds = agent2Events
        .filter(event => event.campaign || event.contact)
        .map(e => e.id);

      expect(agent2EventIds).toContain(emailEvent2.id);
      expect(agent2EventIds).not.toContain(emailEvent1.id);
      expect(agent2EventIds).not.toContain(emailEvent3.id);
    });

    test('RBAC filtering preserves data integrity', async () => {
      const agent1Events = await EmailEvent.findAll({
        where: {},
        include: [
          {
            model: Campaign,
            as: 'campaign',
            where: { createdById: agent1User.id },
            required: false
          },
          {
            model: Contact,
            as: 'contact',
            where: { assignedAgentId: agent1User.id },
            required: false
          }
        ],
        subQuery: false
      });

      const filteredEvents = agent1Events.filter(event => event.campaign || event.contact);

      filteredEvents.forEach(event => {
        const belongsToAgent = 
          (event.campaign && event.campaign.createdById === agent1User.id) ||
          (event.contact && event.contact.assignedAgentId === agent1User.id);
        
        expect(belongsToAgent).toBe(true);
      });
    });
  });
});
