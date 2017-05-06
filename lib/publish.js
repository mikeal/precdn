const sos = require('../../sos')
const webtorrent = require('webtorrent')()
const create = require('create-torrent')
const parse = require('parse-torrent')
const recursive = require('recursive-readdir')
const fs = require('fs')

const ingoreFiles = ['.*', 'node_modules/*']

const seed = (dir, name, cb) => {
  recursive(dir, ingoreFiles, (err, files) => {
    if (err) return cb(err)
    let opts = {createdBy: 'precdn', name}
    // Currently disabled recursive walking and ignoring.
    // Can turn back once this is fixed.
    // https://github.com/webtorrent/create-torrent/issues/53
    webtorrent.seed(dir, opts, torrent => {
      cb(null, torrent)
    })
  })
}

const publish = (dir, keypair, cb) => {
  let dt = Date.now()
  let name = `PRECDN: ${keypair.publicKey.toString('hex')} ${dt}`
  seed(dir, name, (err, torrent) => {
    if (err) return cb(err)
    let encoded = sos(keypair).encode(torrent.torrentFile)
    cb(null, encoded)
  })
}

module.exports = publish
