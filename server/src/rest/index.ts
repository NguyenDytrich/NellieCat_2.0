import express from 'express';

import { updateRules, getRules } from './rules';
import { BioController } from './bios';

const app = express();

app.get('/ping', (req, res) => {
  return res.send('pong.');
});

app.get('/:serverId/rules', async (req, res) => {
  try {
    const rules = await getRules(req.params.serverId);
    return res.send(JSON.stringify(rules));
  } catch (e) {
    console.error(e);
    return res.sendStatus(500);
  }
});

app.put('/:serverId/rules', async (req, res) => {
  updateRules(req.params.serverId);
  return res.sendStatus(200);
});

export const startRest = (): void => {
  app.listen(3000, () => {
    console.log('REST API listening at http://localhost:3000');
  });
};
