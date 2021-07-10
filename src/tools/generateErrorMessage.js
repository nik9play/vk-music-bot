export default function(message, type='error') {
  let title

  switch (type) {
    case 'error':
      title = '<:no2:835498572916195368> **Ошибка!**'
      break
    case 'warning':
      title = '⚠️ **Предупреждение**'
      break
    case 'info':
      title = 'ℹ️ **Информация**'
  }
  
  const embed = {
    // title: `<:no2:835498572916195368> ${title}`,
    description: `${title}\n${message}`,
    color: 0xED4245
  }

  return embed
}
