const path = require('path')
const fs = require('fs')
const promisify = require('util').promisify
const test = require('tap').test
const exec = promisify(require('child_process').exec)
const bin = path.normalize('../../bin.js')
const rimraf = require('rimraf')

const cwd = path.join(__dirname, 'site')
const cfs = path.join(cwd, '_contentfs')

test('bin: help', async t => {
  t.plan(1)
  let output = await exec(`node ${bin} --help`, {cwd})
  t.ok(output.stdout.length)
})

test('bin: test dump', async t => {
  t.plan(5)
  rimraf.sync(cfs)
  let output = await exec(`node ${bin} --dump`, {cwd})
  t.same(output.stdout, '')
  t.same(output.stderr, '')
  let files = fs.readdirSync(cfs)
  t.same(files.length, 6)
  let str = fs.readFileSync(path.join(cwd, 'precdn.manifest.json'))
  let manifest = JSON.parse(str)
  t.ok(manifest.root)
  t.same(manifest['get-store'], '/_contentfs')
})

test('bin: test source', async t => {
  t.plan(5)
  rimraf.sync(cfs)
  let output = await exec(`node ${bin} --dump -s .`, {cwd})
  t.same(output.stdout, '')
  t.same(output.stderr, '')
  let files = fs.readdirSync(cfs)
  t.same(files.length, 6)
  let str = fs.readFileSync(path.join(cwd, 'precdn.manifest.json'))
  let manifest = JSON.parse(str)
  t.ok(manifest.root)
  t.same(manifest['get-store'], '/_contentfs')
})

test('bin: test target', async t => {
  t.plan(5)
  rimraf.sync(cfs)
  let output = await exec(`node ${bin} --dump=_contentfs2 -s .`, {cwd})
  t.same(output.stdout, '')
  t.same(output.stderr, '')
  let files = fs.readdirSync(cfs + '2')
  t.same(files.length, 6)
  let str = fs.readFileSync(path.join(cwd, 'precdn.manifest.json'))
  let manifest = JSON.parse(str)
  t.ok(manifest.root)
  t.same(manifest['get-store'], '/_contentfs2')
  rimraf.sync(cfs + '2')
})

test('bin: test output', async t => {
  t.plan(1)
  rimraf.sync(cfs)
  await exec(`node ${bin} --dump`, {cwd})
  let str = fs.readFileSync(path.join(cwd, 'precdn.manifest.json'))
  let manifest1 = JSON.parse(str)

  let output = await exec(`node ${bin} -d -o`, {cwd})
  let manifest2 = JSON.parse(output.stdout)
  t.same(manifest1, manifest2)
  rimraf.sync(cfs)
})

test('bin: no dump', async t => {
  t.plan(1)
  let output = await exec(`node ${bin}`, {cwd})
  t.ok(output.stderr.indexOf('Must specify --dump.') !== -1)
})

test('bin: as module', async t => {
  t.plan(2)
  let b = require('../bin')
  t.ok(b.dump)
  t.type(b.dump, 'function')
})

test('teardown', t => {
  t.plan(1)
  rimraf.sync(cfs)
  rimraf.sync(cfs + '2')
  t.ok(true)
})
