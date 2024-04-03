function pathWithoutExtension(path: string) {
  const lastIndex = path.lastIndexOf('.')

  if (lastIndex === -1) {
    return path
  }

  return path.substring(0, lastIndex)
}

export default pathWithoutExtension
