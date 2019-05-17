const requirejs = (() => {
  const modules = window.modules = {}

  document.addEventListener('moduleExported', function() {
    ;[...Object.values(modules)]
      .filter(canDoModuleExports)
      .forEach(doModuleExports)
  })

  function getRandomName() {
    return `anonymous@${parseInt(Math.random() * 1000)}`
  }

  function resolveDependence(pathOrName) {
    for (let key in modules) {
      const module = modules[key]
      if (module.moduleName === pathOrName) {
        return module.modulePath
      }
    }

    const path = pathOrName.endsWith('.js') ? pathOrName : pathOrName + '.js'
    const a = document.createElement('a')
    a.href = path
    return a.href
  }

  function getCurrentScript() {
    try {
      return document.currentScript.src
    } catch(e) {
      return getRandomName()
    }
  }

  function loadModule(src) {
    if (src in modules) {
      return
    }
    const script = document.createElement('script')
    script.src = src

    script.onload = () => {
      modules[src].status = 'Loaded' 
      document.body.removeChild(script)
    }

    const module = {
      status: 'Pending',
      type: 'Sub',
      modulePath: src,
    }

    modules[src] = module
    document.body.appendChild(script)
    module.status = 'Loading'
  }

  function loadExternalModule(dependencies, moduleName, modulePath, moduleFunction) {
    modules[modulePath] = {
      ...modules[modulePath],
      moduleName,
      moduleFunction,
      dependencies: dependencies.map(resolveDependence),
    }

    analyseModule(modules[modulePath])
  }

  function canDoModuleExports(module) {
    if (module.status !== 'Loaded') {
      return false
    }

    if (module.moduleExports !== null && typeof module.moduleExports !== 'undefined') {
      return false
    }

    const dependencies = module.dependencies

    if (typeof dependencies === 'undefined' || dependencies === null) {
      return false
    }

    if (dependencies.length === 0) {
      return true
    }

    for (let i = 0; i < dependencies.length; i++) {
      const dependent = dependencies[i]
      if (dependent in modules && modules[dependent].status === 'Exported') {
        continue
      } else {
        return false
      }
    }

    return true
  }

  function analyseModule(module) {
    if (canDoModuleExports(module)) {
      doModuleExports(module);
    } else {
      module.dependencies.forEach(loadModule)
    }
  }

  function doModuleExports(module) {
    const dependencies = module.dependencies
    let args = null

    if (dependencies.length === 0) {
      args = []
    } else {
      args = dependencies.map(dependent => {
        return modules[dependent].moduleExports
      })
    }

    const moduleExports = module.moduleFunction.apply(null, args)

    if (typeof moduleExports === 'undefined' || moduleExports === null) {
      throw new Error(`Module ${module.moduleName} return (null | undefined), `)
    }

    module.moduleExports = moduleExports
    module.status = 'Exported'
      
    document.dispatchEvent(new Event("moduleExported"))
  }

  return {
    getRandomName,
    canDoModuleExports,
    define(dependencies, moduleName, moduleFunction) {
      const modulePath = getCurrentScript()

      if (modulePath in modules) { // 这个模块是加载外部js得到的
        setTimeout(() => { // 后置，让onload先执行
          loadExternalModule(dependencies, moduleName, modulePath, moduleFunction)
        })
        return
      }

      const module = {
        status: 'Loaded',
        type: 'Main',
        moduleName,
        modulePath,
        moduleFunction,
        moduleExports: null,
        dependencies: dependencies.map(resolveDependence),
      }

      modules[modulePath] = module

      analyseModule(module)
    }
  }
})()

window.define = function(dependencies, moduleName, moduleFunction) {
  if (typeof dependencies === 'function') {
    requirejs.define([], requirejs.getRandomName(), dependencies)
    return
  }
  if (typeof dependencies === 'string') {
    requirejs.define([], dependencies, moduleName)
    return
  }
  if (typeof moduleName === 'function') {
    requirejs.define(dependencies, requirejs.getRandomName(), moduleName)
  }
  if (typeof moduleName === 'string') {
    requirejs.define(dependencies, moduleName, moduleFunction)
  }
}