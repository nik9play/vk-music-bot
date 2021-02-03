import axios from 'axios'

export default class VKApi {
  async sendRequest(path, opts) {
    let urlParams = new URLSearchParams()
    urlParams.append("v", "5.95")
    urlParams.append("access_token", process.env.VK_TOKEN)

    for (const [key, value] of Object.entries(opts)) {
      urlParams.append(key, value)
    }

    try {
      const res = await axios.get(`https://api.vk.com/method/${path}`, {
        headers: {
          "User-Agent": "KateMobileAndroid/56 lite-460 (Android 4.4.2; SDK 19; x86; unknown Android SDK built for x86; en)"
        },
        params: urlParams
      })

      if (res.data.error) {
        if (res.data.error.error_code == 14) {
          return {
            status: "error",
            type: "captcha",
            data: res.data.error
          }
        }

        return {
          status: "error",
          type: "api"
        }
      } else if (res.data.execute_errors)
        return {
          status: "error",
          type: "api"
        }

      return {
        status: "success",
        data: res.data
      }
    } catch {
      return {
        status: "error",
        type: "request"
      }
    }


  }
}