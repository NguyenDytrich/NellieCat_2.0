import Discord from 'discord.js';
import { ServerConfig } from '../index';
import Commands from './commands';

const bot = new Discord.Client();
Commands.register(bot);

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
