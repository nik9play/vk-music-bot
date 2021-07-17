import play from './play'
// import search from './search'

import generateErrorMessage from '../tools/generateErrorMessage'

export default {
  name: "captcha",
  djOnly: true,
  cooldown: 5,
  execute: async ({ guild, voice, text, client, args, respond, send }) => {
    if (client.captcha.has(guild.id)) {
      const captcha = client.captcha.get(guild.id)

      if (captcha.type == 'search') {
        captcha.captcha_key = args[0]

        // search.execute({ guild, voice, text, client, args: captcha.args, captcha, respond, send })
      } else {
        captcha.captcha_key = args[0]

        play.execute({ guild, voice, text, client, args: captcha.args, captcha, respond, send })
      }

      client.captcha.delete(guild.id)
    } else {
      respond(generateErrorMessage('В данный момент капчу вводит не надо.', 'info'))
    }
  }
}