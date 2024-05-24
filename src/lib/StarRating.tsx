import { Star, StarBorder } from '@mui/icons-material'
import type { SvgIconProps } from '@mui/material'
import { Stack, Tooltip, Button } from '@mui/material'
import { useState } from 'react'

import { useI18nContext } from '#src/i18n/lib/i18nContext'

const StarRating: React.FC<{
  value: number
  onChange: (value: number) => void
}> = (props) => {
  const [hoverIndex, setHoverIndex] = useState<number>()
  const { t } = useI18nContext()

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
              {t('shared.clear')}
            </Button>
          </>
        )
      }
    >
      <Stack
        direction="row"
        alignItems="center"
        onMouseOut={() => {
          setHoverIndex(undefined)
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
