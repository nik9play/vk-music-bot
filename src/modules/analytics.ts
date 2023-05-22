import { InfluxDB } from '@influxdata/influxdb-client'
import logger from '../logger.js'

const influxURL = process.env.INFLUX_URL
const influxToken = process.env.INFLUX_TOKEN
const influxOrg = process.env.INFLUX_ORG
const influxBucket = process.env.INFLUX_BUCKET

export const influxDB = influxURL && influxToken ? new InfluxDB({ url: influxURL, token: influxToken }) : undefined
export const Influx = influxDB?.getWriteApi(influxOrg, influxBucket)

let savingAnalyticsId: NodeJS.Timer | undefined = undefined
if (!savingAnalyticsId) {
  savingAnalyticsId = setInterval(() => {
    logger.debug(`[Influx - REST] Saving events...`)
    Influx?.flush()
      .then(() => {
        logger.debug(`[Influx - REST] Saved events!`)
      })
      .catch((err) => {
        logger.debug({ err }, `[Influx - REST] Error saving events!`)
      })
  }, 30_000)
}
