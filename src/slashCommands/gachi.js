import gachiList from '../lists/gachi.json'
import play from './play'
import logger from '../tools/logger'

export default {
  name: 'gachi',
  djOnly: true,
  execute: async ({ guild, voice, text, client, respond, send, meta }) => { 
    const id = gachiList[Math.floor(Math.random() * gachiList.length)]
    
    play.execute({ 
      guild,
      voice,
      text,
      client,
      args: [id],
      respond,
      send,
      meta
    }).catch(err => logger.log('error', 'Error executing command: %O', err, meta))
  }
}