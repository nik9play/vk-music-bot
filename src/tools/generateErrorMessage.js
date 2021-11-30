import escapeFormat from './escapeFormat'

export default function(message, type='error', escapeFormatting=false) {
  let title
  let color
  
  switch (type) {
    case 'error':
      title = '<:no2:835498572916195368> **Ошибка!**\n'
      color = 0xED4245
      break
    case 'warning':
      title = '⚠️ **Предупреждение**\n'
      color = 0xFEE75C
      break
    case 'info':
      title = 'ℹ️ **Информация**\n'
      color = 0x3b88c3
      break
    case 'notitle':
      title = ''
      color = 0x5181b8
  }
  
  if (escapeFormatting) {
    message = escapeFormat(message)
  }

  const embed = {
    // title: `<:no2:835498572916195368> ${title}`,
    description: `${title}\n${message}`,
    color
  }

  return embed
}
