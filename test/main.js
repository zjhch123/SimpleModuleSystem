define(['./add', './multiple'], function(add, multiple) {
  console.log('主模块加载完毕')
  
  document.body.innerHTML += `<div>add模块执行结果: add(1, 2) = ${add(1, 2)}</div>`
  document.body.innerHTML += `<div>multiple模块执行结果: multiple(4, 2) = ${multiple(4, 2)}</div>`

  return true
})