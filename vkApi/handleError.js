export default function (data) {
  console.log('ERROR', data)
  if (data.error_code == 14) {
    return {
      status: "error",
      type: "captcha",
      data
    }
  } else {
    return {
      status: "error",
      type: "api-error"
    }
  }
}