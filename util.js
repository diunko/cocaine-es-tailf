
var __assert = require('assert')

function pad0(n, w){
  var _ = '0000000000000000'
  var s = n.toString(10)
  __assert(s.length <= w, 's.length <= w')
  __assert(w < _.length)
  if(s.length < w){
    s = _.slice(0, w-s.length) + s
  }
  return s
}


module.exports.pad0 = pad0
