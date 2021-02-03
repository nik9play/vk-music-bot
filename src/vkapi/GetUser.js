import VKApi from './VKApi'

export default class GetUser extends VKApi {
  async execute(opts) {
    let code = ""

    if (opts.owner_id.startsWith("-")) {
      code = `var groupInfoAPI = API.groups.getById({
        group_ids: "${opts.owner_id.slice(1)}",
        fields: "description"
      })[0];
      
      var listAPI = API.audio.get({
        owner_id: ${opts.owner_id},
        count: ${opts.count},
        offset: ${opts.offset}
      });
      
      var data = {
        'info': groupInfoAPI,
        'list': listAPI
      };
      return data;`
    } else {
      code = `var userInfoAPI = API.users.get({
        user_ids: "${opts.owner_id}",
        fields: "photo_200"
      })[0];
      
      var listAPI = API.audio.get({
        owner_id: userInfoAPI["id"],
        count: ${opts.count},
        offset: ${opts.offset}
      });
      
      var data = {
        'info': userInfoAPI,
        'list': listAPI
      };
      return data;`
    }

    const captchaQuery = {}

    if (opts.captcha) {
      captchaQuery.captcha_sid = opts.captcha_sid
      captchaQuery.captcha_key = opts.captcha_key
    }

    const res = await super.sendRequest("execute", {...captchaQuery, code })

    if (res.status === "error") {
      return res
    } else {
      let info = res.data.response.info

      if (opts.owner_id.startsWith("-")) {
        info = {
          type: "group",
          name: info.name,
          description: info.description,
          img: info.photo_200
        }
      } else {
        info = {
          type: "user",
          name: `${info.first_name} ${info.last_name}`,
          img: info.photo_200
        }
      }

      const list = res.data.response.list

      if (list.items.length == 0) {
        return {
          status: "error",
          type: "empty"
        }
      }

      const newArray = list.items.map(e => {
        return {
          title: e.title,
          author: e.artist,
          url: e.url,
          duration: e.duration
        }
      })

      return {
        status: "success",
        info,
        newArray
      }
    }
  }
}