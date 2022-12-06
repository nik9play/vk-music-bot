import { startShardManager } from './shardManager/manager.js'
import { startApiServer } from './shardManager/api/apiServer.js'
import logger from './logger.js'

startShardManager()
startApiServer()

process.on('unhandledRejection', (e) => logger.error(e, 'Unhandled rejection'))
process.on('uncaughtException', (e, origin) => logger.error({ e, origin }, 'Unhandled exception'))
