import Discord from 'discord.js';
import Command from './Command';

// TODO move these out of hardcode...
const argmap = new Map<string, number>();

argmap.set('admin', 1);

const setPermissions = new Command(
  {
    name: 'set-permissions',
    description: 'sets the permission level of a role',
    permLevel: 1,
  },
  async (message, args): Promise<void> => {
    if (args.length != 2) {
      message.channel.send(
        'Use `$set-permissions @[role/user mention] [permission]` to set the permission level of a role or user.',
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
        'Use `$set-role-permissions @[role/user mention] [permission]` to set the permission level of a role or user.',
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

const revokePermissions = new Command(
  {
    name: 'revoke-permissions',
    description: 'Revokes ALL permission levels from a user or role.',
    permLevel: 0,
  },
  async (message, args) => {
    if (args.length != 1) {
      message.channel.send(
        'Use `$revoke-permissions @[role/user mention] [permission]` to remove ALL permissions of a role or user. Use `$set-permissions` to change them.',
      );
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
        'Use `$set-role-permissions @[role/user mention] [permission]` to set the permission level of a role or user.',
      );
      return;
    }

    const group = role ?? user;
    const manager = message.client.permManagers.get(message.guild.id);
    if (group instanceof Discord.Role) {
      await manager.revokeFromRole(group.id);
    }
    if (group instanceof Discord.User) {
      await manager.revokeFromUser(group.id);
    }
    message.channel.send("Okay, I've removed their permissions.");
  },
);

export default [setPermissions, revokePermissions];
