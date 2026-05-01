const UAParser = require('ua-parser-js')
const crypto = require('crypto')

const parseDevice = (req) => {
  const ua = req.headers['user-agent'] || ''
  const parser = new UAParser(ua)
  const result = parser.getResult()

  const browser = result.browser.name ? `${result.browser.name} ${result.browser.version?.split('.')[0] || ''}`.trim() : 'Unknown'
  const os = result.os.name ? `${result.os.name} ${result.os.version || ''}`.trim() : 'Unknown'
  const deviceType = result.device.type || 'desktop'
  const name = `${browser} on ${os}`

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.connection?.remoteAddress
    || req.socket?.remoteAddress
    || 'Unknown'

  // Simple fingerprint from ip + user-agent
  const fingerprint = crypto
    .createHash('sha256')
    .update(`${ip}|${ua}`)
    .digest('hex')
    .slice(0, 16)

  return {
    fingerprint,
    name,
    type: ['desktop', 'mobile', 'tablet'].includes(deviceType) ? deviceType : 'desktop',
    browser,
    os,
    ip,
    location: 'Unknown', // would need IP geolocation API in production
  }
}

module.exports = { parseDevice }
