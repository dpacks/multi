var dweb = require('@dpack/core')
var multiDDrive = require('@ddrive/multi')
var explain = require('explain-error')
var parse = require('fast-json-parse')
var assert = require('assert')
var extend = require('xtend')

module.exports = multidweb

function multidweb (db, opts, cb) {
  if (!cb) {
    cb = opts
    opts = {}
  }

  assert.equal(typeof db, 'object', 'multidweb: db should be type object')
  assert.equal(typeof cb, 'function', 'multidweb: cb should be type function')

  var dwebFactory = opts.dweb || dweb

  multiDDrive(db, createVault, closeVault, function (err, drive) {
    if (err) return cb(explain(err, 'multidweb: error creating multiDDrive'))
    var multidweb = {
      readManifest: readManifest,
      create: create,
      disconnect: drive.disconnect,
      close: drive.close,
      list: drive.list
    }
    cb(null, multidweb)

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
    dwebFactory(dir, _opts, done)
  }

  function closeVault (dweb, done) {
    dweb.close(done)
  }
}

function readManifest (dweb, cb) {
  dweb.vault.readFile('dweb.json', function (err, buf) {
    if (err) return cb(err)
    var res = parse(buf.toString())
    if (res.err) return cb(explain(res.err, "multidweb.readManifest: couldn't parse dweb.json file"))
    cb(null, res.value)
  })
}
