import { ApolloServer, gql } from 'apollo-server';
import { Sequelize, Model, DataTypes } from 'sequelize';
import Bot from './bot';
import { resolvers } from './graphql/resolvers';
import { startRest } from './rest';

import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DB_CONN_STR);

try {
  sequelize.authenticate().then(() => {
    console.log('DB connection established');
  });
} catch (err) {
  console.error('Unable to connect to DB: ', err);
}

export class ServerConfig extends Model {}
ServerConfig.init(
  {
    serverId: { type: DataTypes.STRING, primaryKey: true },
    rulesChannelId: DataTypes.STRING,
    rulesMsgId: DataTypes.STRING,
    rules: DataTypes.STRING,
    // Does reading and reacting to rules add a role?
    doRulesGrantRole: { type: DataTypes.BOOLEAN, defaultValue: false },
    // Role to grant, if configured to grant roles on
    // reaction to rules
    rulesRoleId: DataTypes.STRING,
    rulesReactionId: DataTypes.STRING,
    // Channel to listen to, if configured to only
    // listen to messages from specific channel
    botChannelId: DataTypes.STRING,
  },
  {
    sequelize,
    modelName: 'server_configs',
    underscored: true,
  },
);

export class ServerState extends Model {}
ServerState.init(
  {
    activeConsultant: DataTypes.STRING,
  },
  {
    sequelize,
    modelName: 'server_states',
    underscored: true,
  },
);

// Configures command groups
export class GroupConfig extends Model {}
GroupConfig.init(
  {
    group: DataTypes.INTEGER,
    snowflake: DataTypes.STRING,
    type: DataTypes.ENUM('role', 'user'),
  },
  {
    sequelize,
    modelName: 'group_configs',
    underscored: true,
  },
);

// Consultant Bios
export class ConsultantBio extends Model {}
ConsultantBio.init(
  {
    userId: DataTypes.STRING,
    bio: DataTypes.STRING,
    imageUrl: DataTypes.STRING,
    isActive: DataTypes.BOOLEAN,
  },
  {
    sequelize,
    modelName: 'consultant_bios',
    underscored: true,
  },
);

ServerConfig.hasOne(ServerState, {
  foreignKey: 'serverId',
});
ServerState.belongsTo(ServerConfig);

ServerConfig.hasMany(GroupConfig, {
  foreignKey: 'serverId',
});
GroupConfig.belongsTo(ServerConfig);
ServerConfig.hasMany(ConsultantBio, {
  foreignKey: 'serverId',
});
ConsultantBio.belongsTo(ServerConfig);

// ServerConfig.sync();
// GroupConfig.sync();
// ServerState.sync();
sequelize.sync();

const typeDefs = gql`
  type ServerConfig {
    serverId: String
    rulesMsgId: String
    rules: String
  }

  type Query {
    serverConfig(serverId: String): ServerConfig
    servers: [ServerConfig]
  }

  type Mutation {
    updateRules(serverId: String, newRules: String): Boolean
  }
`;

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});

startRest();

export const client = Bot.start();
