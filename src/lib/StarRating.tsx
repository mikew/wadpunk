import { Star, StarBorder } from '@mui/icons-material'
import type { SvgIconProps } from '@mui/material'
import { Stack, Tooltip, Button } from '@mui/material'
import { useState } from 'react'

import Translate from '#src/i18n/Translate'

const StarRating: React.FC<{
  value: number
  onChange: (value: number) => void
}> = (props) => {
  const [hoverIndex, setHoverIndex] = useState<number>()

  return (
    <Tooltip
      enterDelay={500}
      title={
        props.value === 0 ? null : (
          <>
            <Button
              size="small"
              variant="text"
              fullWidth
              onClick={(event) => {
                event.stopPropagation()
                props.onChange(0)
              }}
            >
              <Translate scope="shared.clear" />
            </Button>
          </>
        )
      }
    >
      <Stack
        direction="row"
        onMouseOut={() => {
          setHoverIndex(undefined)
        }}
        sx={{
          alignItems: 'center',
        }}
      >
        {[1, 2, 3, 4, 5].map((x) => {
          const handleClick: SvgIconProps['onClick'] = (event) => {
            event.stopPropagation()
            props.onChange(x)
          }

          const sharedProps: SvgIconProps = {
            fontSize: 'inherit',
            onClick: handleClick,
            sx: {
              opacity: hoverIndex != null && hoverIndex >= x ? 0.4 : undefined,
            },
            onMouseOver: () => {
              setHoverIndex(x)
            },
            component: 'svg',
          }

          return hoverIndex != null ? (
            hoverIndex >= x ? (
              <Star key={x} {...sharedProps} />
            ) : (
              <StarBorder key={x} {...sharedProps} />
            )
          ) : props.value >= x ? (
            <Star key={x} {...sharedProps} />
          ) : (
            <StarBorder key={x} {...sharedProps} />
          )
        })}
      </Stack>
    </Tooltip>
  )
}

export default StarRating
