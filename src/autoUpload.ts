import 'dotenv/config'

import { getChampionDetail, getChampions } from './api'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import pRetry from 'p-retry'


import { ensureFile, writeFile, remove, } from 'fs-extra'
import { readFile } from 'node:fs/promises'

const __data__ = resolve(process.cwd(), '__data__')
const promiseTimeout = (ms: number = 1000) => new Promise((resolve) => setTimeout(resolve, ms))
console.log(__data__)
const putFile = async (key: string, data: unknown) => {
  const filePath = resolve(__data__, key)
  await ensureFile(filePath)
  await writeFile(filePath, JSON.stringify(data, null, 2))
}

async function main() {

  let listFile: string = ''
  try {
    listFile = await readFile(resolve(__data__, 'champion/list.json'), 'utf-8')
    console.log('listFile has')
  } catch (e) {
    console.log(e)
  }
  await remove(__data__)
  const startTime = Date.now()
  const response = await pRetry(getChampions, { retries: 4 })
  const { championRankingList, metaData } = response
  if (listFile) {
    const res = JSON.parse(listFile)
    if (res.metaData.cached_at === metaData.cached_at) {
      console.log('list.json is up to date')
      return
    }
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

  console.log('finish')
  console.log(`all done, cost ${(Date.now() - startTime) / 1000}s`)
}

main()
