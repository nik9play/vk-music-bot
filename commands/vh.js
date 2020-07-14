export default {
  name: "vh",
  description: "Показать справку",
  execute: async function(message, args) {
    let description = ""

    args.forEach(e => {
      description += `-\`${e.name}\` — ${e.description.charAt(0).toLowerCase() + e.description.slice(1)}\n`
    })

    const embed = {
      color: 0x5181b8,
      title: "**Команды:**",
      author: {
        name: "VK Music Bot",
        url: "https://vkmusicbot.megaworld.space/",
        icon_url: "https://vkmusicbot.megaworld.space/favicon-32x32.23c475bc.png"
      },
      description
    }
  
    message.channel.send({embed: embed})
  }
}