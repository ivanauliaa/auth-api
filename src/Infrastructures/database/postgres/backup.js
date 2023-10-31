const path = require('path');
const { exec } = require('child_process');

const backup = () => {
  const backupFilePath = path.resolve(__dirname, 'backup', `${process.env.PGDUMP_DATABASE}_${+new Date()}.sql`);

  exec(`sh ./backup.sh ${process.env.PGDUMP_HOST} ${process.env.PGDUMP_USER} ${process.env.PGDUMP_PORT} ${process.env.PGDUMP_DATABASE} ${process.env.PGDUMP_PASSWORD} ${backupFilePath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
    }

    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }

    console.log(`Created a backup of ${process.env.PGDUMP_DATABASE} at ${(new Date()).toLocaleString()} successfully: ${stdout}`);
  });
};

module.exports = backup;
