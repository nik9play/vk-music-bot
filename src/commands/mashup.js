import mashupList from '../lists/mashup.json.json'
import play from './play'

export default {
  name: "mashup",
  djOnly: true,
  execute: async (message, _args, options) => { 
    const id = mashupList[Math.floor(Math.random() * mashupList.length)]
    play.execute(message, [id], options)
  }
}