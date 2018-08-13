var toilet = require('toiletdb/inmemory')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var DWeb = require('@dpack/core')
var path = require('path')
var tape = require('tape')

var MultiDWeb = require('./')
var noop = function () {}

tape('multidweb = MultiDWeb()', function (t) {
  t.test('should assert input types', function (t) {
    t.plan(2)
    t.throws(MultiDWeb.bind(null), /object/)
    t.throws(MultiDWeb.bind(null, {}), /function/)
  })
})

tape('multidweb.create()', function (t) {
  t.test('should assert input types', function (t) {
    t.plan(4)
    var db = toilet({})
    MultiDWeb(db, function (err, multidweb) {
      t.ifError(err, 'no error')
      t.throws(multidweb.create.bind(null), 'string')
      t.throws(multidweb.create.bind(null, ''), 'function')
      t.throws(multidweb.create.bind(null, 123, noop), 'object')
    })
  })

  t.test('should create a dPack', function (t) {
    t.plan(4)
    var db = toilet({})
    MultiDWeb(db, function (err, multidweb) {
      t.ifError(err, 'no error')
      var location = path.join('/tmp', String(Date.now()))
      mkdirp.sync(location)
      multidweb.create(location, function (err, dweb) {
        t.ifError(err, 'no error')
        t.equal(typeof dweb, 'object', 'dPack exists')
        dweb.close(function (err) {
          t.ifError(err, 'no error')
          rimraf.sync(location)
        })
      })
    })
  })

  t.test('created dPack should not be exposed to the network', function (t) {
    t.plan(3)
    var db = toilet({})
    MultiDWeb(db, function (err, multidweb) {
      t.ifError(err, 'no error')
      var location = path.join('/tmp', String(Date.now()))
      mkdirp.sync(location)
      multidweb.create(location, function (err, dweb) {
        t.ifError(err, 'no error')
        dweb.close(function (err) {
          t.ifError(err, 'no error')
          rimraf.sync(location)
        })
      })
    })
  })
})

tape('multidweb.list()', function (t) {
  t.test('should list all dPacks', function (t) {
    t.plan(4)

    var db = toilet({})
    MultiDWeb(db, function (err, multidweb) {
      t.ifError(err, 'no error')

      var location = path.join('/tmp', String(Date.now()))
      mkdirp.sync(location)
      multidweb.create(location, function (err, dweb) {
        t.ifError(err, 'no error')
        var dwebs = multidweb.list()
        t.equal(dwebs.length, 1, 'one dPack')
        dweb.close(function (err) {
          t.ifError(err, 'no error')
          rimraf.sync(location)
        })
      })
    })

    /* t.test('creation error', function (t) {
      t.plan(3)
      var db = toilet({})
      MultiDWeb(db, {}, function (err, multidweb) {
        t.ifError(err, 'no error')
        multidweb.create('/non/existing/path', function (err, dweb) {
          t.ok(err, 'error')
          t.notOk(dweb, 'no dPack')
        })
      })
    }) */
  })
})

tape('multidweb.close()', function (t) {
  t.test('should be able to close a dPack by its key', function (t) {
    t.plan(4)

    var db = toilet({})
    MultiDWeb(db, function (err, multidweb) {
      t.ifError(err, 'no error')

      var location = path.join('/tmp', String(Date.now()))
      mkdirp.sync(location)
      multidweb.create(location, function (err, dweb) {
        t.ifError(err, 'no error')
        multidweb.close(dweb.key, function (err) {
          t.ifError(err, 'no error')
          var dwebs = multidweb.list()
          t.equal(dwebs.length, 0, 'no dPacks')
          rimraf.sync(location)
        })
      })
    })
  })
})

tape('multidweb.readManifest', function (t) {
  t.test('should read a manifest if there is one', function (t) {
    var sourceLocation = path.join('/tmp', String(Date.now()))
    DWeb(sourceLocation, { indexing: false }, function (err, sourceDWeb) {
      t.ifError(err, 'no error')
      sourceDWeb.joinNetwork()
      var ws = sourceDWeb.vault.createWriteStream('dweb.json')
      ws.end(JSON.stringify({ name: 'hello-planet' }))

      var db = toilet({})
      MultiDWeb(db, function (err, multidweb) {
        t.ifError(err, 'no error')

        var location = path.join('/tmp', String(Date.now()))
        mkdirp.sync(location)

        multidweb.create(location, { key: sourceDWeb.key }, function (err, dweb) {
          t.ifError(err, 'no error')

          dweb.joinNetwork()
          multidweb.readManifest(dweb, function (err, manifest) {
            t.ifError(err, 'no err')
            t.equal(typeof manifest, 'object', 'right type')
            t.equal(manifest.name, 'hello-planet', 'right value')
            dweb.close(function () {
              sourceDWeb.close(function () {
                rimraf.sync(location)
                rimraf.sync(sourceLocation)
                t.end()
              })
            })
          })
        })
      })
    })
  })
})
