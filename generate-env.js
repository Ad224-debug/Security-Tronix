// Script para generar .env desde variables de entorno de Railway
const fs = require('fs');

const envContent = `DISCORD_TOKEN=${process.env.DISCORD_TOKEN || ''}
APPLICATION_ID=${process.env.APPLICATION_ID || ''}
`;

fs.writeFileSync('.env', envContent);
console.log('✅ .env file generated');
console.log('DISCORD_TOKEN exists:', !!process.env.DISCORD_TOKEN);
console.log('APPLICATION_ID exists:', !!process.env.APPLICATION_ID);
