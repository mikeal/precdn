const sos = require('../../sos')
const publish = require('./publish')
const inquirer = require('inquirer')
const sodi = require('sodi')
const fs = require('fs')
const argv = require('yargs').argv

const question =
  { type: 'input',
    name: 'Keypair',
    message: 'No keypair found, create and write a new one?'
  }

const createNewKeyPair = cb => {
  inquirer.prompt([question]).then(function (answers) {
    let answer = answers.Keypair
    if (answer[0] === 'y' || answer[0] === 'Y') {
      let keypair = sodi.generate()
      for (let key in keypair) {
        keypair[key] = keypair[key].toString('hex')
      }
      fs.writeFile('./.keypair.json', JSON.stringify(keypair), (err) => {
        if (err) return cb(err)
        cb(null, keypair)
      })
    } else {
      throw new Error('No keypair')
    }
  })
}

const getKeyPair = cb => {
  fs.readFile(argv.keypair || './.keypair.json', (err, buffer) => {
    if (err) return createNewKeyPair(cb)
    let keypair = JSON.parse(buffer.toString())
    cb(null, keypair)
  })
}

getKeyPair((err, keypair) => {
  if (err) throw err
  //
  publish('./lib', keypair, (err, encoded) => {
    if (err) throw err
    let output = argv.output || argv.o || 'precdn.json'
    fs.writeFile(output, JSON.stringify(encoded), (err) => {
      if (err) throw err
      console.log(`Manifest written: ${output}`)
      if (argv.publish) {
        // TODO: write manifest into syndication network
      }
    })
  })
})
