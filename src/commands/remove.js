export default {
  name: "remove",
  aliases: ["r"],
  djOnly: true,
  execute: async function(message, args) {
    const player = message.client.manager.get(message.guild.id)
    if (!player) return message.reply("сейчас ничего не играет.")

    const queue = player.queue

    let tracksRemoved = 0

    args.forEach(a => {
      if (a.includes("-")) {
        const first = parseInt(a.split("-")[0])
        const last = parseInt(a.split("-")[1])
        
        if ((last > first)) tracksRemoved += queue.remove(first, last)
      } else {
        a = parseInt(a)
        if (a > 1) tracksRemoved += queue.remove(a)
      }
    })

    message.reply(`удалено треков: ${tracksRemoved}.`)
  }
}