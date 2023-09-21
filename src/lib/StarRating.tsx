import { Star, StarBorder } from '@mui/icons-material'
import { type SvgIconProps, Stack, Tooltip, Button } from '@mui/material'
import { useState } from 'react'

const StarRating: React.FC<{
  value: number
  onChange: (value: number) => void
}> = (props) => {
  const [hoverIndex, setHoverIndex] = useState<number>()

  return (
    <Tooltip
      enterDelay={500}
      title={
        <>
          <Button
            size="small"
            fullWidth
            onClick={() => {
              props.onChange(0)
            }}
          >
            Clear
          </Button>
        </>
      }
    >
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
    </Tooltip>
  )
}

export default StarRating
