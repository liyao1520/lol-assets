import COS from 'cos-nodejs-sdk-v5'

const cos = new COS({
  SecretId: process.env.TENCENTCLOUD_SECRET_ID,
  SecretKey: process.env.TENCENTCLOUD_SECRET_KEY
})

console.log(process.env.TENCENTCLOUD_SECRET_ID?.length)
console.log(process.env.TENCENTCLOUD_SECRET_KEY?.length)

const Region = 'ap-beijing'
const Bucket = 'lol-1259483240'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function putObject(key: string, body: any) {
  return cos.putObject({
    Bucket,
    Region,
    Key: key,
    Body: JSON.stringify(body, null, 2)
  })
}

export async function getObject(key: string) {
  return cos.getObject({
    Bucket,
    Region,
    Key: key
  })
}
