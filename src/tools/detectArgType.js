import parsePlaylistURL from './parsePlaylistURL'

export default function(arg) {
  if (arg.startsWith(">-")) {
    return {
      type: "group",
      id: arg.slice(1)
    }
  } else if (arg.startsWith(">")) {
    return {
      type: "user",
      id: arg.slice(1)
    }
  } else {
    try {
      const url = new URL(arg)

      if (!url.searchParams.has("z")) {
        if (url.pathname.startsWith("/audios-") && !url.searchParams.has("z"))
        return {
          type: "group",
          id: url.pathname.slice(7)
        }

      if (url.pathname.startsWith("/audios") && !url.searchParams.has("z"))
        return {
          type: "user",
          id: url.pathname.slice(7)
        }
      }

      if (url.searchParams.has("w")) {
        return {
          type: "wall",
          id: url.get("w").slice(4)
        }
      }

      const parsedURL = parsePlaylistURL(url)

      return {
        type: "playlist",
        parsedURL
      }
    } catch {
      return {
        type: "track"
      }
    }
  }
}