export default {
  name: "remove",
  aliases: ["r"],
  djOnly: true,
  execute: async function(message, args) {
    const player = message.client.manager.get(message.guild.id)
    if (!player) return message.reply("сейчас ничего не играет.")

    const queue = player.queue

    let removedTracks = []

    args.forEach(a => {
      if (a.includes("-")) {
        const first = parseInt(a.split("-")[0])
        const last = parseInt(a.split("-")[1])
        
        if ((last > first)) removedTracks = [...removedTracks, ...queue.remove(first-1, last)]
      } else {
        a = parseInt(a)
        if (a > 1) removedTracks = [...removedTracks, ...queue.remove(a-1)]
      }
    })

    message.reply(`удалено треков: ${removedTracks.length}.`)
  }
}