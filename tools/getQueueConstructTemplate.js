export default function getQueueConstructTemplate(message, voiceChannel) {
  return {
    textChannel: message.channel,
    voiceChannel: voiceChannel,
    connection: null,
    songs: [],
    volume: 5,
    playing: true,
  }
}