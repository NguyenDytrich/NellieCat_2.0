import { ServerConfig } from '../../index';
import { Discord } from 'discord.js';
import Command from './Command';

const consultantBios = new Command(
  {
    name: 'create-bios',
    description: 'Create consultant bio embeds in a specified channel',
    permLevel: 1,
  },
  async (message, args): Promise<void> => {
    // if (!args[0]) {
    message.channel.send(
      'Use `$create-bios #[channel mention]` to post the consultant bios as embeds on your server.',
    );
    return;
    // }
  },
);
