import { Star, StarBorder } from '@mui/icons-material'
import { type SvgIconProps, Stack } from '@mui/material'
import { useState } from 'react'

const StarRating: React.FC<{
  value: number
  onChange: (value: number) => void
}> = (props) => {
  const [hoverIndex, setHoverIndex] = useState<number>()

  return (
    <Stack direction="row" alignItems="center">
      {[1, 2, 3, 4, 5].map((x) => {
        const handleClick = () => {
          props.onChange(x)
        }

        const sharedProps: SvgIconProps = {
          key: x,
          fontSize: 'inherit',
          onClick: handleClick,
          sx: {
            opacity: hoverIndex != null && hoverIndex >= x ? 0.4 : undefined,
          },
          onMouseEnter: () => {
            setHoverIndex(x)
          },
          onMouseLeave: () => {
            setHoverIndex(undefined)
          },
          component: 'svg',
        }

        return hoverIndex != null ? (
          hoverIndex >= x ? (
            <Star {...sharedProps} />
          ) : (
            <StarBorder {...sharedProps} />
          )
        ) : props.value >= x ? (
          <Star {...sharedProps} />
        ) : (
          <StarBorder {...sharedProps} />
        )
      })}
    </Stack>
  )
}

export default StarRating
