import { startShardManager } from './shardManager/manager.js'
import { startApiServer } from './shardManager/api/apiServer.js'
import logger from './logger.js'

startShardManager()
startApiServer()

//if (process.env['NODE_ENV'] !== 'development') {
process.on('unhandledRejection', (e) => logger.error(e, 'Unhandled rejection'))
process.on('uncaughtException', (e, origin) => logger.error({ e, origin }, 'Unhandled exception'))
//}

// process.on('SIGTERM', () => {
//   console.log(1233)
// })
// process.on('SIGINT', () => {
//   console.log(12343)
// })
