// Adapted from https://stackblitz.com/edit/node-bi2see

import { Fragment, useEffect, useState } from 'react'

import useLatest from './useLatest'

// const BUFFER = 20;

interface VirtualizedListProps<T> {
  items: T[]
  renderItem: (props: {
    item: T
    index: number
    style: React.CSSProperties
  }) => React.ReactNode
  buffer?: number

  // I wanted itemHeight to just be a string so people could say `3rem`, etc,
  // and use `calc(...)` to figure out the final height. But couldn't get the
  // rest of the math easily without it being a number.
  // I suppose there is a way to go from "css unit string" to "1 unit of that
  // height in pixels"
  itemHeight: number

  scrollElement: HTMLElement | Window
  getViewportHeight?: () => number
  setContainerHeight?: (height: number) => void
}

function VirtualizedList<T>(props: VirtualizedListProps<T>) {
  const buffer = props.buffer ?? 0

  const getViewportHeightRef = useLatest(props.getViewportHeight)
  const setContainerHeightRef = useLatest(props.setContainerHeight)

  const [scrollTop, setScrollTop] = useState(() => {
    if (props.scrollElement === window) {
      return window.scrollY
    }

    if (props.scrollElement instanceof HTMLElement) {
      return props.scrollElement.scrollTop
    }

    return 0
  })

  const [viewportHeight, setViewportHeight] = useState(() => {
    if (getViewportHeightRef.current) {
      return getViewportHeightRef.current()
    }

    if (props.scrollElement === window) {
      return window.innerHeight
    }

    if (props.scrollElement instanceof HTMLElement) {
      return props.scrollElement.scrollHeight
    }

    return 0
  })

  const numberInWindow = Math.floor(viewportHeight / props.itemHeight)
  const start = Math.max(Math.floor(scrollTop / props.itemHeight) - buffer, 0)
  const end = start + numberInWindow + (start === 0 ? buffer : buffer * 2)
  const itemsInWindow = props.items.slice(start, end)

  // Listen for scroll events.
  useEffect(() => {
    function handleScroll() {
      const scrollTop =
        props.scrollElement === window
          ? props.scrollElement.scrollY
          : props.scrollElement instanceof HTMLElement
          ? props.scrollElement.scrollTop
          : undefined

      if (scrollTop != null) {
        setScrollTop(scrollTop)
      }
    }

    props.scrollElement.addEventListener('scroll', handleScroll)

    return () => {
      props.scrollElement.removeEventListener('scroll', handleScroll)
    }
  }, [getViewportHeightRef, props.scrollElement])

  // Update the viewport height when resizes happen.
  useEffect(() => {
    function handleResize() {
      const height = getViewportHeightRef.current
        ? getViewportHeightRef.current()
        : props.scrollElement instanceof HTMLElement
        ? props.scrollElement.scrollHeight
        : props.scrollElement === window
        ? window.innerHeight
        : undefined

      if (height != null) {
        setViewportHeight(height)
      }
    }

    // TODO ResizeObserver would be better here, but since we allow either
    // Window or HTMLElement, it's a little tricky.
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [getViewportHeightRef, props.scrollElement])

  // Set the height of the container based off `props.items`.
  useEffect(() => {
    // TODO Edge seems to cap height at 16_777_100px
    const height = props.itemHeight * props.items.length

    if (setContainerHeightRef.current) {
      setContainerHeightRef.current(height)
    } else if (props.scrollElement instanceof HTMLElement) {
      props.scrollElement.style.height = `${height}px`
    }
  }, [
    props.itemHeight,
    props.items,
    props.scrollElement,
    setContainerHeightRef,
  ])

  return (
    <>
      {itemsInWindow.map((item, index) => {
        return (
          <Fragment
            key={
              // Not sure what else to use, short of having people pass in an
              // object where a property could act as a key.
              // eslint-disable-next-line react/no-array-index-key -- see above
              index + start
            }
          >
            {props.renderItem({
              item,
              index: index + start,
              style: {
                height: props.itemHeight,
                position: 'absolute',
                top: props.itemHeight * (index + start),
              },
            })}
          </Fragment>
        )
      })}
    </>
  )
}

export default VirtualizedList
