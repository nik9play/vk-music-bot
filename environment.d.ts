declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DISCORD_TOKEN: string
      NODE_ENV: 'development' | 'production'
      MONGO_URL: string
      REDIS_URL: string
      CAPTCHA_SOLVER_URL: string
      DISCORD_PROXY_URL: string
      API_TOKEN: string
      DATMUSIC_URL: string
      STATS_KEY: string
      SDC_TOKEN: string
      BOTICORD_TOKEN: string
      PORT?: string
      VK_TOTAL_SHARDS: string
      SHARDS_PER_CLUSTER: string
      CLIENT_ID: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
