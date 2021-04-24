export default function (url) {
  if (!url.includes("index.m3u8?"))
    return url

	if (url.includes("/audios/")) {
    return url.replace(/^(.+?)\/[^/]+?\/audios\/([^/]+)\/.+$/, "$1/audios/$2.mp3")
  } else {
    return url.replace(/^(.+?)\/(p[0-9]+)\/[^/]+?\/([^/]+)\/.+$/, "$1/$2/$3.mp3")
  }
}