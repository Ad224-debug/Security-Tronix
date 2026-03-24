require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  try {
    const cmd = require(path.join(commandsPath, file));
    if (cmd.data) commands.push(cmd.data.toJSON ? cmd.data.toJSON() : cmd.data);
  } catch (e) {
    console.error(`Error loading ${file}:`, e.message);
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Deploying ${commands.length} commands...`);
    await rest.put(Routes.applicationCommands(process.env.APPLICATION_ID), { body: commands });
    console.log(`✅ Done — ${commands.length} commands deployed.`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  process.exit(0);
})();
