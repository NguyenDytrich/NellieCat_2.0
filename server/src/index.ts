import { ApolloServer, gql } from 'apollo-server';
import { Sequelize, Model, DataTypes } from 'sequelize';
import Bot from './bot';
import { resolvers } from './graphql/resolvers';

import dotenv from 'dotenv';
const config = dotenv.config();
if (config.error) {
  throw config.error;
}

const conn_url = `postgres://${process.env.PG_USER}:${process.env.PG_PASS}@${process.env.PG_URL}:${process.env.PG_PORT}/${process.env.PG_DB}`;
const sequelize = new Sequelize(conn_url);

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

ServerConfig.sync();
ServerState.sync();

ServerConfig.hasOne(ServerState);
ServerState.belongsTo(ServerConfig);

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

export const client = Bot.start();
