import { ServerConfig } from '../../index';
import Discord from 'discord.js';
import Command from './Command';

// TODO move these out of hardcode...
const argmap = new Map<string, number>();

argmap.set('admin', 1);

const setRolePermission = new Command(
  {
    name: 'set-permissions',
    description: 'sets the permission level of a role',
    permLevel: 1,
  },
  async (message, args): Promise<void> => {
    if (args.length != 2) {
      message.channel.send(
        'Use `$set-permissions @[role/user mention] [permission]` to set the permission level of a role.',
      );
      return;
    }

    const permission = argmap.get(args[1]);
    if (permission == undefined) {
      message.channel.send(`Sorry, the permission \`${args[1]}\` does exist.`);
      return;
    }

    const role = message.mentions.roles.first();
    const user = message.mentions.users.first();
    // XOR
    if ((role && user) || (!role && !user)) {
      console.error('Both types of values obtained?');
      console.log(role);
      console.log(user);
      message.channel.send(
        'Use `$set-role-permissions @[role/user mention] [permission]` to set the permission level of a role.',
      );
      return;
    }

    const group = role ?? user;
    const manager = message.client.permManagers.get(message.guild.id);
    if (group instanceof Discord.Role) {
      await manager.setRolePermissions(group.id, permission);
    }
    if (group instanceof Discord.User) {
      await manager.setUserPermissions(group.id, permission);
    }
    message.channel.send("Okay, I've given them permission.");
  },
);

export default [setRolePermission];
