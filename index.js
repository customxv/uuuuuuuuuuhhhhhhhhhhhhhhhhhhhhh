require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Initialize client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Constants
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const jokes = [
  "Why don't scientists trust atoms? Because they make up everything!",
  "Why did the scarecrow win an award? Because he was outstanding in his field!",
  "What do you call fake spaghetti? An impasta!",
  "Why don't eggs tell jokes? They'd crack each other up!",
  "What do you call a belt made out of watches? A waist of time!",
  "Why couldn't the bicycle stand up by itself? It was two-tired!",
  "What do you call cheese that isn't yours? Nacho cheese!",
  "Why did the math book look sad? Because it had too many problems!",
  "What do you call a factory that makes okay products? A satisfactory!",
  "Why did the golfer bring two pairs of pants? In case he got a hole in one!"
];

const quotes = [
  "The only way to do great work is to love what you do. - Steve Jobs",
  "Believe you can and you're halfway there. - Theodore Roosevelt",
  "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
  "You miss 100% of the shots you don't take. - Wayne Gretzky",
  "The best way to predict the future is to create it. - Peter Drucker",
  "Life is what happens to you while you're busy making other plans. - John Lennon",
  "The only impossible journey is the one you never begin. - Tony Robbins",
  "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
  "The way to get started is to quit talking and begin doing. - Walt Disney",
  "Your time is limited, so don't waste it living someone else's life. - Steve Jobs"
];

const facts = [
  "A group of flamingos is called a 'flamboyance'.",
  "Octopuses have three hearts and blue blood.",
  "A day on Venus is longer than its year.",
  "Honey never spoils. Archaeologists have found edible honey in ancient tombs.",
  "The shortest war in history lasted only 38-45 minutes.",
  "A bolt of lightning is five times hotter than the surface of the sun.",
  "Bananas are berries, but strawberries aren't.",
  "The human brain uses about 20% of the body's total energy.",
  "There are more possible games of chess than atoms in the observable universe.",
  "A shrimp's heart is in its head."
];

const riddles = [
  { question: "What has keys but can't open locks?", answer: "piano" },
  { question: "What comes once in a minute, twice in a moment, but never in a thousand years?", answer: "m" },
  { question: "I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?", answer: "echo" },
  { question: "What has a head, a tail, is brown, and has no legs?", answer: "penny" },
  { question: "What can you break, even if you never pick it up or touch it?", answer: "promise" },
  { question: "What has many teeth but can't bite?", answer: "comb" },
  { question: "What is always in front of you but can't be seen?", answer: "future" },
  { question: "What has a neck but no head?", answer: "bottle" },
  { question: "What can travel around the world while staying in a corner?", answer: "stamp" },
  { question: "What has hands but can't clap?", answer: "clock" }
];

const eightBallResponses = [
  "It is certain.",
  "It is decidedly so.",
  "Without a doubt.",
  "Yes definitely.",
  "You may rely on it.",
  "As I see it, yes.",
  "Most likely.",
  "Outlook good.",
  "Yes.",
  "Signs point to yes.",
  "Reply hazy, try again.",
  "Ask again later.",
  "Better not tell you now.",
  "Cannot predict now.",
  "Concentrate and ask again.",
  "Don't count on it.",
  "My reply is no.",
  "My sources say no.",
  "Outlook not so good.",
  "Very doubtful."
];

// In-memory storage
let funPoints = {};
let activeRiddles = new Map();
let riddleStats = {}; // { userId: { correct: number, total: number } }
let funCooldowns = new Map();

// Utility functions
async function logCommand(user, command, channel, timestamp, result) {
  console.log(`[${timestamp}] ${user.tag} used /${command} in #${channel.name}: ${result}`);
}

// Command definitions
const commands = [
  new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Get a random joke'),
  new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Generate a random meme idea'),
  new SlashCommandBuilder()
    .setName('rps')
    .setDescription('Play rock-paper-scissors')
    .addStringOption(option => option.setName('choice').setDescription('Your choice').setRequired(true)
        .addChoices(
            { name: 'Rock', value: 'rock' },
            { name: 'Paper', value: 'paper' },
            { name: 'Scissors', value: 'scissors' }
        )),
  new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin'),
  new SlashCommandBuilder()
    .setName('dice')
    .setDescription('Roll a die')
    .addIntegerOption(option => option.setName('sides').setDescription('Number of sides (default 6)').setMinValue(2).setMaxValue(100)),
  new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the magic 8-ball a question')
    .addStringOption(option => option.setName('question').setDescription('Your question').setRequired(true)),
  new SlashCommandBuilder()
    .setName('quote')
    .setDescription('Get a random inspirational quote'),
  new SlashCommandBuilder()
    .setName('fact')
    .setDescription('Get a random fun fact'),
  new SlashCommandBuilder()
    .setName('riddle')
    .setDescription('Get a random riddle'),
  new SlashCommandBuilder()
    .setName('answer')
    .setDescription('Answer the active riddle')
    .addStringOption(option => option.setName('answer').setDescription('Your answer').setRequired(true)),
  new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a poll')
    .addStringOption(option => option.setName('question').setDescription('Poll question').setRequired(true))
    .addStringOption(option => option.setName('option1').setDescription('Option 1').setRequired(true))
    .addStringOption(option => option.setName('option2').setDescription('Option 2').setRequired(true))
    .addStringOption(option => option.setName('option3').setDescription('Option 3'))
    .addStringOption(option => option.setName('option4').setDescription('Option 4')),
  new SlashCommandBuilder()
    .setName('funpoints')
    .setDescription('Check your fun points'),
  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View fun points leaderboard'),
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get help with bot commands'),
];

// Register commands
client.once('ready', async () => {
  console.log(`🤖 FunBot is online as ${client.user.tag}!`);
  await client.application.commands.set(commands, GUILD_ID);
  console.log('Commands registered!');
});

// Handle interactions
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, user, channel } = interaction;
  const timestamp = new Date().toISOString();

  let result = 'Command executed successfully';

  try {
    await interaction.deferReply();

    switch (commandName) {
      case 'joke':
        const joke = jokes[Math.floor(Math.random() * jokes.length)];
        await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#ff6b6b').setTitle('😂 Joke').setDescription(joke)] });
        break;
      case 'meme':
        const memeIdeas = [
          "When you realize it's Monday again...",
          "Me trying to adult: 👀",
          "My code when it finally works: 💯",
          "Expectation vs Reality",
          "That moment when you fix a bug by deleting code"
        ];
        const meme = memeIdeas[Math.floor(Math.random() * memeIdeas.length)];
        await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#4ecdc4').setTitle('🖼️ Meme Idea').setDescription(`**${meme}**\n\n*Imagine this with funny images!*`)] });
        break;
      case 'rps':
        const choices = ['rock', 'paper', 'scissors'];
        const userChoice = interaction.options.getString('choice');
        const botChoice = choices[Math.floor(Math.random() * choices.length)];
        let outcome = '';
        if (userChoice === botChoice) {
          outcome = "It's a tie! 🤝";
        } else if (
          (userChoice === 'rock' && botChoice === 'scissors') ||
          (userChoice === 'paper' && botChoice === 'rock') ||
          (userChoice === 'scissors' && botChoice === 'paper')
        ) {
          outcome = "You win! 🎉";
          funPoints[user.id] = (funPoints[user.id] || 0) + 10;
        } else {
          outcome = "I win! 😎";
        }
        await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#45b7d1').setTitle('✂️ Rock Paper Scissors')
          .addFields(
            { name: 'You chose', value: userChoice, inline: true },
            { name: 'I chose', value: botChoice, inline: true },
            { name: 'Result', value: outcome, inline: false }
          )] });
        break;
      case 'coinflip':
        const coinResult = Math.random() < 0.5 ? 'Heads' : 'Tails';
        await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#f9ca24').setTitle('🪙 Coin Flip').setDescription(`The coin landed on: **${coinResult}**!`)] });
        break;
      case 'dice':
        const sides = interaction.options.getInteger('sides') || 6;
        const roll = Math.floor(Math.random() * sides) + 1;
        await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#6c5ce7').setTitle('🎲 Dice Roll').setDescription(`Rolling a ${sides}-sided die...\n\n**You rolled: ${roll}**!`)] });
        break;
      case '8ball':
        const question = interaction.options.getString('question');
        const response = eightBallResponses[Math.floor(Math.random() * eightBallResponses.length)];
        await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#a29bfe').setTitle('🔮 Magic 8-Ball')
          .addFields(
            { name: 'Question', value: question },
            { name: 'Answer', value: response }
          )] });
        break;
      case 'quote':
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#fd79a8').setTitle('💭 Inspirational Quote').setDescription(`"${quote}"`)] });
        break;
      case 'fact':
        const fact = facts[Math.floor(Math.random() * facts.length)];
        await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#00b894').setTitle('🤓 Fun Fact').setDescription(fact)] });
        break;
      case 'riddle':
        if (activeRiddles.has(channel.id)) {
          await interaction.editReply({ content: '❌ There is already an active riddle here!' });
        } else {
          const r = riddles[Math.floor(Math.random() * riddles.length)];
          const timeout = setTimeout(() => {
            activeRiddles.delete(channel.id);
            channel.send({ embeds: [new EmbedBuilder().setColor('#e17055').setTitle('⏰ Time\'s Up!').setDescription(`Nobody got it! The answer was **${r.answer}**`)] });
          }, 30000);
          activeRiddles.set(channel.id, { ...r, timeout });
          await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#fdcb6e').setTitle('🧩 Riddle!')
            .setDescription(r.question).setFooter({ text: 'Answer in chat or use /answer — You have 30 seconds!' })] });
        }
        break;
      case 'answer':
        const riddle = activeRiddles.get(channel.id);
        if (!riddle) {
          await interaction.editReply({ content: '❌ No active riddle! Use /riddle to start one.' });
        } else {
          const userAnswer = interaction.options.getString('answer').toLowerCase().trim();
          if (userAnswer.includes(riddle.answer) || riddle.answer.includes(userAnswer)) {
            clearTimeout(riddle.timeout);
            activeRiddles.delete(channel.id);
            if (!riddleStats[user.id]) riddleStats[user.id] = { correct: 0, total: 0 };
            riddleStats[user.id].correct++;
            riddleStats[user.id].total++;
            funPoints[user.id] = (funPoints[user.id] || 0) + 5;
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#00cec9').setTitle('✅ Correct!')
              .setDescription(`**${user.username}** got it! The answer was **${riddle.answer}** 🏆\n\n+5 Fun Points!`)] });
          } else {
            if (!riddleStats[user.id]) riddleStats[user.id] = { correct: 0, total: 0 };
            riddleStats[user.id].total++;
            await interaction.editReply({ content: '❌ Wrong answer, keep trying!' });
          }
        }
        break;
      case 'poll':
        const pollQuestion = interaction.options.getString('question');
        const options = [];
        for (let i = 1; i <= 4; i++) {
          const opt = interaction.options.getString(`option${i}`);
          if (opt) options.push(opt);
        }
        const pollEmbed = new EmbedBuilder()
          .setTitle('📊 Poll')
          .setDescription(pollQuestion)
          .setColor('#e84393')
          .addFields({ name: 'Options', value: options.map((o, i) => `${i + 1}. ${o}`).join('\n') })
          .setFooter({ text: 'React with the number to vote!' });
        const pollMessage = await interaction.editReply({ embeds: [pollEmbed], fetchReply: true });
        const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];
        for (let i = 0; i < options.length; i++) {
          await pollMessage.react(emojis[i]);
        }
        break;
      case 'funpoints':
        const points = funPoints[user.id] || 0;
        const userRiddleStats = riddleStats[user.id] || { correct: 0, total: 0 };
        await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#fd79a8').setTitle(`🎉 ${user.username}'s Fun Stats`)
          .addFields(
            { name: 'Fun Points', value: `${points}`, inline: true },
            { name: 'Riddles Solved', value: `${userRiddleStats.correct}`, inline: true },
            { name: 'Riddle Attempts', value: `${userRiddleStats.total}`, inline: true }
          )] });
        break;
      case 'leaderboard':
        const sorted = Object.entries(funPoints).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const leaderboard = sorted.map(([id, pts], i) => `${i + 1}. <@${id}> - ${pts} points`).join('\n') || 'No fun points yet!';
        await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#6c5ce7').setTitle('🏆 Fun Points Leaderboard').setDescription(leaderboard)] });
        break;
      case 'help':
        const helpEmbed = new EmbedBuilder()
          .setTitle('🤖 FunBot Commands')
          .setColor('#a29bfe')
          .addFields(
            { name: 'Entertainment', value: '/joke, /meme, /quote, /fact, /8ball', inline: false },
            { name: 'Games', value: '/rps, /coinflip, /dice, /riddle, /answer', inline: false },
            { name: 'Social', value: '/poll, /funpoints, /leaderboard', inline: false },
            { name: 'Info', value: '/help', inline: false }
          )
          .setFooter({ text: 'Have fun! 🎈' });
        await interaction.editReply({ embeds: [helpEmbed] });
        break;
    }
  } catch (error) {
    console.error(error);
    await interaction.editReply({ content: 'An error occurred while processing your command.' });
    result = `Error: ${error.message}`;
  }

  logCommand(user, commandName, channel, timestamp, result);
});

// Riddle answers via messages
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const userId = message.author.id;
  const channelId = message.channel.id;

  // Check for riddle answer
  const riddle = activeRiddles.get(channelId);
  if (riddle) {
    const userAnswer = message.content.toLowerCase().trim();
    if (userAnswer.includes(riddle.answer) || riddle.answer.includes(userAnswer)) {
      clearTimeout(riddle.timeout);
      activeRiddles.delete(channelId);
      if (!riddleStats[userId]) riddleStats[userId] = { correct: 0, total: 0 };
      riddleStats[userId].correct++;
      riddleStats[userId].total++;
      funPoints[userId] = (funPoints[userId] || 0) + 5;
      await message.reply({ embeds: [new EmbedBuilder().setColor('#00cec9').setTitle('✅ Correct!')
        .setDescription(`**${message.author.username}** got it! The answer was **${riddle.answer}** 🏆\n\n+5 Fun Points!`)] });
      return;
    } else {
      // Wrong answer, increment total
      if (!riddleStats[userId]) riddleStats[userId] = { correct: 0, total: 0 };
      riddleStats[userId].total++;
    }
  }

  // Award fun points randomly (small chance)
  if (Math.random() < 0.05) { // 5% chance per message
    funPoints[userId] = (funPoints[userId] || 0) + 1;
  }
});

// Login
client.login(DISCORD_TOKEN);
