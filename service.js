const subscribe = require('./lib/subscribe')
const webtorrent = require('webtorrent')()
const sos = require('sos')()

// fetch()

webtorrent.on('torrent', torrent => {
  torrent.on('done', () => {
    console.log('downloaded.')
  })
})

const onManifest = (manifest, write) => {
  webtorrent.add(sos.decode(manifest), torrent => {
    console.log(torrent)
    write(manifest)
  })
}

self.addEventListener('install', ev => {
  ev.waitUntil(fetch('/precdn.json').then(resp => {
    console.log('fetch', resp)
    if (resp.status !== 200) throw new Error(`Status no 200, ${resp.status}`)
    async function start () {
      let manifest = await resp.json()
      if (sos.validate(manifest)) {
        let publicKey = manifest.from.data.hex
        subscribe(publicKey, onManifest, (err, writeManifest) => {
          if (err) throw err
          onManifest(manifest, writeManifest)
        })
        return true
      }
      return false // TODO: real error.
    }
    return start()
  }))
})

self.addEventListener('fetch', ev => {
  console.log(ev)
  ev.respondWith(fetch(ev.request))
})