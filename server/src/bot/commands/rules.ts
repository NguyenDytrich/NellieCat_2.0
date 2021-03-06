import { ServerConfig } from '../../index';
import Discord from 'discord.js';
import RuleCollectorManager from './../RuleCollectorManager';

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
        where: {
          serverId: message.guild.id,
        },
      });

      // Did someone delete the rules post?
      let msgIsDeleted = true;
      if (config.rulesMsgId) {
        try {
          const msg = await channel.messages.fetch(config.rulesMsgId);
          msgIsDeleted = msg.deleted;
        } catch (error) {
          if (error instanceof Discord.DiscordAPIError) {
            if (error.httpStatus === 404) {
              // Do nothing; we're expecting this.
            }
          } else {
            console.error(error);
          }
        }
      }

      if (config.rulesMsgId && !msgIsDeleted) {
        message.channel.send(
          'The rules have already been posted! Use the command `$rules-update` to update the rules',
        );
      } else {
        const rulesEmbed = new Discord.MessageEmbed().setTitle('Rules');
        if (!config.rules || config.rules === '') {
          // TODO some default rules...
          rulesEmbed.addField('\u200b', 'These are placeholder rules');
        } else {
          rulesEmbed.addField('\u200b', config.rules);
        }
        const rulesMsg = await channel.send(rulesEmbed);

        // Update the config in the database
        config.rulesChannelId = channel.id;
        config.rulesMsgId = rulesMsg.id;
        await config.save();

        // Create the reaction collector for the rules, if needed
        if (config.doRulesGrantRole && config.rulesRoleId && config.rulesReactionId)
          await RuleCollectorManager.createRuleCollector(message.guild, true);
      }
    } catch (error) {
      console.error(error);
      message.channel.send(
        "Sorry, I couldn't find the channel to put the rules in...",
      );
    }
  },
};

const rulesGrantRole = {
  name: 'rules-grant-role',
  description: 'Sets the role granted by reacting to the rules',
  async execute(message, args) {
    if (args.length < 2) {
      message.channel.send(
        'Use `$rules-grant-role @[role mention] [emoji]` to set the role to grant when someone reacts to your rules!',
      );
    }
    const config = await ServerConfig.findByPk(message.guild.id);
    const role = await message.mentions.roles.first();

    if (!role) {
      message.channel.send(
        'Use `$rules-grant-role @[role mention] [emoji]` to set the role to grant when someone reacts to your rules!',
      );
    }

    let emoji: string;

    if (args[1][0] === '<') {
      emoji = 'this is a mention?';
      const bracketless = args[1].substring(2, args[1].length - 1);
      // Split the mention into the emoji name and the emoji id
      const split = bracketless.split(':');
      // Resolve the emoji by its Snowflake
      emoji = await message.guild.emojis.resolve(split[1]).id;
    } else {
      emoji = args[1];
    }

    if (config) {
      config.doRulesGrantRole = true;
      config.rulesRoleId = role.id;
      config.rulesReactionId = emoji;
      await config.save();

      // Create a rule reaction collector if there's a msg id
      if(config.rulesMsgId)
        await RuleCollectorManager.createRuleCollector(message.guild, true);
    } else {
      console.error('No config found in database for server.');
      message.channel.send(
        "Sorry, something happened on the server. I couldn't complete that command",
      );
    }
  },
};

export default [createRules, rulesGrantRole];
