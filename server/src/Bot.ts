import Discord from 'discord.js';
import { ServerConfig } from './index';

const bot = new Discord.Client();
bot.commands = new Discord.Collection();

const prefix = '$';

const ping = {
  name: 'ping',
  description: 'Ping!',
  execute(message, args) {
    message.channel.send('Pong.');
  },
};

const rules = {
  name: 'rules-create',
  description: 'Creates a rules post',
  execute: async (message, args) => {
    // Strip the pinged channel of <# >
    if (!args[0]) {
      message.channel.send(
        "Use `$rules-create #[channel]` to create a post for the rules of your server! If you haven't configured any rules, default rules will be used instead. Visit the configuration panel to update the rules of your server! (WIP)",
      );
      return;
    }

    try {
      const channel = message.mentions.channels.first();

      // Find the config for our rules
      const config = await ServerConfig.findOne({
        attributes: ['serverId', 'rulesMsgId', 'rules'],
        where: {
          serverId: message.guild.id,
        },
      });

      if (config.rulesMsgId) {
        message.channel.send(
          'The rules have already been posted! Use the command `$rules-update` to update the rules',
        );
      } else {
        const rulesEmbed = new Discord.MessageEmbed().setTitle('Rules');
        if (!config.rules || config.rules === '') {
          rulesEmbed.addField('\u200b', 'These are placeholder rules');
        } else {
          rulesEmbed.addField('\u200b', config.rules);
        }
        const rulesMsg = await channel.send(rulesEmbed);

        // Update the config in the database
        config.rulesChannel = channel.id;
        config.rulesMsgId = rulesMsg.id;
        config.save();
      }
    } catch (error) {
      console.error(error);
      message.channel.send(
        "Sorry, I couldn't find the channel to put the rules in...",
      );
    }
  },
};

bot.commands.set(ping.name, ping);
bot.commands.set(rules.name, rules);

bot.on('message', (message) => {
  // return if message doesn't start with the prefix, or the author is a bot
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);

  // remove the prefix, then change the command name to all lowercase
  const command = args.shift().toLowerCase();

  // return if there's no command exists
  if (!bot.commands.has(command)) return;

  try {
    bot.commands.get(command).execute(message, args);
  } catch (error) {
    console.error(error);
  }
});

const createConfig = async (guild) => {
  const [_, created] = await ServerConfig.findOrCreate({
    where: { serverId: guild.id },
  });
  if (created) {
    console.log(
      `Created config in database for guild ${guild.id} (${guild.name})`,
    );
  }
};

export default {
  start(): void {
    bot.once('ready', () => {
      console.log('Bot ready.');
      bot.guilds.cache.forEach((g) => {
        createConfig(g);
      });
    });
    bot.login(process.env.DISCORD_TOKEN);
  },
};
