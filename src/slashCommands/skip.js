import generateErrorMessage from "../tools/generateErrorMessage";

export default {
  name: "skip",
  aliases: ["n"],
  djOnly: true,
  cooldown: 1,
  execute: async ({ client, guild, voice, respond }) => { 
    const player = client.manager.get(guild.id)
    if (!player) return respond(generateErrorMessage("Сейчас ничего не играет."))

    if (!voice) return respond(generateErrorMessage('Необходимо находиться в голосовом канале.'))

    if (!player.queue.current) return respond(generateErrorMessage("Очередь пуста."))

    const { title, author } = player.queue.current

    player.stop()
    return respond({
      description: `**${author} — ${title}** пропущен.`,
      color: 0x5181b8
    }, 'embed', null, 20000)
  }
}