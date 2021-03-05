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

        // This should really be a separate function
        if (rules.rulesChannelId && rules.rulesMsgId) {
          const rulesEmbed = new Discord.MessageEmbed().setTitle('Rules');
          rulesEmbed.addField('\u200b', rules.rules);
          const channel = await client.channels.fetch(rules.rulesChannelId);
          const message = await channel.messages.fetch(rules.rulesMsgId);
          console.log(channel);
          message.edit(rulesEmbed);
        }
      } catch (error) {
        console.error(error);
      }
    },
  },
};
