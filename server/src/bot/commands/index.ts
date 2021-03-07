import Discord from 'discord.js';
import Rules from './rules';
import Command from './Command';

const prefix = '$';
const commands = new Array<Command>();

commands.push(...Rules);

export default {
  register(client): void {
    // Register Commands
    client.commands = new Discord.Collection();
    client.internalCommands = new Discord.Collection();

    commands.forEach((c) => client.commands.set(c.name, c));

    const commandHandler = (message) => {
      // return if message doesn't start with the prefix, or the author is a bot
      if (!message.content.startsWith(prefix) || message.author.bot) return;

      // Trim and split the rest of the message to create arguments
      const args = message.content.slice(prefix.length).trim().split(/ +/);

      // remove the prefix, then change the command name to all lowercase
      const command = args.shift().toLowerCase();

      // return if there's no command exists
      if (!client.commands.has(command)) return;

      try {
        client.commands.get(command).execute(message, args);
      } catch (error) {
        console.error(error);
      }
    };

    // Register the handler
    client.on('message', commandHandler);
  },
};
