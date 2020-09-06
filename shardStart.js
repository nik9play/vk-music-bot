const { ShardingManager } = require('discord.js')
const manager = new ShardingManager('./dist/main.js', { token: process.env.DISCORD_TOKEN })

manager.on('shardCreate', shard => console.log(`Launched shard ${shard.id}`))
manager.spawn()