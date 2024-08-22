import * as cheerio from 'cheerio'

export async function getChampions() {
  const html = await fetch('https://www.op.gg/champions?position=all', {
    headers: {
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6'
    }
  }).then((res) => res.text())
  const $ = cheerio.load(html)
  const __NEXT_DATA__ = $('#__NEXT_DATA__').text()
  if (!__NEXT_DATA__) return Promise.reject(new Error('not found __NEXT_DATA__'))
  const data = JSON.parse(__NEXT_DATA__)
  const { championRankingList, metaData } = data.props.pageProps
  return { championRankingList, metaData }
}

//__NEXT_DATA__.props.pageProps.data.summary.opponents

export async function getChampionDetail(path: string) {
  const pageUrl = `https://op.gg/${path}`
  const html = await fetch(pageUrl, {
    headers: {
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6'
    }
  }).then((res) => res.text())
  const $ = cheerio.load(html)
  const __NEXT_DATA__ = $('#__NEXT_DATA__').text()
  if (!__NEXT_DATA__) {
    console.log(html)
    return Promise.reject(new Error('not found __NEXT_DATA__'))
  }
  const data = JSON.parse(__NEXT_DATA__)
  return data.props.pageProps.data
}
