export default function escapeFormat(text) {
  const result = text.replace(/(\*|_|`|~|\\)/g, '\\$1')
  return result
}