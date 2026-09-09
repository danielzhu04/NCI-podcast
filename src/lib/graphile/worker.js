import "dotenv/config";
import { run } from "graphile-worker";
import preset from "../../../graphile.config.js";
import generatePodcast from "../../tasks/generatePodcast.js";

async function main() {
  const runner = await run({
    preset,
    taskList: {
      generate_podcast: generatePodcast,
    },
  });

  await runner.promise;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});