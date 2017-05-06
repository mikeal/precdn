const subscribe = require('./lib/subscribe')
const webtorrent = require('webtorrent')()
const sos = require('../sos')()

// fetch()

const onManifest = manifest => {
  webtorrent.add(sos.decode(manifest), torrent => {
    console.log(torrent)
  })
}

self.addEventListener('install', ev => {
  ev.waitUntil(fetch('/precdn.json').then(resp => {
    console.log('fetch', resp)
    if (resp.status !== 200) throw new Error(`Status no 200, ${resp.status}`)
    async function start () {
      let manifest = await resp.json()
      let publicKey = manifest.from.hex
      subscribe(publicKey, onManifest)
      onManifest(manifest)
      return true
    }
    return start()
  }))
})

self.addEventListener('fetch', ev => {
  console.log(ev)
  ev.respondWith(fetch(ev.request))
})