import gachiList from '../gachi.json'
import vp from './vp'

export default {
  name: "vgachi",
  description: "Включить трек на выбор :male_sign:DUNGEON MASTER:male_sign:",
  execute: async function(message, _args, options) {
    const id = gachiList[Math.floor(Math.random() * gachiList.length)]
    vp.execute(message, [id], options)
    message.reply(`:male_sign:DUNGEON MASTER:male_sign: сделал выбор!`)
  }
}