import Discord from 'discord.js';
import Rules from './rules';
import Command from './Command';

const prefix = '$';
const commands = new Array<Command>();

const permissionPing = new Command(
  {
    name: 'permission-ping',
    description: 'A ping that requires permission',
    permLevel: 0,
  },
  (message) => {
    message.channel.send('Pong.');
  },
);

commands.push(permissionPing, ...Rules);

export default {
  register(client): void {
    // Create caches
    client.commands = new Discord.Collection();
    client.permManagers = new Discord.Collection();

    // Register Commands
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

      const manager = client.permManagers.get(message.guild.id);

      try {
        const cmd = client.commands.get(command);
        if (manager) {
          if (manager.hasPermissions(message.member, cmd)) {
            cmd.execute(message, args);
          } else {
            message.channel.send(
              "Sorry, you don't have permission to use that command.",
            );
          }
        } else {
          throw new Error('Could not validate command usage.');
        }
      } catch (error) {
        console.error(error);
      }
    };

    // Register the handler
    client.on('message', commandHandler);
  },
};
