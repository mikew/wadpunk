function timeIt(name: string) {
  const time = performance.now()

  function stop() {
    const endTime = performance.now()

    if (process.env.NODE_ENV === 'development') {
      console.info(`${name} took ${endTime - time}ms`)
    }
  }

  return stop
}

export default timeIt
