import gachiList from '../lists/gachi.json'
import play from './play'
import logger from '../Logger'
import {Command, CommandType} from '../SlashCommandManager'

export default new Command({
  name: 'gachi',
  djOnly: true,
  adminOnly: false,
  premium: false,
  execute: async (params) => {
    const id = gachiList[Math.floor(Math.random() * gachiList.length)]

    const command = play as CommandType

    params.args = [id]

    command.execute(params).catch(err => logger.error({err, ...params.meta}, 'Error executing command'))
  }
})
