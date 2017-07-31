const contentfs = require('contentfs')
const inmem = require('lucass/inmemory')
const infs = require('lucass/fs')
const path = require('path')
const rimraf = require('rimraf')
const fs = require('fs')
const ignore = require('ignore-file')
const promisify = require('util').promisify
const mkdirp = promisify(require('mkdirp'))

const dump = async (source, target) => {
  // TODO: create directory of it doesn't exist
  // TODO: remove all content from dir if exists
  let origin = target.replace(process.cwd() + '/', '')
  target = path.resolve(target)
  rimraf.sync(target)
  await mkdirp(target)
  let targetStore = infs(target)
  var _filter = ignore.sync('.npmignore') ||
                ignore.sync('.gitignore') ||
                ignore.compile('node_modules')
  let filter = f => {
    if (path.basename(f)[0] === '.') return false
    if (f.endsWith('precdn.manifest.json')) return false
    if (f.endsWith('_contentfs')) return false
    if (f === origin) return false
    return !_filter(f)
  }
  let store = await contentfs.from(source, inmem(), targetStore, filter)
  await store.push()
  target = target.replace(path.resolve(source), '')
  return {root: store._root, 'get-store': target}
}

const help = `
Usage: precdn [options] [arguments]
       precdn --dump [arguments]

Options:
  -h, --help                 print help menu.
  -s, --source directory     source directory to parse for content.
                             defaults to current working directory.
  -d, --dump [directory]     dump content addressable files into a
                             directory. defaults to _contentfs.
  -o, --output               dump json object to standard out instead of
                             writing a manifest.
`

const pretty = obj => JSON.stringify(obj, null, '\t')

const main = async argv => {
  if (argv.h || argv.help) return console.log(help)
  let source = argv.s || argv.source || process.cwd()
  let json
  if (argv.d || argv.dump) {
    let target = argv.d || argv.dump
    if (typeof target === 'boolean') target = '_contentfs'
    json = await dump(source, target)
  } else {
    throw new Error('Must specify --dump. Other modes available soon.')
  }
  if (argv.o || argv.output) {
    return console.log(pretty(json))
  } else {
    fs.writeFileSync('precdn.manifest.json', pretty(json))
  }
}

if (require.main === module) {
  const argv = require('minimist')(process.argv.slice(2))
  main(argv)
}

module.exports = {dump, main}
