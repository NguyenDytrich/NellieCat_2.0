import Discord from 'discord.js';
import Command from './commands/Command';
import { GroupConfig } from '../index';

enum PermissionGroup {
  Owner = 0,
  Admin = 1,
  Blacklisted,
}

enum SnowflakeType {
  User = 'user',
  Role = 'role',
}

class PermissionManager {
  // Map of User IDs and their permission level
  private _userMap: Map<string, PermissionGroup>;
  private _roleMap: Map<string, PermissionGroup>;
  public readonly guild: string;

  constructor(guild: Discord.Guild | string) {
    if (guild instanceof Discord.Guild) {
      this.guild = guild.id;
    } else {
      this.guild = guild;
    }

    this._userMap = new Map();
    this._roleMap = new Map();
  }

  // Syncrhonize the permissions manager with the database
  public async sync(): Promise<void> {
    const users = await GroupConfig.findAll({
      where: {
        serverId: this.guild,
        type: SnowflakeType.User,
      },
    });
    const roles = await GroupConfig.findAll({
      where: {
        serverId: this.guild,
        type: SnowflakeType.Role,
      },
    });

    users.forEach((u) => {
      this._userMap.set(u.snowflake, u.group);
    });

    roles.forEach((r) => {
      this._roleMap.set(r.snowflake, r.group);
    });
  }

  public async setUserPermissions(
    userId: string,
    group: PermissionGroup,
  ): Promise<void> {
    this._userMap.set(userId, group);
    const [config, _] = await GroupConfig.findOrCreate({
      where: { serverId: this.guild, snowflake: userId },
    });
    config.group = group;
    config.type = SnowflakeType.User;
    await config.save();
  }

  public async setRolePermissions(
    roleId: string,
    group: PermissionGroup,
  ): Promise<void> {
    this._roleMap.set(roleId, group);
    const [config, _] = await GroupConfig.findOrCreate({
      where: { serverId: this.guild, snowflake: roleId },
    });
    config.group = group;
    config.type = SnowflakeType.Role;
    await config.save();
  }

  public async revokeFromUser(userId: string): Promise<void> {
    if (this._userMap.has(userId)) this._userMap.delete(userId);
    await GroupConfig.destroy({
      where: { serverId: this.guild, snowflake: userId },
    });
  }

  public async revokeFromRole(roleId: string): Promise<void> {
    if (this._roleMap.has(roleId)) this._roleMap.delete(roleId);
    await GroupConfig.destroy({
      where: { serverId: this.guild, snowflake: roleId },
    });
  }

  // TODO
  // This should be in a non-guild specific handler
  //
  // public blacklist(userId: string) {
  //   this._map.set(userId, PermissionGroup.Blacklisted);
  // }

  public hasPermissions(user: Discord.GuildMember, command: Command): boolean {
    if (!command.permLevel) return true;

    const perms = this._userMap.get(user.id);
    if (perms && perms <= command.permLevel) {
      return true;
    }

    this._roleMap.forEach((p, r) => {
      if (user.roles.cache.has(r)) {
        if (p <= command.permLevel) {
          return true;
        }
      }
    });
    return false;
  }
}

export default {
  async createPermissionManager(guild: Discord.Guild): Promise<void> {
    // Map a manager instance to each guild
    const p = new PermissionManager(guild.id);
    p.setUserPermissions(guild.ownerID, PermissionGroup.Owner);
    await p.sync();
    console.log(`Created permissions manager for guild ${guild.name}`);
  },
};
