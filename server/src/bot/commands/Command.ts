import Discord from 'discord.js';

interface CommandArgs {
  name: string;
  description: string;
  permLevel?: number;
}

export default class Command {
  public readonly name: string;
  public readonly description: string;
  public readonly permLevel: number | undefined;
  public readonly execute: (
    message: Discord.Message,
    args: string[],
  ) => Promise<void> | void;

  public constructor(
    args: CommandArgs,
    execute: (message: Discord.Message, args: string[]) => Promise<void> | void,
  ) {
    this.name = args.name;
    this.description = args.description;
    this.permLevel = args.permLevel;
    this.execute = execute;
  }
}
