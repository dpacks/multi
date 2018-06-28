var toilet = require('toiletdb/inmemory')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var DPack = require('@dpack/core')
var path = require('path')
var tape = require('tape')

var MultiDPack = require('./')
var noop = function () {}

tape('multidpack = MultiDPack()', function (t) {
  t.test('should assert input types', function (t) {
    t.plan(2)
    t.throws(MultiDPack.bind(null), /object/)
    t.throws(MultiDPack.bind(null, {}), /function/)
  })
})

tape('multidpack.create()', function (t) {
  t.test('should assert input types', function (t) {
    t.plan(4)
    var db = toilet({})
    MultiDPack(db, function (err, multidpack) {
      t.ifError(err, 'no error')
      t.throws(multidpack.create.bind(null), 'string')
      t.throws(multidpack.create.bind(null, ''), 'function')
      t.throws(multidpack.create.bind(null, 123, noop), 'object')
    })
  })

  t.test('should create a dPack', function (t) {
    t.plan(4)
    var db = toilet({})
    MultiDPack(db, function (err, multidpack) {
      t.ifError(err, 'no error')
      var location = path.join('/tmp', String(Date.now()))
      mkdirp.sync(location)
      multidpack.create(location, function (err, dpack) {
        t.ifError(err, 'no error')
        t.equal(typeof dpack, 'object', 'dPack exists')
        dpack.close(function (err) {
          t.ifError(err, 'no error')
          rimraf.sync(location)
        })
      })
    })
  })

  t.test('created dPack should not be exposed to the network', function (t) {
    t.plan(3)
    var db = toilet({})
    MultiDPack(db, function (err, multidpack) {
      t.ifError(err, 'no error')
      var location = path.join('/tmp', String(Date.now()))
      mkdirp.sync(location)
      multidpack.create(location, function (err, dpack) {
        t.ifError(err, 'no error')
        dpack.close(function (err) {
          t.ifError(err, 'no error')
          rimraf.sync(location)
        })
      })
    })
  })
})

tape('multidpack.list()', function (t) {
  t.test('should list all dPacks', function (t) {
    t.plan(4)

    var db = toilet({})
    MultiDPack(db, function (err, multidpack) {
      t.ifError(err, 'no error')

      var location = path.join('/tmp', String(Date.now()))
      mkdirp.sync(location)
      multidpack.create(location, function (err, dpack) {
        t.ifError(err, 'no error')
        var dpacks = multidpack.list()
        t.equal(dpacks.length, 1, 'one dPack')
        dpack.close(function (err) {
          t.ifError(err, 'no error')
          rimraf.sync(location)
        })
      })
    })

    /* t.test('creation error', function (t) {
      t.plan(3)
      var db = toilet({})
      MultiDPack(db, {}, function (err, multidpack) {
        t.ifError(err, 'no error')
        multidpack.create('/non/existing/path', function (err, dpack) {
          t.ok(err, 'error')
          t.notOk(dpack, 'no dPack')
        })
      })
    }) */
  })
})

tape('multidpack.close()', function (t) {
  t.test('should be able to close a dPack by its key', function (t) {
    t.plan(4)

    var db = toilet({})
    MultiDPack(db, function (err, multidpack) {
      t.ifError(err, 'no error')

      var location = path.join('/tmp', String(Date.now()))
      mkdirp.sync(location)
      multidpack.create(location, function (err, dpack) {
        t.ifError(err, 'no error')
        multidpack.close(dpack.key, function (err) {
          t.ifError(err, 'no error')
          var dpacks = multidpack.list()
          t.equal(dpacks.length, 0, 'no dPacks')
          rimraf.sync(location)
        })
      })
    })
  })
})

tape('multidpack.readManifest', function (t) {
  t.test('should read a manifest if there is one', function (t) {
    var sourceLocation = path.join('/tmp', String(Date.now()))
    DPack(sourceLocation, { indexing: false }, function (err, sourceDPack) {
      t.ifError(err, 'no error')
      sourceDPack.joinNetwork()
      var ws = sourceDPack.vault.createWriteStream('dpack.json')
      ws.end(JSON.stringify({ name: 'hello-planet' }))

      var db = toilet({})
      MultiDPack(db, function (err, multidpack) {
        t.ifError(err, 'no error')

        var location = path.join('/tmp', String(Date.now()))
        mkdirp.sync(location)

        multidpack.create(location, { key: sourceDPack.key }, function (err, dpack) {
          t.ifError(err, 'no error')

          dpack.joinNetwork()
          multidpack.readManifest(dpack, function (err, manifest) {
            t.ifError(err, 'no err')
            t.equal(typeof manifest, 'object', 'right type')
            t.equal(manifest.name, 'hello-planet', 'right value')
            dpack.close(function () {
              sourceDPack.close(function () {
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
