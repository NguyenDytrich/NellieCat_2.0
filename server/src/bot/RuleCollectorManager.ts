import Discord from 'discord.js';
import { ServerConfig } from '../index';

class RuleCollectorManager {
  private _map: Map<string, Discord.ReactionCollector>;

  constructor() {
    this._map = new Map();
  }

  // Checks if there is a collector instance mapped by Guild ID
  public collectorExistsForGuild(guild: string | Discord.Guild): boolean {
    let id;
    if (guild instanceof Discord.Guild) {
      id = guild.id;
    } else {
      id = guild;
    }
    return this._map.has(id);
  }

  // Create a collector for the specified guild, with option to force
  public async createRuleCollector(
    guild: Discord.Guild,
    force = false,
  ): Promise<void> {
    // Return if we have a mapped collector already
    // and we're not forcing
    if (this._map.has(guild.id) && !force) {
      return;
    } else if (force) {
      // Delete the existant collector if we're told to force
      this._map.delete(guild.id);
    }

    const config = await ServerConfig.findOne({
      where: { serverId: guild.id },
    });

    if (!config) {
      console.error(`No config found for guild ${guild.name}`);
      return;
    }

    // Check that we have configuration
    if (
      config.rulesChannelId &&
      config.rulesMsgId &&
      config.doRulesGrantRole &&
      config.rulesRoleId &&
      config.rulesReactionId
    ) {
      try {
        const channel = await guild.channels.resolve(config.rulesChannelId);
        const msg = await channel.messages.fetch(config.rulesMsgId);

        // Check if the unicode character is a Snowflake
        const isSnowflake = /^\d+$/.test(config.rulesReactionId);

        const collector = msg.createReactionCollector((reaction, user) => {
          if (!isSnowflake) {
            return reaction.emoji.name === config.rulesReactionId;
          } else {
            return reaction.emoji.id === config.rulesReactionId;
          }
        });

        collector.on('collect', async (reaction, user) => {
          console.log(`Collected ${reaction.emoji.name} from ${user.tag}`);
          const member = await reaction.message.guild.members.fetch(user.id);
          await member.roles.add(config.rulesRoleId);
        });
        console.log(`Rules reaction collector created for ${guild.name}`);

        this._map.set(guild.id, collector);
      } catch (error) {
        // Don't create anything if we come across an error
        console.error(error);
        return;
      }
    } else {
      console.error('Guild not configured for rules post reaction');
      return;
    }
  }
}

// Create a singleton
const collector = new RuleCollectorManager();
export default collector;
