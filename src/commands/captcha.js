import play from './play'

export default {
  name: "captcha",
  cooldown: 5,
  execute: async (message, args) => {
    if (message.client.captcha.has(message.guild.id)) {
      const captcha = message.client.captcha.get(message.guild.id)

      captcha.captcha_key = args[0]

      play.execute(message, captcha.args, {captcha})

      message.client.captcha.delete(message.guild.id)
    }
  }
}