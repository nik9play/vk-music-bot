import { InfluxDB } from '@influxdata/influxdb-client'
import logger from '../logger.js'
import { ENV } from './env.js'

const influxURL = ENV.INFLUX_URL
const influxToken = ENV.INFLUX_TOKEN
const influxOrg = ENV.INFLUX_ORG
const influxBucket = ENV.INFLUX_BUCKET

export const influxDB =
  influxURL && influxToken ? new InfluxDB({ url: influxURL, token: influxToken }) : undefined
export const Influx = influxDB?.getWriteApi(influxOrg, influxBucket)

let savingAnalyticsTimer: NodeJS.Timer | undefined = undefined
if (!savingAnalyticsTimer && ENV.NODE_ENV === 'production') {
  savingAnalyticsTimer = setInterval(() => {
    // logger.debug(`[Influx - REST] Saving events...`)
    Influx?.flush()
      .then(() => {
        logger.debug(`[Influx - REST] Saved events!`)
      })
      .catch((err) => {
        logger.debug({ err }, `[Influx - REST] Error saving events!`)
      })
  }, 30_000)
}
