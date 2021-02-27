import gachiList from '../lists/gachi.json'
import play from './play'

export default {
  name: "gachi",
  djOnly: true,
  execute: async (message, _args, options) => { 
    const id = gachiList[Math.floor(Math.random() * gachiList.length)]
    play.execute(message, [id], options)
  }
}