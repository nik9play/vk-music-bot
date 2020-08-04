export default function(cooldownAmount, timeLeft) {
  const emojis = [":clock1:", ":clock2:", ":clock3:", ":clock4:", ":clock1230:", ":clock7:", ":clock8:", ":clock9:", ":clock10:", ":clock11:"]
  const persent = 1 - (timeLeft / cooldownAmount)

  return emojis[Math.round((emojis.length - 1) * persent)]
}