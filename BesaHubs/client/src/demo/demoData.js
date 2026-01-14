// Centralized demo dataset used across the app when APIs are unavailable.
// Goal: consistent IDs across entities so links (deal -> contact/property, debt -> property, etc.) work.

const isoDaysFromNow = (days, hour = 10, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const money = (n) => Number(n);

const demoAgents = [
  { id: 'a1', firstName: 'Alex', lastName: 'Broker', email: 'alex@besahub.demo' },
  { id: 'a2', firstName: 'Sam', lastName: 'Closer', email: 'sam@besahub.demo' },
  { id: 'a3', firstName: 'Jordan', lastName: 'Leasing', email: 'jordan@besahub.demo' }
];

const demoCompanies = [
  { id: 'co1', name: 'Park Investment Group', industry: 'Real Estate', status: 'active', city: 'New York', state: 'NY' },
  { id: 'co2', name: 'Global Logistics Solutions', industry: 'Logistics', status: 'active', city: 'Los Angeles', state: 'CA' },
  { id: 'co3', name: 'Healthcare Partners LLC', industry: 'Healthcare', status: 'active', city: 'Chicago', state: 'IL' },
  { id: 'co4', name: 'TechStart Ventures', industry: 'Technology', status: 'active', city: 'Austin', state: 'TX' }
];

const demoContacts = [
  { id: '1', firstName: 'David', lastName: 'Park', companyName: 'Park Investment Group', companyId: 'co1', role: 'investor', status: 'hot', email: 'david.park@pig.demo', phone: '(555) 101-1001', city: 'New York', state: 'NY', budget: money(30000000), lastContactDate: isoDaysFromNow(-1, 15, 0) },
  { id: '2', firstName: 'Richard', lastName: 'Martinez', companyName: 'Global Logistics Solutions', companyId: 'co2', role: 'tenant', status: 'active', email: 'richard.martinez@gls.demo', phone: '(555) 202-2002', city: 'Los Angeles', state: 'CA', budget: money(3000000), lastContactDate: isoDaysFromNow(-3, 11, 30) },
  { id: '3', firstName: 'Patricia', lastName: 'Anderson', companyName: 'Healthcare Partners LLC', companyId: 'co3', role: 'investor', status: 'qualified', email: 'patricia.anderson@hp.demo', phone: '(555) 303-3003', city: 'Chicago', state: 'IL', budget: money(15000000), lastContactDate: isoDaysFromNow(-2, 9, 0) },
  { id: '4', firstName: 'Thomas', lastName: 'Wilson', companyName: 'Wilson Retail Holdings', companyId: null, role: 'investor', status: 'active', email: 'thomas.wilson@wrh.demo', phone: '(555) 404-4004', city: 'Miami', state: 'FL', budget: money(8000000), lastContactDate: isoDaysFromNow(-5, 14, 0) },
  { id: '5', firstName: 'Alex', lastName: 'Kumar', companyName: 'TechStart Ventures', companyId: 'co4', role: 'tenant', status: 'active', email: 'alex.kumar@tsv.demo', phone: '(555) 505-5005', city: 'Austin', state: 'TX', budget: money(2000000), lastContactDate: isoDaysFromNow(0, 10, 15) }
];

const demoProperties = Array.from({ length: 20 }).map((_, i) => {
  const id = String(i + 1);
  const types = ['office', 'industrial', 'medical', 'retail', 'multifamily', 'hotel', 'mixed-use', 'self-storage', 'land'];
  const type = types[i % types.length];
  return {
    id,
    name: `Property ${id} - ${type.replace('-', ' ').toUpperCase()}`,
    address: `${100 + i * 7} Market Street`,
    city: ['New York', 'Los Angeles', 'Chicago', 'Austin', 'Miami', 'Seattle'][i % 6],
    state: ['NY', 'CA', 'IL', 'TX', 'FL', 'WA'][i % 6],
    propertyType: type,
    status: i % 5 === 0 ? 'available' : 'active',
    sqft: 15000 + i * 1200,
    price: money(900000 + i * 350000),
    capRate: Number((4.5 + (i % 6) * 0.4).toFixed(1)),
    lastUpdated: isoDaysFromNow(-(i % 10), 12, 0)
  };
});

const demoDeals = Array.from({ length: 20 }).map((_, i) => {
  const id = String(i + 1);
  const contactId = String(((i % demoContacts.length) + 1));
  const propertyId = String(i + 1);
  const stage = ['prospecting', 'qualification', 'proposal', 'negotiation', 'due_diligence', 'closing'][i % 6];
  const type = ['sale', 'lease', 'sublease'][i % 3];
  const priority = ['low', 'medium', 'high'][i % 3];
  const value = money(250000 + i * 650000);
  const probability = [10, 25, 40, 55, 70, 85, 95][i % 7];
  const assignedTo = demoAgents[i % demoAgents.length];
  const contact = demoContacts.find((c) => c.id === contactId) || demoContacts[0];
  const property = demoProperties.find((p) => p.id === propertyId) || demoProperties[0];
  return {
    id,
    name: `${property.name} - ${type.toUpperCase()} Opportunity`,
    propertyId,
    contactId,
    stage,
    type,
    priority,
    value,
    probability,
    expectedCloseDate: isoDaysFromNow((i % 30) + 5, 16, 0).slice(0, 10),
    createdAt: isoDaysFromNow(-(i % 20), 9, 0),
    lastActivityDate: isoDaysFromNow(-(i % 12), 13, 30),
    assignedTo,
    property: { name: property.name, address: `${property.address}, ${property.city}`, propertyType: property.propertyType },
    contact: { firstName: contact.firstName, lastName: contact.lastName, companyName: contact.companyName, type: contact.companyId ? 'company' : 'individual' },
    notes: 'Demo deal seeded for end-to-end workflow validation.',
    tags: probability >= 80 ? ['Hot Lead'] : ['Follow Up'],
    commissionStructure: { type: 'percentage', rate: 3, amount: value * 0.03 }
  };
});

const demoTasks = [
  { id: 't1', title: 'Call investor about pricing guidance', contactId: '1', propertyId: '1', priority: 'high', status: 'pending', dueDate: isoDaysFromNow(0, 9, 30), taskType: 'call' },
  { id: 't2', title: 'Send LOI draft to tenant rep', contactId: '2', propertyId: '2', priority: 'medium', status: 'pending', dueDate: isoDaysFromNow(0, 13, 0), taskType: 'document' },
  { id: 't3', title: 'Schedule site tour', contactId: '5', propertyId: '5', priority: 'high', status: 'pending', dueDate: isoDaysFromNow(1, 11, 0), taskType: 'viewing' }
];

const demoCalendarEvents = [
  { id: 'e1', title: 'Tour - Property 5', start: isoDaysFromNow(0, 15, 0), end: isoDaysFromNow(0, 16, 0), location: 'Property 5', type: 'showing', status: 'confirmed' },
  { id: 'e2', title: 'Client call - Park Investment Group', start: isoDaysFromNow(0, 10, 0), end: isoDaysFromNow(0, 10, 30), location: 'Phone', type: 'call', status: 'confirmed' }
];

const demoDebts = [
  { id: 'd1', lender: 'First National Bank', amount: money(3500000), maturityDate: isoDaysFromNow(45, 0, 0).slice(0, 10), propertyId: '3', status: 'maturing' },
  { id: 'd2', lender: 'Capital Lending Partners', amount: money(7200000), maturityDate: isoDaysFromNow(120, 0, 0).slice(0, 10), propertyId: '7', status: 'active' }
];

const demoLeases = [
  { id: 'l1', propertyId: '2', tenantName: 'Global Logistics Solutions', monthlyRent: money(38000), startDate: '2023-06-01', endDate: isoDaysFromNow(80, 0, 0).slice(0, 10), status: 'active' },
  { id: 'l2', propertyId: '5', tenantName: 'TechStart Ventures', monthlyRent: money(22000), startDate: '2022-09-01', endDate: isoDaysFromNow(25, 0, 0).slice(0, 10), status: 'expiring-soon' }
];

export const demo = {
  agents: demoAgents,
  companies: demoCompanies,
  contacts: demoContacts,
  properties: demoProperties,
  deals: demoDeals,
  tasks: demoTasks,
  calendarEvents: demoCalendarEvents,
  debts: demoDebts,
  leases: demoLeases
};

export default demo;

