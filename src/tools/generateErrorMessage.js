export default function(message, type='error') {
  let title
  let color
  
  switch (type) {
    case 'error':
      title = '<:no2:835498572916195368> **Ошибка!**'
      color = 0xED4245
      break
    case 'warning':
      title = '⚠️ **Предупреждение**'
      color = 0xFEE75C
      break
    case 'info':
      title = 'ℹ️ **Информация**'
      color = 0x3b88c3
  }
  
  const embed = {
    // title: `<:no2:835498572916195368> ${title}`,
    description: `${title}\n${message}`,
    color
  }

  return embed
}
