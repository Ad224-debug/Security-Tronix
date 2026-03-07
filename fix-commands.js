const fs = require('fs');
const path = require('path');

// Comandos que ya están en formato correcto
const skipCommands = ['role.js', 'event.js'];

// Comandos a convertir
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => 
  file.endsWith('.js') && !skipCommands.includes(file)
);

console.log(`🔄 Convirtiendo ${commandFiles.length} comandos...`);

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Solo convertir si tiene el formato antiguo
  if (content.includes('data: {') && !content.includes('SlashCommandBuilder')) {
    console.log(`  ✏️  ${file}`);
    
    // Agregar import de SlashCommandBuilder si no existe
    if (!content.includes('SlashCommandBuilder')) {
      content = content.replace(
        /const { ([^}]+) } = require\('discord\.js'\);/,
        "const { SlashCommandBuilder, $1 } = require('discord.js');"
      );
    }
    
    // Convertir data: { a data: new SlashCommandBuilder()
    content = content.replace(
      /data: \{[\s\S]*?name: '([^']+)',[\s\S]*?description: '([^']+)',/,
      (match, name, desc) => {
        return `data: new SlashCommandBuilder()\n    .setName('${name}')\n    .setDescription('${desc}'),`;
      }
    );
    
    // Remover options array si existe (se manejará manualmente después)
    content = content.replace(/options: \[[\s\S]*?\],\s*\},/, '},');
    
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

console.log('✅ Conversión completada!');
console.log('⚠️  NOTA: Algunos comandos pueden necesitar ajustes manuales en las opciones.');
