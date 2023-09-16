function timeIt(name: string) {
  const time = performance.now()

  function stop() {
    const endTime = performance.now()

    console.log(`${name} took ${endTime - time}ms`)
  }

  return stop
}

export default timeIt
