import VKApi from './VKApi'

export default class GetOne extends VKApi {
  async execute(opts) {
    if (/^-?[0-9]+_[0-9]+$/g.test(opts.q)) {
      return await this.tryID(opts)
    }

    opts.count = 1

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
        author: res.data.response.items[0].artist,
        title: res.data.response.items[0].title,
        url: res.data.response.items[0].url,
        duration: res.data.response.items[0].duration
      }
    }
  }

  async tryID(opts) {
    const captchaQuery = {}

    if (opts.captcha_sid && opts.captcha_key) {
      captchaQuery.captcha_sid = opts.captcha_sid
      captchaQuery.captcha_key = opts.captcha_key
    }

    opts = {...captchaQuery, audios: opts.q}
    const res = await this.sendRequest("audio.getById", opts)

    if (res.status === "error") {
      return res
    } else {
      return {
        status: "success",
        author: res.data.response[0].artist,
        title: res.data.response[0].title,
        url: res.data.response[0].url,
        duration: res.data.response[0].duration
      }
    }
  }
}