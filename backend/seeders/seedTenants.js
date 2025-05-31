// seedTenants.js
// This script generates 500 tenant records for seeding your database.

const { faker } = require('@faker-js/faker');
const { v4: uuidv4 } = require('uuid');

// Define some sample values for specific fields.
const industries = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Retail',
  'Manufacturing',
  'Hospitality'
];
const subscriptionTiers = ['Free', 'Pro', 'Enterprise'];

const tenants = [];

for (let i = 0; i < 3500; i++) {
  const createdAt = faker.date.past(1);
  const updatedAt = new Date();

  // Optionally vary MFA options.
  const allowedMfa = faker.datatype.boolean()
    ? ['SMS']
    : faker.datatype.boolean()
      ? ['EMAIL']
      : ['SMS', 'EMAIL'];

  const tenant = {
    id: uuidv4(),
    name: faker.company.name(), // Updated to use new API
    domain: faker.internet.domainName(),
    industry: faker.helpers.arrayElement(industries),
    subscriptionTier: faker.helpers.arrayElement(subscriptionTiers),
    isActive: faker.datatype.boolean(),
    logoUrl: faker.image.urlLoremFlickr({ 
      width: 640, 
      height: 480, 
      category: 'business', 
      randomize: true 
    }),
    companyWebsite: faker.internet.url(),
    billingStreet: faker.address.streetAddress(),
    billingCity: faker.address.city(),
    billingState: faker.address.state(),
    billingZip: faker.address.zipCode(),
    billingCountry: faker.address.countryCode(),
    billingPhone: faker.phone.number(),
    mfaEnabled: faker.datatype.boolean(),
    allowedMfa: allowedMfa,
    createdAt,
    updatedAt
  };
  tenants.push(tenant);
}

// Output the generated data as a formatted JSON string.
console.log(JSON.stringify(tenants, null, 2));