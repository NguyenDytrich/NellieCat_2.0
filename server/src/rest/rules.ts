import { ServerConfig, client } from '../index';
import Discord from 'discord.js';

// Find a server config and update the rules embed if it exists
export async function updateRules(
  id: string,
  newRules?: string,
): Promise<void> {
  try {
    const rules = await ServerConfig.findOne({
      attributes: ['serverId', 'rulesChannelId', 'rulesMsgId', 'rules'],
      where: {
        serverId: id,
      },
    });

    if (newRules) {
      if (rules) {
        rules.rules = newRules;
        rules.save();
      } else {
        throw new Error('No server found by ID');
      }
    }

    // Update the embed if there is already one.
    if (rules.rulesChannelId && rules.rulesMsgId) {
      const rulesEmbed = new Discord.MessageEmbed().setTitle('Rules');
      rulesEmbed.addField('\u200b', rules.rules);
      const channel = await client.channels.fetch(rules.rulesChannelId);
      try {
        const message = await channel.messages.fetch(rules.rulesMsgId);
        message.edit(rulesEmbed);
      } catch (error) {
        throw error;
      }
    }
    // TODO next steps: ping all users that rules have been updated.
    // If reactions to the embed grant roles, revoke said role so
    // that users need to read rules again.
  } catch (error) {
    throw error;
  }
}

export async function getRules(serverId: string): Promise<string> {
  try {
    const rules = await ServerConfig.findOne({
      attributes: ['rules'],
      where: {
        serverId,
      },
    });
    return rules.rules;
  } catch (e) {
    throw e;
  }
}
