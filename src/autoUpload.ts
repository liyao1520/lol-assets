import 'dotenv/config'

import { getChampionDetail, getChampions } from './api'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import pRetry from 'p-retry'

import { getObject } from './cos'
import { ensureFile, writeFile, remove, readdir } from 'fs-extra'

const __dirname = dirname(fileURLToPath(new URL(import.meta.url)))
const __data__ = resolve(__dirname, '../__data__')
const promiseTimeout = (ms: number = 1000) => new Promise((resolve) => setTimeout(resolve, ms))

const putFile = async (key: string, data: unknown) => {
  const filePath = resolve(__data__, key)
  await ensureFile(filePath)
  await writeFile(filePath, JSON.stringify(data, null, 2))
}

async function main() {
  await remove(__data__)

  const startTime = Date.now()
  const response = await pRetry(getChampions, { retries: 4 })
  const { championRankingList, metaData } = response
  try {
    // 检测 资源是否 更新
    const obj = await getObject('champion/list.json')
    const res = JSON.parse(obj.Body.toString())
    if (res.metaData.cached_at === metaData.cached_at) {
      console.log('list.json is up to date')
      return
    }
  } catch (e) {
    if (e.statusCode === 404) return
  }

  await putFile('champion/list.json', response)
  for (const item of championRankingList) {
    const { href, key } = item.champion
    console.log(`download ${key}.json`)
    const res = await pRetry(() => getChampionDetail(href), {
      retries: 4
    })

    console.log(`download ${key}.json done`)
    await promiseTimeout(1500)
    console.log(`putFile ${key}.json`)
    await pRetry(() => putFile(`champion/${key}.json`, res), { retries: 2 })
    console.log(`putFile ${key}.json done`)
  }

  // 写入文件
  const files = await readdir(resolve(__data__, 'champion'))
  for (const file of files) {
    const key = file.replace('.json', '')
    const obj = await getObject(`champion/${key}.json`)
    await pRetry(() => putFile(`champion/${key}.json`, obj.Body.toString()), { retries: 2 })
    console.log(`putFile ${key}.json done`)
  }
  console.log('finish')
  console.log(`all done, cost ${(Date.now() - startTime) / 1000}s`)
}

main()
