/* eslint-disable @typescript-eslint/consistent-type-assertions -- This file is from mui */

import type { Theme } from '@mui/material'
import { alpha } from '@mui/system/colorManipulator'
import { getPath } from '@mui/system/style'

const getTextDecoration = <T extends Theme>({
  theme,
  ownerState,
}: {
  theme: T
  ownerState: { color: string }
}) => {
  const transformedColor = ownerState.color
  // check the `main` color first for a custom palette, then fallback to the color itself
  const color = (getPath(theme, `palette.${transformedColor}.main`, false) ||
    getPath(theme, `palette.${transformedColor}`, false) ||
    ownerState.color) as string
  const channelColor = (getPath(
    theme,
    `palette.${transformedColor}.mainChannel`,
  ) || getPath(theme, `palette.${transformedColor}Channel`)) as string | null
  if ('vars' in theme && channelColor) {
    return `rgba(${channelColor} / 0.4)`
  }
  return alpha(color, 0.4)
}

export default getTextDecoration
