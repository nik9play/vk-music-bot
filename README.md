<div style="text-align:center"><img src="logo.png" /></div>

Бот для Дискорда, который проигрывает музыку из ВК.

[![Пригласить](https://img.shields.io/badge/%D0%9F%D1%80%D0%B8%D0%B3%D0%BB%D0%B0%D1%81%D0%B8%D1%82%D1%8C-Discord-%237289da?style=flat-square&logo=discord&logoColor=fff)](https://discord.com/oauth2/authorize?client_id=721772274830540833&scope=bot&permissions=8)

## Запуск и использование

```bash
# Скачивание репозитория
git clone https://github.com/nik9play/vk-music-bot.git

# Установка зависимостей
yarn

# Добавление необходимых переменных среды
DISCORD_TOKEN=XXXX
VK_TOKEN=XXXX
SDC_TOKEN=XXXX # токен для статистики на bots.server-discord.com
REDIS_URL=redis://xxx

# Запуск в dev режиме
yarn dev

# Запуск и сборка
yarn build
yarn start
```

### Запуск на Dokku (пример)
```bash
git remote add dokku dokku@dokku:vk-music-bot
git push dokku master
```