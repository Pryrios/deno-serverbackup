import { moment } from "https://deno.land/x/moment/moment.ts";

interface DatabaseConfig{
  database: string;
  username: string;
  password: string;
}

async function backupDatabase(dbConfig: DatabaseConfig, backupDir: string) {
  console.log("Backup database: " + dbConfig.database);
  const now = moment();
  let filename = backupDir + dbConfig.database + "_dump_" + moment().format('YYYYMMDDHHmm') + ".sql";
  console.log(filename);
  const p = Deno.run({
    args: [
      "mysqldump",
      "-u",
      dbConfig.username,
      "-p" + dbConfig.password,
      dbConfig.database
    ],
    stdout: "piped",
    stderr: "piped"
  });

  const { code } = await p.status();
  if (code === 0) {
    const rawOutput = await p.output();
    const file = await Deno.open(filename, "a+");
    await file.write(rawOutput);
    file.close();
  } else {
    const rawError = await p.stderrOutput();
    const errorString = new TextDecoder().decode(rawError);
    return errorString;
  }

  return dbConfig.database;
}

async function runBackups() {
  const content = await Deno.readFile("config.json");
  const contentStr = new TextDecoder().decode(content);
  const config = JSON.parse(contentStr);

  return Promise.all(config.databases.map(element => backupDatabase(element, config.backupDir)));
}

runBackups().then(data => {
  console.log(data)
});
