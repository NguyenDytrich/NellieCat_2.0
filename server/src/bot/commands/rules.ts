import { ServerConfig } from '../../index';
import Discord from 'discord.js';

const createRules = {
  name: 'create-rules',
  description: 'Creates a rules post',
  execute: async (message, args): Promise<void> => {
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
        config.rulesChannelId = channel.id;
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

export default [createRules];
