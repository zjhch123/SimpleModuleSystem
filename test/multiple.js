define(function() {
  console.log('multiple模块加载完毕')
  return function(a, b) {
    return a * b
  }
})