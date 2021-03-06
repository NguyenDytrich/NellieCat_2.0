import Discord from 'discord.js';
import { ServerConfig } from '../index';
import Commands from './commands';
import RuleCollectorManager from './RuleCollectorManager';

const bot = new Discord.Client();

Commands.register(bot);

// Create configurations for guilds if they don't yet exist
const createConfig = async (guild) => {
  const [config, created] = await ServerConfig.findOrCreate({
    where: { serverId: guild.id },
  });
  if (created) {
    console.log(
      `Created config in database for guild ${guild.id} (${guild.name})`,
    );
  }
  return config;
};

export default {
  start(): Discord.Client {
    bot.once('ready', () => {
      console.log('Bot ready.');
      bot.guilds.cache.forEach(async (g) => {
        const config = await createConfig(g);

        // Create a rule collector for each guild that's
        // configured to grant roles on reaction to rules
        if (config.doRulesGrantRole && config.rulesRoleId)
          await RuleCollectorManager.createRuleCollector(g);
      });
    });
    bot.login(process.env.DISCORD_TOKEN);
    return bot;
  },
};
