import generateErrorMessage from '../tools/generateErrorMessage'

export default {
  name: 'mashup',
  djOnly: true,
  cooldown: 1,
  execute: async ({ respond }) => { 
    respond({ embeds: [generateErrorMessage('Скоро...', 'notitle')] })
  }
}