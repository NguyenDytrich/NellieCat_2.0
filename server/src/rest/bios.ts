import { ServerConfig, ConsultantBio, client } from '../index';
import Discord from 'discord.js';

interface ConsultantBioArgs {
  serverId: string;
  userId: string;
  bio: string;
  imageUrl: string;
  isActive?: boolean;
}

export class BioController {
  // Adds a consultant bio to the ServerConfig
  async addConsultantBio(params: ConsultantBioArgs): Promise<void> {
    const { serverId, ...bioArgs } = params;
    const consultant = await ConsultantBio.create(
      {
        ...bioArgs,
        ServerConfig: {
          serverId,
        },
      },
      {
        include: ServerConfig,
      },
    );
  }
}
