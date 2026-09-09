import singleton from '../singleton.js'
import { makeWorkerUtils } from 'graphile-worker'
import dotenv from "dotenv";

dotenv.config();

export default singleton('graphile-worker-utils', async () => {
  const workerUtils = await makeWorkerUtils({
    connectionString: process.env.DATABASE_URL,
  })
  process.on('exit', () => {
    workerUtils.release()
  })
  return workerUtils
})
