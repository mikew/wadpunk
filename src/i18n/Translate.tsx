import { useI18nContext } from './lib/i18nContext'
import type { I18nContextValue } from './lib/types'
import {
  escapeI18nOptions,
  renderTranslation,
  type TranslateComponents,
} from './translateParser'

type I18nTArgs = Parameters<I18nContextValue['t']>

export interface TranslateProps {
  scope: I18nTArgs[0]
  /**
   * String values are rendered as text. Any `<` in them is never treated as
   * markup, even when it matches a key in `components`.
   */
  options?: I18nTArgs[1]
  /**
   * What to render for each tag in the translation. Either an element, which
   * is cloned with the translated content as its children, or a function that
   * receives the translated content.
   */
  components?: TranslateComponents
}

const noComponents: TranslateComponents = {}

/**
 * Like `t()`, but tags in the translation are replaced with components.
 *
 * ```tsx
 * // "Hello <strong>{{name}}</strong>, welcome!"
 * <Translate
 *   scope="example"
 *   options={{ name: 'John' }}
 *   components={{ strong: <strong /> }}
 * />
 * ```
 */
const Translate: React.FC<TranslateProps> = ({
  scope,
  options,
  components = noComponents,
}) => {
  const { t } = useI18nContext()

  const message = t(scope, escapeI18nOptions({ ...options }))

  // `t()` returns the raw value when the scope points at an object or array
  // instead of a string, and there's nothing sensible to render for that.
  if (typeof message !== 'string') {
    return null
  }

  return renderTranslation(message, components)
}

export default Translate
