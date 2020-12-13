import mashupList from '../mashup.json'
import vp from './vp'

export default {
  name: "vmashup",
  description: "включить рандомный мэшап (ВНИМАНИЕ: ВОЗМОЖНЫ МЭШАПЫ С МОРГЕНШТЕРНОМ)",
  cooldown: 4,
  execute: async function(message, _args, options) {
    const id = mashupList[Math.floor(Math.random() * mashupList.length)]
    vp.execute(message, [id], options)
    message.reply(`ну и что ты намэшапил, доволен?`)
  }
}