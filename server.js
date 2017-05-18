const url = require('url')
const response = require('response')
const jsonparser = require('json-stream')
const EventEmitter = require('events').EventEmitter
const websocket = require('websocket-stream')
const sos = require('sos')()
const redis = require('redis').createClient
const app = require('http').createServer(handler)

const host = process.env.REDIS_HOST
const port = process.env.REDIS_PORT
const pass = process.env.REDIS_PASS
const publisher = redis(port, host, { return_buffers: true, auth_pass: pass })
const subscriber = redis(port, host, { return_buffers: true, auth_pass: pass })

const encode = obj => Buffer.from(JSON.stringify(obj))
const decode = buff => JSON.parse(buff.toString())

const jsonBody = require('body/json')

const channels = new EventEmitter()

function handler (req, res) {
  console.log(req.method)
  if (req.method === 'PUT') {
    jsonBody(req, (err, body) => {
      if (err) return response.error(err).pipe(res)
      if (!sos.validate(body)) return response.error(400).pipe(res)
      let publickey = body.from.data.hex
      publisher.publish(publickey, encode(body))
      response.json(body).pipe(res)
    })
  } else {
    response.error(404).pipe(res)
  }
}

function onWebsocketStream (stream) {
  let publickey = stream.socket.upgradeReq.url.slice('/'.length)
  console.log('publickey', publickey)

  let parser = jsonparser()
  parser.on('data', obj => {
    // TODO: signing validation
    publisher.publish(publickey, encode(obj))
  })
  stream.pipe(parser)

  let write = obj => stream.write(JSON.stringify(obj) + '\n')
  subscriber.subscribe(publickey)
  channels.on(publickey, write)
}

subscriber.on('message', function (channel, message) {
  channel = channel.toString()
  console.log('channel', channel)
  channels.emit(channel, decode(message))
})

websocket.createServer({server: app}, onWebsocketStream)
app.listen(8080, () => console.log('http://localhost:8080'))
