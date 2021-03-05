import { ApolloServer, gql } from 'apollo-server';
import { Sequelize, Model, DataTypes } from 'sequelize';
import Bot from './Bot';

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
    rulesChannel: DataTypes.STRING,
    rulesMsgId: DataTypes.STRING,
    rules: DataTypes.STRING,
    botChannelId: DataTypes.STRING,
    grantRole: DataTypes.STRING,
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

const resolvers = {
  Query: {
    serverConfig: async (_, params) => {
      return await ServerConfig.findOne({
        where: {
          serverId: params.serverId,
        },
      });
    },
    servers: async () => {
      return ServerConfig.findAll({
        attributes: ['serverId'],
      });
    },
  },

  Mutation: {
    updateRules: async (_, params) => {
      ServerConfig.update(
        { rulesPostText: params.newRules },
        {
          where: {
            serverId: params.serverId,
          },
        },
      );
      return true;
    },
  },
};

const typeDefs = gql`
  type ServerConfig {
    serverId: String
    rulesPostId: String
    rulesPostText: String
  }

  type Query {
    serverConfig(serverId: String): ServerConfig
    servers: [String]
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
  Bot.start();
});
