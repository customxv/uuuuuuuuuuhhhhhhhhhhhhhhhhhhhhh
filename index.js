require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN || 'MTQ0OTkwMzYwMjEwODcyNzM0OQ.GuD7B4.0Jhe8RDwhIaIl1FxaliV4ZHJ_LafdOvHSmMJwM';
const CLIENT_ID = process.env.CLIENT_ID || '1449903602108727349';
const GUILD_ID = process.env.GUILD_ID || '11449893231100694582';

// In-memory storage for simplicity (replace with database for production)
let xpData = {};
let warnings = {};
let config = {
  logsChannel: null,
  welcomeChannel: null,
  levelChannel: null,
  xpBlacklist: new Set(),
  xpWhitelist: new Set(),
};
let xpCooldowns = new Map();

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  const commands = [
    // Moderation commands
    new SlashCommandBuilder()
      .setName('purge')
      .setDescription('Delete a number of messages')
      .addIntegerOption(option => option.setName('number').setDescription('Number of messages to delete').setRequired(true)),
    new SlashCommandBuilder()
      .setName('slowmode')
      .setDescription('Set slowmode in the channel')
      .addIntegerOption(option => option.setName('seconds').setDescription('Slowmode duration in seconds').setRequired(true)),
    new SlashCommandBuilder()
      .setName('lock')
      .setDescription('Lock the channel'),
    new SlashCommandBuilder()
      .setName('unlock')
      .setDescription('Unlock the channel'),
    new SlashCommandBuilder()
      .setName('mute')
      .setDescription('Mute a user')
      .addUserOption(option => option.setName('user').setDescription('User to mute').setRequired(true))
      .addStringOption(option => option.setName('time').setDescription('Duration (e.g., 10m)').setRequired(true))
      .addStringOption(option => option.setName('reason').setDescription('Reason for mute').setRequired(true)),
    new SlashCommandBuilder()
      .setName('unmute')
      .setDescription('Unmute a user')
      .addUserOption(option => option.setName('user').setDescription('User to unmute').setRequired(true)),
    new SlashCommandBuilder()
      .setName('timeout')
      .setDescription('Timeout a user')
      .addUserOption(option => option.setName('user').setDescription('User to timeout').setRequired(true))
      .addStringOption(option => option.setName('time').setDescription('Duration (e.g., 10m)').setRequired(true)),
    new SlashCommandBuilder()
      .setName('untimeout')
      .setDescription('Remove timeout from a user')
      .addUserOption(option => option.setName('user').setDescription('User to untimeout').setRequired(true)),
    new SlashCommandBuilder()
      .setName('kick')
      .setDescription('Kick a user')
      .addUserOption(option => option.setName('user').setDescription('User to kick').setRequired(true))
      .addStringOption(option => option.setName('reason').setDescription('Reason for kick').setRequired(true)),
    new SlashCommandBuilder()
      .setName('ban')
      .setDescription('Ban a user')
      .addUserOption(option => option.setName('user').setDescription('User to ban').setRequired(true))
      .addStringOption(option => option.setName('reason').setDescription('Reason for ban').setRequired(true)),
    new SlashCommandBuilder()
      .setName('unban')
      .setDescription('Unban a user')
      .addStringOption(option => option.setName('user').setDescription('User ID to unban').setRequired(true)),
    new SlashCommandBuilder()
      .setName('warn')
      .setDescription('Warn a user')
      .addUserOption(option => option.setName('user').setDescription('User to warn').setRequired(true))
      .addStringOption(option => option.setName('reason').setDescription('Reason for warning').setRequired(true)),
    new SlashCommandBuilder()
      .setName('warnings')
      .setDescription('View warnings for a user')
      .addUserOption(option => option.setName('user').setDescription('User to check').setRequired(true)),
    new SlashCommandBuilder()
      .setName('clearwarnings')
      .setDescription('Clear warnings for a user')
      .addUserOption(option => option.setName('user').setDescription('User to clear warnings for').setRequired(true)),
    new SlashCommandBuilder()
      .setName('clearreactions')
      .setDescription('Clear reactions from the message'),

    // Admin/Config commands
    new SlashCommandBuilder()
      .setName('setlogs')
      .setDescription('Set the logs channel')
      .addChannelOption(option => option.setName('channel').setDescription('Channel for logs').setRequired(true)),
    new SlashCommandBuilder()
      .setName('setwelcome')
      .setDescription('Set the welcome channel')
      .addChannelOption(option => option.setName('channel').setDescription('Channel for welcomes').setRequired(true)),
    new SlashCommandBuilder()
      .setName('setlevelchannel')
      .setDescription('Set the level up channel')
      .addChannelOption(option => option.setName('channel').setDescription('Channel for level ups').setRequired(true)),
    new SlashCommandBuilder()
      .setName('setxp')
      .setDescription('Set XP for a user')
      .addUserOption(option => option.setName('user').setDescription('User to set XP for').setRequired(true))
      .addIntegerOption(option => option.setName('amount').setDescription('XP amount').setRequired(true)),
    new SlashCommandBuilder()
      .setName('resetxp')
      .setDescription('Reset XP for a user')
      .addUserOption(option => option.setName('user').setDescription('User to reset XP for').setRequired(true)),
    new SlashCommandBuilder()
      .setName('blacklistxp')
      .setDescription('Blacklist a channel from XP')
      .addChannelOption(option => option.setName('channel').setDescription('Channel to blacklist').setRequired(true)),
    new SlashCommandBuilder()
      .setName('whitelistxp')
      .setDescription('Whitelist a channel for XP')
      .addChannelOption(option => option.setName('channel').setDescription('Channel to whitelist').setRequired(true)),
    new SlashCommandBuilder()
      .setName('forcerole')
      .setDescription('Force assign a role to a user')
      .addUserOption(option => option.setName('user').setDescription('User to assign role').setRequired(true))
      .addRoleOption(option => option.setName('role').setDescription('Role to assign').setRequired(true)),

    // User commands
    new SlashCommandBuilder()
      .setName('level')
      .setDescription('Check your level'),
    new SlashCommandBuilder()
      .setName('rank')
      .setDescription('Check your rank'),
    new SlashCommandBuilder()
      .setName('leaderboard')
      .setDescription('View XP leaderboard'),
    new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Ping the bot'),
    new SlashCommandBuilder()
      .setName('serverinfo')
      .setDescription('Get server information'),
    new SlashCommandBuilder()
      .setName('userinfo')
      .setDescription('Get user information')
      .addUserOption(option => option.setName('user').setDescription('User to get info for').setRequired(true)),
  ];

  await client.application.commands.set(commands, GUILD_ID);
  console.log('Commands registered!');
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, user, member, guild, channel } = interaction;
  const timestamp = new Date().toISOString();

  // Determine user role
  let userRole = 'User';
  if (member.roles.cache.some(role => role.name === 'VAR Officials')) {
    userRole = 'VAR Official';
  } else if (member.roles.cache.some(role => role.name === 'Match Officials')) {
    userRole = 'Match Official';
  }

  // Permission checks
  const isModerator = userRole === 'Match Official' || userRole === 'VAR Official';
  const isAdmin = userRole === 'VAR Official';

  let hasPermission = false;
  let result = 'Failed: Insufficient permissions';

  if (['purge', 'slowmode', 'lock', 'unlock', 'mute', 'unmute', 'timeout', 'untimeout', 'kick', 'ban', 'unban', 'warn', 'warnings', 'clearwarnings', 'clearreactions'].includes(commandName)) {
    hasPermission = isModerator;
  } else if (['setlogs', 'setwelcome', 'setlevelchannel', 'setxp', 'resetxp', 'blacklistxp', 'whitelistxp', 'forcerole'].includes(commandName)) {
    hasPermission = isAdmin;
  } else {
    hasPermission = true; // User commands
  }

  if (!hasPermission) {
    await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    logCommand(user, userRole, commandName, channel, timestamp, result);
    return;
  }

  // Execute command
  try {
    await interaction.deferReply({ ephemeral: true });

    switch (commandName) {
      case 'purge':
        const number = interaction.options.getInteger('number');
        await channel.bulkDelete(number);
        result = `Purged ${number} messages`;
        break;
      case 'slowmode':
        const seconds = interaction.options.getInteger('seconds');
        await channel.setRateLimitPerUser(seconds);
        result = `Set slowmode to ${seconds} seconds`;
        break;
      case 'lock':
        await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
        result = 'Channel locked';
        break;
      case 'unlock':
        await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null });
        result = 'Channel unlocked';
        break;
      case 'mute':
        const muteUser = interaction.options.getUser('user');
        const muteTime = interaction.options.getString('time');
        const muteReason = interaction.options.getString('reason');
        await guild.members.cache.get(muteUser.id).timeout(ms(muteTime), muteReason);
        result = `Muted ${muteUser.tag} for ${muteTime}: ${muteReason}`;
        break;
      case 'unmute':
        const unmuteUser = interaction.options.getUser('user');
        await guild.members.cache.get(unmuteUser.id).timeout(null);
        result = `Unmuted ${unmuteUser.tag}`;
        break;
      case 'timeout':
        const timeoutUser = interaction.options.getUser('user');
        const timeoutTime = interaction.options.getString('time');
        await guild.members.cache.get(timeoutUser.id).timeout(ms(timeoutTime));
        result = `Timed out ${timeoutUser.tag} for ${timeoutTime}`;
        break;
      case 'untimeout':
        const untimeoutUser = interaction.options.getUser('user');
        await guild.members.cache.get(untimeoutUser.id).timeout(null);
        result = `Removed timeout from ${untimeoutUser.tag}`;
        break;
      case 'kick':
        const kickUser = interaction.options.getUser('user');
        const kickReason = interaction.options.getString('reason');
        await guild.members.cache.get(kickUser.id).kick(kickReason);
        result = `Kicked ${kickUser.tag}: ${kickReason}`;
        break;
      case 'ban':
        const banUser = interaction.options.getUser('user');
        const banReason = interaction.options.getString('reason');
        await guild.members.ban(banUser, { reason: banReason });
        result = `Banned ${banUser.tag}: ${banReason}`;
        break;
      case 'unban':
        const unbanUserId = interaction.options.getString('user');
        await guild.members.unban(unbanUserId);
        result = `Unbanned user ID ${unbanUserId}`;
        break;
      case 'warn':
        const warnUser = interaction.options.getUser('user');
        const warnReason = interaction.options.getString('reason');
        if (!warnings[warnUser.id]) warnings[warnUser.id] = [];
        warnings[warnUser.id].push({ reason: warnReason, timestamp });
        result = `Warned ${warnUser.tag}: ${warnReason}`;
        break;
      case 'warnings':
        const warningsUser = interaction.options.getUser('user');
        const userWarnings = warnings[warningsUser.id] || [];
        result = `Warnings for ${warningsUser.tag}: ${userWarnings.length}`;
        break;
      case 'clearwarnings':
        const clearUser = interaction.options.getUser('user');
        delete warnings[clearUser.id];
        result = `Cleared warnings for ${clearUser.tag}`;
        break;
      case 'clearreactions':
        await interaction.message.reactions.removeAll();
        result = 'Cleared reactions';
        break;
      case 'setlogs':
        config.logsChannel = interaction.options.getChannel('channel').id;
        result = `Set logs channel to ${interaction.options.getChannel('channel').name}`;
        break;
      case 'setwelcome':
        config.welcomeChannel = interaction.options.getChannel('channel').id;
        result = `Set welcome channel to ${interaction.options.getChannel('channel').name}`;
        break;
      case 'setlevelchannel':
        config.levelChannel = interaction.options.getChannel('channel').id;
        result = `Set level channel to ${interaction.options.getChannel('channel').name}`;
        break;
      case 'setxp':
        const setXpUser = interaction.options.getUser('user');
        const xpAmount = interaction.options.getInteger('amount');
        xpData[setXpUser.id] = xpAmount;
        result = `Set XP for ${setXpUser.tag} to ${xpAmount}`;
        break;
      case 'resetxp':
        const resetXpUser = interaction.options.getUser('user');
        delete xpData[resetXpUser.id];
        result = `Reset XP for ${resetXpUser.tag}`;
        break;
      case 'blacklistxp':
        const blacklistChannel = interaction.options.getChannel('channel');
        config.xpBlacklist.add(blacklistChannel.id);
        result = `Blacklisted ${blacklistChannel.name} from XP`;
        break;
      case 'whitelistxp':
        const whitelistChannel = interaction.options.getChannel('channel');
        config.xpWhitelist.add(whitelistChannel.id);
        result = `Whitelisted ${whitelistChannel.name} for XP`;
        break;
      case 'forcerole':
        const forceUser = interaction.options.getUser('user');
        const forceRole = interaction.options.getRole('role');
        await guild.members.cache.get(forceUser.id).roles.add(forceRole);
        result = `Assigned ${forceRole.name} to ${forceUser.tag}`;
        break;
      case 'level':
        const userXp = xpData[user.id] || 0;
        const level = Math.floor(userXp / 100);
        result = `Your level: ${level}, XP: ${userXp}`;
        break;
      case 'rank':
        const sortedXp = Object.entries(xpData).sort((a, b) => b[1] - a[1]);
        const rank = sortedXp.findIndex(([id]) => id === user.id) + 1;
        result = `Your rank: ${rank}`;
        break;
      case 'leaderboard':
        const leaderboard = Object.entries(xpData).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, xp], index) => `${index + 1}. <@${id}> - ${xp} XP`).join('\n');
        result = `Leaderboard:\n${leaderboard}`;
        break;
      case 'ping':
        result = `Pong! Latency: ${Date.now() - interaction.createdTimestamp}ms`;
        break;
      case 'serverinfo':
        result = `Server: ${guild.name}, Members: ${guild.memberCount}`;
        break;
      case 'userinfo':
        const infoUser = interaction.options.getUser('user');
        const memberInfo = guild.members.cache.get(infoUser.id);
        result = `User: ${infoUser.tag}, Joined: ${memberInfo.joinedAt.toDateString()}`;
        break;
    }

    await interaction.editReply({ content: result });
  } catch (error) {
    console.error(error);
    result = `Error: ${error.message}`;
    await interaction.editReply({ content: 'An error occurred.' });
  }

  logCommand(user, userRole, commandName, channel, timestamp, result);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const userId = message.author.id;
  const channelId = message.channel.id;
  const guild = message.guild;

  // Check XP channel restrictions
  if (config.xpWhitelist.size > 0) {
    if (!config.xpWhitelist.has(channelId)) return;
  } else if (config.xpBlacklist.has(channelId)) {
    return;
  }

  // Check cooldown (1 minute)
  const now = Date.now();
  const lastXpTime = xpCooldowns.get(userId);
  if (lastXpTime && now - lastXpTime < 60000) return; // 60 seconds

  // Award XP (1-5 random)
  const xpGain = Math.floor(Math.random() * 5) + 1;
  const oldXp = xpData[userId] || 0;
  const newXp = oldXp + xpGain;
  xpData[userId] = newXp;

  // Update cooldown
  xpCooldowns.set(userId, now);

  // Check for level up
  const oldLevel = Math.floor(oldXp / 100);
  const newLevel = Math.floor(newXp / 100);

  if (newLevel > oldLevel && config.levelChannel) {
    const levelChannel = guild.channels.cache.get(config.levelChannel);
    if (levelChannel) {
      await levelChannel.send(`🎉 Congratulations <@${userId}>! You leveled up to level ${newLevel}!`);
    }
  }
});

async function logCommand(user, role, command, channel, timestamp, result) {
  const logsChannel = client.channels.cache.get(config.logsChannel) || client.channels.cache.find(ch => ch.name === 'bot-logs');
  if (!logsChannel) return;

  const embed = new EmbedBuilder()
    .setTitle('Command Log')
    .addFields(
      { name: 'User', value: user.tag, inline: true },
      { name: 'Role', value: role, inline: true },
      { name: 'Command', value: `/${command}`, inline: true },
      { name: 'Channel', value: channel.name, inline: true },
      { name: 'Timestamp', value: timestamp, inline: true },
      { name: 'Result', value: result, inline: false }
    )
    .setColor(0x00ff00);

  await logsChannel.send({ embeds: [embed] });
}

function ms(time) {
  const regex = /(\d+)([smhd])/;
  const match = time.match(regex);
  if (!match) return 0;
  const value = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 0;
  }
}

client.login(DISCORD_TOKEN);
