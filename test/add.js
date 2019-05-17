define('add', function() {
  console.log('add模块加载完毕')
  return function(a, b) {
    return a + b
  }
})