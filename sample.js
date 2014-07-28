
var http = require('http')
var util = require('util')
var __assert = require('assert')

var debug = require('debug')('es-tailf')

var pad0 = require('./util').pad0

var argv = require('optimist')
  .usage()
  .default({
    'es-port': 9200,
    'source-host': '*',
    'f': ['@timestamp', '@source_host', '@source_path', '@message']
  })
  .describe('f', 'fields to display (see http://kibana.tst.ape.yandex.net for more info)')
  .describe('source-path', '@source_path query')
  .describe('source-host', '@source_host query')
  .demand(['source-path', 'es-host'])
  .argv

var HOST = argv['source-host']
var SOURCE_PATH = argv['source-path']
var FIELDS = argv.f
var INTERVAL = 60

var ES_HOST = argv['es-host']
var ES_PORT = argv['es-port']

var d = new Date()
var ES_INDEX = util.format('logstash-%d.%s.%s', d.getFullYear(), pad0(d.getMonth()+1, 2),  pad0(d.getDate(), 2))


function getQuery(needle, options){
  options = options || {}
  return {
    fields: options.fields || ['@message'],
    query: 
    { filtered: 
      { query: { bool: { should: [ { query_string: { query: '*' } } ] } },
        filter: 
        { bool: 
          { must: 
            [ { range: { '@timestamp': { from: Date.now()-INTERVAL*1000, to: Date.now() } } },
              { fquery: 
                { query: { query_string: { query: '@source_path:('+needle+')' } },
                  _cache: true } },
              { fquery: 
                { query: { query_string: { query: '@source_host:('+options.host+')'} },
                  _cache: true } }] } } } },
    size: 5000,
    sort: [ { '@timestamp': { order: 'asc', ignore_unmapped: true } } ] }
}


function doQuery(){

  var fields = FIELDS

  var query = getQuery(SOURCE_PATH,
                    {fields:fields,
                     host:HOST})

  var queryData = JSON.stringify(query)

  var post_options = {
    host: ES_HOST,
    port: ES_PORT,
    path: util.format('/%s/_search',ES_INDEX),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': queryData.length
    }
  }

  debug('query', util.inspect(query, {depth: null}))
  debug('post_options', util.inspect(post_options))
  
  var postReq = http.request(post_options, function(res) {

    var chunks = []
    
    res.setEncoding('utf8')
    res.on('data', function (chunk) {
      //console.log('================ chunk length',chunk.length)
      chunks.push(chunk)
    })
    
    res.on('end', function(){
      querying = false
      //console.log('done')
      var body = chunks.join('')
      var result = JSON.parse(body)

      debug('result', util.inspect(result, {depth:null}))

      var hits = result.hits.hits

      processResultHits(hits, fields)
      
      scheduleQuery()
    })
  })

  postReq.end(queryData)

  postReq.on('error', function(){
    console.error('request error', arguments)
    querying = false
    process.nextTick(scheduleQuery)
  })
  
}


var entries = {}

function processResultHits(hits, fields){
  var updates = []
  hits.some(function(hit){
    if(!(hit._id in entries)){
      entries[hit._id] = hit
      updates.push(hit)
    }
  })
  if(0 < updates.length){
    //console.log('================ updates')
    updates.some(function(hit){
      //console.log(util.inspect(hit, {depth:null}))

      var entry = fields.map(function(f){
        return hit.fields[f][0]
      }).join(' ')

      
      console.log('-'+(Date.now()-hit.sort[0])+'ms\t', entry)

      //console.log(hit._id, hit.sort[0], '(emitted '+(Date.now()-hit.sort[0])+'ms earlier)', entry)

    })
  }
}

var querying = false
var queryTimeout = 100

function scheduleQuery(){
  if(!querying){
    setTimeout(doQuery, queryTimeout)
  }
}

doQuery()


