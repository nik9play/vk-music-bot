import play from './play'
import search from './search'

export default {
  name: "captcha",
  djOnly: true,
  cooldown: 5,
  execute: async (message, args) => {
    if (message.client.captcha.has(message.guild.id)) {
      const captcha = message.client.captcha.get(message.guild.id)

      if (captcha.type == 'search') {
        captcha.captcha_key = args[0]

        search.execute(message, captcha.args, {captcha})
      } else {
        captcha.captcha_key = args[0]

        play.execute(message, captcha.args, {captcha})
      }

      message.client.captcha.delete(message.guild.id)
    }
  }
}