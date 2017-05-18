const sos = require('sos')()
const jsonparser = require('json-stream')
const websocket = require('websocket-stream')

const subscribe = (publicKey, onManifest, cb) => {
  console.log('subscribe')
  const ws = websocket(`ws://localhost:8080/${publicKey}`)

  let parser = jsonparser()
  ws.pipe(parser)
  console.log('connecting to', publicKey)
  parser.on('data', obj => {
    console.log('obj', obj)
    if (sos.validate(obj)) {
      // TODO: verify the publicKey matches
      onManifest(obj)
    }
  })

  let write = obj => ws.write(JSON.stringify(obj) + '\n')
  cb(null, write)
}

module.exports = subscribe
