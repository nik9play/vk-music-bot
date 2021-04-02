import VKApi from './VKApi'

export default class GetMany extends VKApi {
  async execute(opts) {
    opts.count = 5

    const res = await this.sendRequest("audio.search", opts)

    if (res.status === "error") {
      return res
    } else if (res.data.response.items.length === 0) {
      return {
        status: "error",
        type: "empty"
      }
    } else {
      return {
        status: "success",
        tracks: res.data.response.items.map((e) => {
          return {
            author: e.artist,
            title: e.title,
            url: e.url,
            duration: e.duration
          }
        })
      }
    }
  }
}