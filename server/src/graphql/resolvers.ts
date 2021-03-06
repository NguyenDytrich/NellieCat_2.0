import { ServerConfig, client } from '../index';
import Discord from 'discord.js';

export const resolvers = {
  Query: {
    serverConfig: async (_, params) => {
      return await ServerConfig.findOne({
        where: {
          serverId: params.serverId,
        },
      });
    },
    servers: async () => {
      const res = await ServerConfig.findAll({
        attributes: ['serverId'],
      });
      console.log(JSON.stringify(res));
      return res;
    },
  },

  Mutation: {
    updateRules: async (_, params): Promise<boolean> => {
      try {
        const rules = await ServerConfig.findOne({
          attributes: ['serverId', 'rulesChannelId', 'rulesMsgId', 'rules'],
          where: {
            serverId: params.serverId,
          },
        });

        if (rules) {
          rules.rules = params.newRules;
          rules.save();
        } else {
          return false;
        }

        // Update the embed if there is one
        // This should really be a separate function
        if (rules.rulesChannelId && rules.rulesMsgId) {
          const rulesEmbed = new Discord.MessageEmbed().setTitle('Rules');
          rulesEmbed.addField('\u200b', rules.rules);
          const channel = await client.channels.fetch(rules.rulesChannelId);
          console.log(channel);
          try {
            const message = await channel.messages.fetch(rules.rulesMsgId);
            message.edit(rulesEmbed);
          } catch (error) {
            // If there's a rules message that has since been deleted,
            // don't do anything
            console.error(error);
          }
        }
        // TODO Next steps: we should ping all users that rules have been updated
        // If reactions to the embed grant roles, all users with that role should
        // be removed, if configured
      } catch (error) {
        console.error(error);
      }
    },
  },
};
