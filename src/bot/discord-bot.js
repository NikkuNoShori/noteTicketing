require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

// Scheduled sweep functionality
let sweepInterval;
const SWEEP_INTERVAL_MS = 60 * 60 * 1000; // Default: 1 hour

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
  startScheduledSweep();
});

// Register the slash command once
const registerCommand = async () => {
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const guildId = process.env.GUILD_ID;
    if (guildId) {
      // Register as a guild command for instant updates
      await rest.put(
        Routes.applicationGuildCommands(process.env.APPLICATION_ID, guildId),
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
              .toJSON(),
            new SlashCommandBuilder()
              .setName('config')
              .setDescription('Configure bot settings for this server')
              .addSubcommand(subcommand =>
                subcommand
                  .setName('privacy')
                  .setDescription('Configure privacy settings')
                  .addBooleanOption(option =>
                    option.setName('enabled')
                      .setDescription('Enable privacy mode (no conversation storage)')
                      .setRequired(true)
                  )
              )
              .addSubcommand(subcommand =>
                subcommand
                  .setName('channels')
                  .setDescription('Configure channels to monitor')
                  .addChannelOption(option =>
                    option.setName('add')
                      .setDescription('Add a channel to monitor')
                      .setRequired(false)
                  )
                  .addChannelOption(option =>
                    option.setName('remove')
                      .setDescription('Remove a channel from monitoring')
                      .setRequired(false)
                  )
                  .addChannelOption(option =>
                    option.setName('todo')
                      .setDescription('Set the todo channel for action items')
                      .setRequired(false)
                  )
              )
              .addSubcommand(subcommand =>
                subcommand
                  .setName('sweep')
                  .setDescription('Configure sweep settings')
                  .addIntegerOption(option =>
                    option.setName('interval')
                      .setDescription('Sweep interval in hours (1-24)')
                      .setRequired(false)
                      .setMinValue(1)
                      .setMaxValue(24)
                  )
              )
              .toJSON()
          ] 
        }
      );
      console.log('✅ Guild slash command registered successfully!');
    } else {
      // Fallback to global command registration
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
              .toJSON(),
            new SlashCommandBuilder()
              .setName('config')
              .setDescription('Configure bot settings for this server')
              .addSubcommand(subcommand =>
                subcommand
                  .setName('privacy')
                  .setDescription('Configure privacy settings')
                  .addBooleanOption(option =>
                    option.setName('enabled')
                      .setDescription('Enable privacy mode (no conversation storage)')
                      .setRequired(true)
                  )
              )
              .addSubcommand(subcommand =>
                subcommand
                  .setName('channels')
                  .setDescription('Configure channels to monitor')
                  .addChannelOption(option =>
                    option.setName('add')
                      .setDescription('Add a channel to monitor')
                      .setRequired(false)
                  )
                  .addChannelOption(option =>
                    option.setName('remove')
                      .setDescription('Remove a channel from monitoring')
                      .setRequired(false)
                  )
                  .addChannelOption(option =>
                    option.setName('todo')
                      .setDescription('Set the todo channel for action items')
                      .setRequired(false)
                  )
              )
              .addSubcommand(subcommand =>
                subcommand
                  .setName('sweep')
                  .setDescription('Configure sweep settings')
                  .addIntegerOption(option =>
                    option.setName('interval')
                      .setDescription('Sweep interval in hours (1-24)')
                      .setRequired(false)
                      .setMinValue(1)
                      .setMaxValue(24)
                  )
              )
              .toJSON()
          ] 
        }
      );
      console.log('✅ Global slash command registered successfully!');
    }
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
  } else if (interaction.commandName === 'config') {
    console.log('--- /config command invoked ---');
    
    // Check if user has admin permissions
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      await interaction.reply({ 
        content: '❌ You need administrator permissions to configure the bot.', 
        flags: 64 
      });
      return;
    }
    
    try {
      const subcommand = interaction.options.getSubcommand();
      const guildId = interaction.guildId;
      
      if (subcommand === 'privacy') {
        const enabled = interaction.options.getBoolean('enabled');
        
        const response = await axios.patch(`${process.env.API_BASE_URL}/api/bot-config`, {
          guildId,
          privacyModeEnabled: enabled
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.MY_API_AUTH_TOKEN}`
          }
        });
        
        await interaction.reply({ 
          content: `✅ Privacy mode ${enabled ? 'enabled' : 'disabled'} successfully!`, 
          flags: 64 
        });
        
      } else if (subcommand === 'channels') {
        const addChannel = interaction.options.getChannel('add');
        const removeChannel = interaction.options.getChannel('remove');
        const todoChannel = interaction.options.getChannel('todo');
        
        // Get current config
        const configResponse = await axios.get(`${process.env.API_BASE_URL}/api/bot-config?guildId=${guildId}`, {
          headers: {
            'Authorization': `Bearer ${process.env.MY_API_AUTH_TOKEN}`
          }
        });
        
        let currentConfig = configResponse.data;
        if (!currentConfig) {
          // Create new config if it doesn't exist
          currentConfig = {
            guildId,
            channelsToMonitor: [],
            todoChannelId: null,
            sweepIntervalHours: 1,
            privacyModeEnabled: false,
            active: true
          };
        }
        
        let updateData = { guildId };
        
        if (addChannel) {
          const channels = currentConfig.channels_to_monitor || [];
          if (!channels.includes(addChannel.id)) {
            channels.push(addChannel.id);
            updateData.channelsToMonitor = channels;
          }
        }
        
        if (removeChannel) {
          const channels = currentConfig.channels_to_monitor || [];
          updateData.channelsToMonitor = channels.filter(id => id !== removeChannel.id);
        }
        
        if (todoChannel) {
          updateData.todoChannelId = todoChannel.id;
        }
        
        const response = await axios.patch(`${process.env.API_BASE_URL}/api/bot-config`, updateData, {
          headers: {
            'Authorization': `Bearer ${process.env.MY_API_AUTH_TOKEN}`
          }
        });
        
        let message = '✅ Configuration updated:\n';
        if (addChannel) message += `• Added #${addChannel.name} to monitoring\n`;
        if (removeChannel) message += `• Removed #${removeChannel.name} from monitoring\n`;
        if (todoChannel) message += `• Set #${todoChannel.name} as todo channel\n`;
        
        await interaction.reply({ 
          content: message, 
          flags: 64 
        });
        
      } else if (subcommand === 'sweep') {
        const interval = interaction.options.getInteger('interval');
        
        if (interval) {
          const response = await axios.patch(`${process.env.API_BASE_URL}/api/bot-config`, {
            guildId,
            sweepIntervalHours: interval
          }, {
            headers: {
              'Authorization': `Bearer ${process.env.MY_API_AUTH_TOKEN}`
            }
          });
          
          await interaction.reply({ 
            content: `✅ Sweep interval updated to ${interval} hours!`, 
            flags: 64 
          });
        } else {
          // Show current config
          const configResponse = await axios.get(`${process.env.API_BASE_URL}/api/bot-config?guildId=${guildId}`, {
            headers: {
              'Authorization': `Bearer ${process.env.MY_API_AUTH_TOKEN}`
            }
          });
          
          const config = configResponse.data;
          if (config) {
            await interaction.reply({ 
              content: `📋 Current configuration:\n• Sweep interval: ${config.sweep_interval_hours} hours\n• Privacy mode: ${config.privacy_mode_enabled ? 'enabled' : 'disabled'}\n• Monitored channels: ${config.channels_to_monitor?.length || 0}\n• Todo channel: ${config.todo_channel_id ? 'set' : 'not set'}`, 
              flags: 64 
            });
          } else {
            await interaction.reply({ 
              content: '❌ No configuration found for this server.', 
              flags: 64 
            });
          }
        }
      }
      
    } catch (error) {
      console.error('Error processing config command:', error);
      await interaction.reply({ 
        content: '❌ Error updating configuration', 
        flags: 64 
      });
    }
  }
});

// Scheduled sweep functionality
async function startScheduledSweep() {
  console.log('🔄 Starting scheduled channel sweep...');
  
  // Clear any existing interval
  if (sweepInterval) {
    clearInterval(sweepInterval);
  }
  
  // Start the sweep interval
  sweepInterval = setInterval(async () => {
    try {
      await performScheduledSweep();
    } catch (error) {
      console.error('❌ Error during scheduled sweep:', error);
    }
  }, SWEEP_INTERVAL_MS);
  
  // Perform initial sweep
  await performScheduledSweep();
}

async function performScheduledSweep() {
  console.log('🔍 Performing scheduled channel sweep...');
  
  try {
    // Get all guilds the bot is in
    const guilds = client.guilds.cache;
    
    for (const [guildId, guild] of guilds) {
      try {
        // Get bot configuration for this guild
        const configResponse = await axios.get(`${process.env.API_BASE_URL}/api/bot-config?guildId=${guildId}`, {
          headers: {
            'Authorization': `Bearer ${process.env.MY_API_AUTH_TOKEN}`
          }
        });
        
        const config = configResponse.data;
        
        if (!config.active || !config.channels_to_monitor || config.channels_to_monitor.length === 0) {
          console.log(`⏭️ Skipping guild ${guild.name} - not configured for sweeping`);
          continue;
        }
        
        console.log(`📋 Sweeping guild: ${guild.name}`);
        
        // Sweep each configured channel
        for (const channelId of config.channels_to_monitor) {
          try {
            const channel = await guild.channels.fetch(channelId);
            if (!channel || !channel.isTextBased()) {
              console.log(`⚠️ Channel ${channelId} not found or not text-based`);
              continue;
            }
            
            console.log(`📝 Sweeping channel: ${channel.name}`);
            
            // Fetch recent messages (last hour by default)
            const messages = await channel.messages.fetch({ limit: 100 });
            const now = Date.now();
            const recentMessages = messages
              .filter(m => now - m.createdTimestamp < config.sweep_interval_hours * 60 * 60 * 1000)
              .map(m => ({
                id: m.id,
                content: m.content,
                author: { username: m.author.username, id: m.author.id },
                createdTimestamp: m.createdTimestamp
              }))
              .reverse(); // chronological order
            
            if (recentMessages.length === 0) {
              console.log(`📭 No recent messages in ${channel.name}`);
              continue;
            }
            
            // Send to sweep API
            const sweepResponse = await axios.post(`${process.env.API_BASE_URL}/api/sweep-channels`, {
              guildId,
              channelId,
              messages: recentMessages,
              sweepType: 'scheduled'
            }, {
              headers: {
                'Authorization': `Bearer ${process.env.MY_API_AUTH_TOKEN}`
              }
            });
            
            const result = sweepResponse.data;
            console.log(`✅ Sweep completed for ${channel.name}: ${result.processed} messages processed, ${result.actionItemsFound} action items found`);
            
            // If action items were found and we have a todo channel, post them
            if (result.actionItemsFound > 0 && config.todo_channel_id) {
              await postActionItemsToChannel(result.actionItems, config.todo_channel_id, channel.name);
            }
            
          } catch (channelError) {
            console.error(`❌ Error sweeping channel ${channelId}:`, channelError.message);
          }
        }
        
        // Update last sweep time
        await axios.patch(`${process.env.API_BASE_URL}/api/bot-config`, {
          guildId,
          lastSweepTime: new Date().toISOString()
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.MY_API_AUTH_TOKEN}`
          }
        });
        
      } catch (guildError) {
        console.error(`❌ Error processing guild ${guildId}:`, guildError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during scheduled sweep:', error);
  }
}

async function postActionItemsToChannel(actionItems, todoChannelId, sourceChannelName) {
  try {
    const todoChannel = await client.channels.fetch(todoChannelId);
    if (!todoChannel || !todoChannel.isTextBased()) {
      console.log(`⚠️ Todo channel ${todoChannelId} not found or not text-based`);
      return;
    }
    
    const embed = {
      color: 0x00ff00,
      title: `🆕 New Action Items from #${sourceChannelName}`,
      description: 'The following action items were automatically detected:',
      fields: actionItems.map((item, index) => ({
        name: `📋 ${item.text.substring(0, 100)}${item.text.length > 100 ? '...' : ''}`,
        value: `**Priority:** ${item.priority || 'medium'}\n**Category:** ${item.category || 'general'}${item.assigned_to ? `\n**Assigned to:** ${item.assigned_to}` : ''}`,
        inline: false
      })),
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Auto-detected by NoteTicketing Bot'
      }
    };
    
    await todoChannel.send({ embeds: [embed] });
    console.log(`✅ Posted ${actionItems.length} action items to todo channel`);
    
  } catch (error) {
    console.error('❌ Error posting action items to todo channel:', error);
  }
}

// Login to Discord with your bot token
client.login(process.env.DISCORD_TOKEN); 