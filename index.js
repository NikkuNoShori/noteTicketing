require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

// Debug: Check if environment variables are loaded
console.log('Environment variables loaded:');
console.log('DISCORD_TOKEN:', process.env.DISCORD_TOKEN ? '✅ Set' : '❌ Missing');
console.log('APPLICATION_ID:', process.env.APPLICATION_ID ? '✅ Set' : '❌ Missing');
console.log('WEBHOOK_URL:', process.env.WEBHOOK_URL ? '✅ Set' : '❌ Missing');
if (process.env.WEBHOOK_URL) {
  console.log('WEBHOOK_URL value:', process.env.WEBHOOK_URL);
}

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ] 
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  registerCommand();
});

// Register the slash command once
const registerCommand = async () => {
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(
      Routes.applicationCommands(process.env.APPLICATION_ID),
      { 
        body: [
          new SlashCommandBuilder()
            .setName('summarize')
            .setDescription('Summarize last few hours of messages')
            .toJSON()
        ] 
      }
    );
    console.log('✅ Slash command registered successfully!');
  } catch (error) {
    console.error('❌ Error registering slash command:', error);
  }
};

// Handle slash command
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  
  if (interaction.commandName === 'summarize') {
    try {
      const messages = await interaction.channel.messages.fetch({ limit: 50 });
      const now = Date.now();
      const recent = messages
        .filter(m => now - m.createdTimestamp < 3 * 60 * 60 * 1000) // last 3 hours
        .map(m => ({ user: m.author.username, text: m.content }))
        .reverse(); // chronological order

      await axios.post(process.env.WEBHOOK_URL, {
        channel_id: interaction.channelId,
        user_id: interaction.user.id,
        messages: recent
      });

      await interaction.reply({ 
        content: '✅ Sent to AI for summarization!', 
        flags: 64 // 64 is the flag for ephemeral messages
      });
    } catch (error) {
      console.error('Error processing summarize command:', error);
      await interaction.reply({ 
        content: '❌ Error processing request', 
        flags: 64 // 64 is the flag for ephemeral messages
      });
    }
  }
});

// Login to Discord with your bot token
client.login(process.env.DISCORD_TOKEN); 