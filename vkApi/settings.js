const vkApiLink = "https://api.vk.com/method/audio."
const connectString = `?access_token=${process.env.VK_TOKEN}&v=5.95`

function getUrlDefaultParams() {
  return new URLSearchParams(connectString)
}
const axiosHeaders = {
  "User-Agent": "KateMobileAndroid/56 lite-460 (Android 4.4.2; SDK 19; x86; unknown Android SDK built for x86; en)"
}

export { vkApiLink, getUrlDefaultParams, axiosHeaders }