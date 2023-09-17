function timeIt(name: string) {
  const time = performance.now()

  function stop() {
    const endTime = performance.now()

    console.info(`${name} took ${endTime - time}ms`)
  }

  return stop
}

export default timeIt
