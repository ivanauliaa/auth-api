require('dotenv').config();
const { CronJob } = require('cron');
const createServer = require('./Infrastructures/http/createServer');
const container = require('./Infrastructures/container');
const backup = require('./Infrastructures/database/postgres/backup');

const pgBackupJob = new CronJob('* * * * *', backup, null, true);

const start = async () => {
  const server = await createServer(container);
  await server.start();

  console.log(`server start at ${server.info.uri}`);
};

start();
