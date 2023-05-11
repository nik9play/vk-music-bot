import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'eval',
  adminOnly: true,
  premium: false,
  djOnly: false,
  execute: async function (params) {
    if (params.user.id !== '241175583709593600') return

    let script = params.interaction.options.getString('скрипт', true)
    const isAsync = params.interaction.options.getBoolean('async', false)

    let message = ''

    try {
      if (isAsync) {
        script = `(async () => { ${script} })()`
        message = await eval(script)
      } else message = eval(script)
    } catch (err: any) {
      message = err
    }

    await params.respond({ content: '```js\n' + message + '\n```' })
  }
}
