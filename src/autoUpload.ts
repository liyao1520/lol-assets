import 'dotenv/config'
import { getChampionDetail, getChampions } from './api'
import { resolve } from 'node:path'
import pRetry from 'p-retry'

import { ensureFile, writeFile, remove } from 'fs-extra'
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

  const startTime = Date.now()
  const response = await pRetry(getChampions, { retries: 4 })
  const { championRankingList, metaData } = response as any
  if (listFile) {
    const res = JSON.parse(listFile)
    if (res.metaData.cached_at === metaData.cached_at) {
      console.log('list.json is up to date')
      return
    }
  }
  await remove(__data__)
  await putFile('champion/list.json', response)
  let first = true
  for (const item of championRankingList) {
    const positionName = item.positionName.toLowerCase()
    const { href, key } = item.champion
    const detailHref = href.replace('?', `${positionName}?`)
    console.log(`download ${key}.json`)
    const res = await pRetry(() => getChampionDetail(detailHref), {
      retries: 4
    })
    if(first) {
      const meta = res.meta;
      console.log(`putFile meta.json`)
      await pRetry(() => putFile(`champion/meta.json`, meta), { retries: 2 })
      first = false;
    }
    delete res.meta
    console.log(`download ${key}.json done`)
    await promiseTimeout(1500)
    console.log(`putFile ${key}.json`)
    await pRetry(() => putFile(`champion/${key}-${positionName}.json`, res), { retries: 2 })
    console.log(`putFile ${key}.json done`)
  }

  console.log('finish')
  console.log(`all done, cost ${(Date.now() - startTime) / 1000}s`)
}

main()
