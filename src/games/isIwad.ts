function isIwad(tags: string[]) {
  for (const tag of tags) {
    if (tag.toLowerCase() === 'iwad') {
      return true
    }
  }

  return false
}

export default isIwad
