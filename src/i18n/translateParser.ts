import { cloneElement, createElement, Fragment, isValidElement } from 'react'

/**
 * Either an element used as a template (cloned with the translated children),
 * or a function that receives the translated children and returns a node.
 *
 * For a self-closing tag (`<br/>`) the function receives `undefined`, and an
 * element template keeps its own children.
 */
export type TranslateComponent =
  React.ReactElement | ((children: React.ReactNode) => React.ReactNode)

export type TranslateComponents = Record<string, TranslateComponent>

const ESCAPED_LT = '\uE000'

function escapeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replaceAll('<', ESCAPED_LT)
  }

  // i18n-js calls `toString()` on interpolated values, so arrays and objects
  // need the same treatment.
  if (Array.isArray(value)) {
    return value.map(escapeValue)
  }

  if (value !== null && typeof value === 'object') {
    const proto: unknown = Object.getPrototypeOf(value)

    if (proto === Object.prototype || proto === null) {
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, escapeValue(v)]),
      )
    }
  }

  return value
}

// Keys in `options` that are not interpolated into the translation.
const I18N_T_SKIP_KEYS = new Set([
  // Debatable. TypeScript limits `count` to a number, but there's no guarantee
  // of typescript being used.
  // 'count',
  'scope',
  'missingBehavior',
])

// In a `defaults` entry, `scope` trusted because it points to a controlled
// string, but `message` is untrusted because it could contain user input.
function escapeI18nDefaultsEntry(entry: unknown): unknown {
  if (entry === null || typeof entry !== 'object' || !('message' in entry)) {
    return entry
  }

  return { ...entry, message: escapeValue(entry.message) }
}

/**
 * Escape every string in `options` so markup is rendered as text.
 *
 * The result is meant to be passed to `I18n.t()`, and the output of that to
 * `renderTranslation`, which undoes the escaping.
 */
export function escapeI18nOptions(
  options: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(options).map(([key, value]) => {
      if (I18N_T_SKIP_KEYS.has(key)) {
        return [key, value]
      }

      if (key === 'defaults' && Array.isArray(value)) {
        return [key, value.map(escapeI18nDefaultsEntry)]
      }

      return [key, escapeValue(value)]
    }),
  )
}

function unescapeText(text: string) {
  return text.replaceAll(ESCAPED_LT, '<')
}

// <tag>, </tag> or <tag/>
const TAG_PATTERN = /<(\/)?([A-Za-z][\w.-]*)\s*(\/)?>/g

type Token =
  | { type: 'text'; text: string }
  | { type: 'open'; name: string; raw: string; component: TranslateComponent }
  | { type: 'close'; name: string; raw: string }
  | { type: 'selfClosing'; component: TranslateComponent }

/**
 * Only tags that are in `components` become tag tokens. Anything else that
 * looks like a tag (`<u>`, or a malformed `</b/>`) is just text.
 */
function tokenize(message: string, components: TranslateComponents): Token[] {
  const tokens: Token[] = []
  let textStart = 0

  const pushText = (text: string) => {
    if (text !== '') {
      tokens.push({ type: 'text', text })
    }
  }

  for (const match of message.matchAll(TAG_PATTERN)) {
    const [raw, closingSlash, name, selfClosingSlash] = match

    if (raw === undefined || name === undefined) {
      continue
    }

    // The text between the previous tag and this one.
    pushText(unescapeText(message.slice(textStart, match.index)))
    textStart = match.index + raw.length

    const component = Object.hasOwn(components, name)
      ? components[name]
      : undefined

    if (!component || (closingSlash && selfClosingSlash)) {
      pushText(raw)
    } else if (selfClosingSlash) {
      tokens.push({ type: 'selfClosing', component })
    } else if (closingSlash) {
      tokens.push({ type: 'close', name, raw })
    } else {
      tokens.push({ type: 'open', name, raw, component })
    }
  }

  // The text after the last tag.
  pushText(unescapeText(message.slice(textStart)))

  return tokens
}

function escapeUnmatchedTags(tokens: Token[]): Token[] {
  const result = [...tokens]

  const escapeTokenAt = (index: number) => {
    const token = result[index]

    if (token?.type === 'open' || token?.type === 'close') {
      result[index] = { type: 'text', text: token.raw }
    }
  }

  // Open tags still waiting for their closing tag, innermost last.
  const waiting: { index: number; name: string }[] = []

  for (const [index, token] of tokens.entries()) {
    if (token.type === 'open') {
      waiting.push({ index, name: token.name })
    } else if (token.type === 'close') {
      const matchingPosition = waiting.findLastIndex(
        (open) => open.name === token.name,
      )

      if (matchingPosition === -1) {
        // There's nothing to close.
        escapeTokenAt(index)
      } else {
        // Tags opened after the matching one and still waiting are never
        // going to be closed, because this closing tag ends their parent.
        for (const unclosed of waiting.splice(matchingPosition + 1)) {
          escapeTokenAt(unclosed.index)
        }

        waiting.pop()
      }
    }
  }

  // Never closed by the end of the message.
  for (const open of waiting) {
    escapeTokenAt(open.index)
  }

  return result
}

function renderTranslateComponent(
  component: TranslateComponent,
  key: number,
  children: React.ReactNode[] | undefined,
): React.ReactNode {
  if (typeof component === 'function') {
    return createElement(
      Fragment,
      { key },
      component(
        children === undefined
          ? undefined
          : createElement(Fragment, null, ...children),
      ),
    )
  }

  if (!isValidElement(component)) {
    throw new TypeError(
      'Translate components must be React elements or functions',
    )
  }

  return cloneElement(component, { key }, ...(children ?? []))
}

function renderTokens(tokens: Token[]): React.ReactNode[] {
  let position = 0
  let key = 0

  // Builds nodes until it reaches a closing tag or the end. It leaves the
  // closing tag for the caller, which is the open tag it belongs to.
  const buildUntilClose = (): React.ReactNode[] => {
    const nodes: React.ReactNode[] = []

    while (position < tokens.length) {
      const token = tokens[position]

      if (!token || token.type === 'close') {
        break
      }

      position++

      if (token.type === 'text') {
        nodes.push(token.text)
      } else if (token.type === 'selfClosing') {
        nodes.push(renderTranslateComponent(token.component, key++, undefined))
      } else {
        const tagKey = key++
        const children = buildUntilClose()

        // Skip this tag's closing tag.
        position++

        nodes.push(renderTranslateComponent(token.component, tagKey, children))
      }
    }

    return nodes
  }

  return buildUntilClose()
}

/**
 * Turn a translated string containing tags like `<strong>…</strong>` into
 * React nodes, using `components` to say what each tag renders.
 *
 * Tags that aren't in `components`, and tags without a partner, are kept as
 * literal text. Nothing is ever interpreted as HTML.
 */
export function renderTranslation(
  message: string,
  components: TranslateComponents,
): React.ReactNode {
  const tokens = escapeUnmatchedTags(tokenize(message, components))

  return createElement(Fragment, null, ...renderTokens(tokens))
}
