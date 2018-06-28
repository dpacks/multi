var dpack = require('@dpack/core')
var multiDDrive = require('@ddrive/multi')
var explain = require('explain-error')
var parse = require('fast-json-parse')
var assert = require('assert')
var extend = require('xtend')

module.exports = MultiDPack

function MultiDPack (db, opts, cb) {
  if (!cb) {
    cb = opts
    opts = {}
  }

  assert.equal(typeof db, 'object', 'MultiDPack: db should be type object')
  assert.equal(typeof cb, 'function', 'MultiDPack: cb should be type function')

  var dpackFactory = opts.dpack || dpack

  multiDDrive(db, createVault, closeVault, function (err, drive) {
    if (err) return cb(explain(err, 'MultiDPack: error creating multiDDrive'))
    var multidpack = {
      readManifest: readManifest,
      create: create,
      disconnect: drive.disconnect,
      close: drive.close,
      list: drive.list
    }
    cb(null, multidpack)

    function create (dir, opts, cb) {
      if (!cb) {
        cb = opts
        opts = {}
      }

      assert.equal(typeof dir, 'string', 'multiDDrive.create: dir should be a string')
      assert.equal(typeof opts, 'object', 'multiDDrive.create: opts should be a object')
      assert.equal(typeof cb, 'function', 'multiDDrive.create: cb should be a function')

      var data = {
        dir: dir,
        opts: opts
      }
      drive.create(data, cb)
    }
  })

  function createVault (data, done) {
    var dir = data.dir
    var _opts = extend(opts, data.opts)
    dpackFactory(dir, _opts, done)
  }

  function closeVault (dpack, done) {
    dpack.close(done)
  }
}

function readManifest (dpack, cb) {
  dpack.vault.readFile('dpack.json', function (err, buf) {
    if (err) return cb(err)
    var res = parse(buf.toString())
    if (res.err) return cb(explain(res.err, "multidpack.readManifest: couldn't parse dpack.json file"))
    cb(null, res.value)
  })
}
