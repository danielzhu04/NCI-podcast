import { WorkerPreset } from "graphile-worker";

const preset = {
  extends: [WorkerPreset],
  worker: {
    connectionString: process.env.DATABASE_URL,
    concurrentJobs: 4,
    fileExtensions: [".js", ".cjs", ".mjs"],
    taskDirectory: "./src/tasks",
  },
};

export default preset;
