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
            .setDescription('Summarize messages from the last N hours')
            .addIntegerOption(option =>
              option.setName('hours')
                .setDescription('How many hours back?')
                .setRequired(true)
                .addChoices(
                  { name: '1 hour', value: 1 },
                  { name: '2 hours', value: 2 },
                  { name: '3 hours', value: 3 },
                  { name: '4 hours', value: 4 },
                  { name: '5 hours', value: 5 },
                  { name: '6 hours', value: 6 },
                  { name: '7 hours', value: 7 },
                  { name: '8 hours', value: 8 },
                  { name: '9 hours', value: 9 },
                  { name: '10 hours', value: 10 },
                  { name: '11 hours', value: 11 },
                  { name: '12 hours', value: 12 },
                  { name: '13 hours', value: 13 },
                  { name: '14 hours', value: 14 },
                  { name: '15 hours', value: 15 },
                  { name: '16 hours', value: 16 },
                  { name: '17 hours', value: 17 },
                  { name: '18 hours', value: 18 },
                  { name: '19 hours', value: 19 },
                  { name: '20 hours', value: 20 },
                  { name: '21 hours', value: 21 },
                  { name: '22 hours', value: 22 },
                  { name: '23 hours', value: 23 },
                  { name: '24 hours', value: 24 }
                )
            )
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
    console.log('--- /summarize command invoked ---');
    try {
      const hours = interaction.options.getInteger('hours');
      console.log('Selected hours:', hours);
      console.log('Interaction:', {
        user: interaction.user.tag,
        channel: interaction.channelId,
        guild: interaction.guildId
      });
      const messages = await interaction.channel.messages.fetch({ limit: 50 });
      const now = Date.now();
      const recent = messages
        .filter(m => now - m.createdTimestamp < hours * 60 * 60 * 1000)
        .map(m => ({ user: m.author.username, text: m.content }))
        .reverse(); // chronological order
      console.log('Fetched recent messages:', recent);

      const payload = {
        channel_id: interaction.channelId,
        user_id: interaction.user.id,
        hours,
        messages: recent
      };
      console.log('Posting to webhook:', process.env.WEBHOOK_URL);
      console.log('Payload:', JSON.stringify(payload, null, 2));

      const webhookResponse = await axios.post(process.env.WEBHOOK_URL, payload);
      console.log('Webhook response status:', webhookResponse.status);
      console.log('Webhook response data:', webhookResponse.data);

      await interaction.reply({ 
        content: '✅ Sent to AI for summarization!', 
        flags: 64 // 64 is the flag for ephemeral messages
      });
    } catch (error) {
      console.error('Error processing summarize command:', error);
      if (error.response) {
        console.error('Webhook error response:', error.response.status, error.response.data);
      }
      await interaction.reply({ 
        content: '❌ Error processing request', 
        flags: 64 // 64 is the flag for ephemeral messages
      });
    }
  }
});

// Login to Discord with your bot token
client.login(process.env.DISCORD_TOKEN); 