export default {
  name: "vh",
  description: "Показать справку",
  cooldown: 1,
  execute: async function(message, args) {
    let description = ""

    args.forEach(e => {
      description += `\`-${e.name}\` — ${e.description.charAt(0).toLowerCase() + e.description.slice(1)}\n`
    })
    
    const embed = {
      color: 0x5181b8,
      title: "**Команды:**",
      author: {
        name: "VK Music Bot",
        url: "https://vkmusicbot.megaworld.space/",
        icon_url: "https://vkmusicbot.megaworld.space/favicon-32x32.23c475bc.png"
      },
      description,
      fields: [
        {
          name: 'Группа VK',
          value: 'https://vk.com/vkmusicbotds'
        },
        {
          name: 'Подробное руководство по командам',
          value: 'https://vkmusicbot.megaworld.space/#faq'
        }
      ]
    }
  
    message.channel.send({embed: embed})
  }
}