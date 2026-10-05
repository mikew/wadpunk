import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'

import buildI18nContextValue from './lib/buildI18nContextValue'
import { i18nContext } from './lib/i18nContext'
import type { I18nTranslations } from './lib/types'
import Translate, { type TranslateProps } from './Translate'

const translations: Record<string, I18nTranslations> = {
  'en-CA': {
    example: 'Hello <strong>{{name}}</strong>, welcome to our site!',
    plain: 'Just text',
    list: 'Items: {{items}}',
    plural: {
      one: '<b>{{count}}</b> file',
      other: '<b>{{count}}</b> files',
    },
    nested: { deep: 'Go <link>here</link>' },
    object: { a: 'b' },
  },
  'fr-CA': {
    example: 'Bonjour <strong>{{name}}</strong>, bienvenue!',
  },
}

function contextFor(locale: string) {
  return buildI18nContextValue(
    locale,
    translations[locale] ?? {},
    async () => {},
  )
}

function render(props: TranslateProps, locale = 'en-CA') {
  return renderToStaticMarkup(
    <i18nContext.Provider value={contextFor(locale)}>
      <Translate {...props} />
    </i18nContext.Provider>,
  )
}

describe('Translate', () => {
  it('renders the example from the docs', () => {
    expect(
      render({
        scope: 'example',
        options: { name: 'John' },
        components: { strong: <strong /> },
      }),
    ).toBe('Hello <strong>John</strong>, welcome to our site!')
  })

  it('renders plain translations', () => {
    expect(render({ scope: 'plain' })).toBe('Just text')
  })

  it('renders without components, leaving tags as text', () => {
    expect(render({ scope: 'example', options: { name: 'John' } })).toBe(
      'Hello &lt;strong&gt;John&lt;/strong&gt;, welcome to our site!',
    )
  })

  it('accepts an array scope', () => {
    expect(
      render({
        scope: ['nested', 'deep'],
        components: { link: (children) => <a href="/x">{children}</a> },
      }),
    ).toBe('Go <a href="/x">here</a>')
  })

  it('pluralizes using count', () => {
    const components = { b: <b /> }

    expect(render({ scope: 'plural', options: { count: 1 }, components })).toBe(
      '<b>1</b> file',
    )
    expect(render({ scope: 'plural', options: { count: 5 }, components })).toBe(
      '<b>5</b> files',
    )
  })

  it('renders markup in a value as text', () => {
    expect(
      render({
        scope: 'example',
        options: { name: '<strong>Evil</strong>' },
        components: { strong: <strong /> },
      }),
    ).toBe(
      'Hello <strong>&lt;strong&gt;Evil&lt;/strong&gt;</strong>, welcome to our site!',
    )
  })

  it('renders markup in an array value as text', () => {
    expect(
      render({
        scope: 'list',
        options: { items: ['<b>a</b>', 'c'] },
        components: { b: <b /> },
      }),
    ).toBe('Items: &lt;b&gt;a&lt;/b&gt;,c')
  })

  it('renders markup in defaultValue as text, and still interpolates it', () => {
    expect(
      render({
        scope: 'nope',
        options: { defaultValue: '<b>{{name}}</b>', name: '<b>x</b>' },
        components: { b: <b /> },
      }),
    ).toBe('&lt;b&gt;&lt;b&gt;x&lt;/b&gt;&lt;/b&gt;')
  })

  it('renders markup in a defaults message as text', () => {
    expect(
      render({
        scope: 'nope',
        options: { defaults: [{ message: '<b>{{name}}</b>' }], name: 'x' },
        components: { b: <b /> },
      }),
    ).toBe('&lt;b&gt;x&lt;/b&gt;')
  })

  it('looks up a defaults scope', () => {
    expect(
      render({
        scope: 'nope',
        options: { defaults: [{ scope: 'plain' }] },
      }),
    ).toBe('Just text')
  })

  it('uses a scope option as a prefix', () => {
    expect(render({ scope: 'deep', options: { scope: 'nested' } })).toBe(
      'Go &lt;link&gt;here&lt;/link&gt;',
    )
  })

  it('renders i18n-js missing translation text', () => {
    expect(render({ scope: 'does.not.exist' })).toBe(
      '[missing &quot;en-CA.does.not.exist&quot; translation]',
    )
  })

  it('renders nothing when the scope is not a string', () => {
    expect(render({ scope: 'object' })).toBe('')
  })

  it('does not modify the options it is given', () => {
    const options = { name: '<b>' }

    render({ scope: 'example', options })

    expect(options).toStrictEqual({ name: '<b>' })
  })

  it('updates when the locale changes', () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    const element = (locale: string) => (
      <i18nContext.Provider value={contextFor(locale)}>
        <Translate
          scope="example"
          options={{ name: 'John' }}
          components={{ strong: <strong /> }}
        />
      </i18nContext.Provider>
    )

    flushSync(() => {
      root.render(element('en-CA'))
    })

    expect(container.innerHTML).toBe(
      'Hello <strong>John</strong>, welcome to our site!',
    )

    flushSync(() => {
      root.render(element('fr-CA'))
    })

    expect(container.innerHTML).toBe(
      'Bonjour <strong>John</strong>, bienvenue!',
    )

    flushSync(() => {
      root.unmount()
    })
  })
})
