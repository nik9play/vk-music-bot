// import mashupList from '../lists/mashup.json'
// import play from './play'

export default {
  name: "mashup",
  djOnly: true,
  execute: async (message) => { 
    // const id = mashupList[Math.floor(Math.random() * mashupList.length)]
    // play.execute(message, [id], options)
    message.reply("команда для включения случайного мэшапа временно недоступна.")
  }
}