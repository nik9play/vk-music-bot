export interface VKResponse<T> {
  response: T
}

export interface VKTrack {
  artist: string
  title: string
  id: number
  owner_id: number
  access_key?: string
  duration: number
  url: string
  thumb?: {
    photo_300: string
  }
}

export interface VKPlaylistInfo {
  id: number
  owner_id: number
  access_key?: string
  title: string
  description: string
  count: number
  photo?: {
    photo_300: string
  }
}

export interface VKGroupInfo {
  id: number
  name: string
  screen_name: string
  photo_200?: string
}

export interface VKUserInfo {
  id: number
  first_name: string
  last_name: string
  photo_200?: string
}

export interface VKPlaylistResponse {
  playlist: VKPlaylistInfo
  audios: VKTrack[]
}

export interface VKGroupResponse {
  owner: VKGroupInfo
  audios: { count: number; items: VKTrack[] }
}

export interface VKUserResponse {
  owner: VKUserInfo
  audios: { count: number; items: VKTrack[] }
}

export interface VKError {
  error: {
    error_msg: string
    error_code: number
    captcha_sid?: string
    captcha_url?: string
  }
}

export enum VKErrorCode {
  CAPTCHA = 14,
  ACCESS_DENIED = 15,
  WRONG_PARAMETER = 100,
  WRONG_USER_ID = 113,
  ACCESS_DENIED_ALBUM = 200,
  ACCESS_DENIED_AUDIO = 201
}

export interface VKErrorResponse {
  error?: VKError
  execute_errors?: VKError[]
}

export interface VKSingleErrorResponse extends VKErrorResponse {
  error: VKError
}

export interface VKExecuteErrorsResponse extends VKErrorResponse {
  execute_errors: VKError[]
}

export const isVKErrorResponse = (response: any): response is VKErrorResponse => {
  return (response as VKErrorResponse).error !== undefined || (response as VKErrorResponse).execute_errors?.length !== 0
}

// export const isVKSingleError = (response: VKErrorResponse): response is VKSingleErrorResponse => {
//   return response.error !== undefined || response.error !== null
// }

// export const isVKExecuteErrorsResponse = (response: VKErrorResponse): response is VKExecuteErrorsResponse => {
//   return response.execute_errors?.length !== 0
// }
