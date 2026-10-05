import { renderToStaticMarkup } from 'react-dom/server'

import {
  escapeI18nOptions,
  renderTranslation,
  type TranslateComponents,
} from './translateParser'

function render(message: string, components: TranslateComponents = {}) {
  return renderToStaticMarkup(renderTranslation(message, components))
}

describe('renderTranslation', () => {
  it('passes plain text through', () => {
    expect(render('Hello world')).toBe('Hello world')
  })

  it('renders an empty string', () => {
    expect(render('')).toBe('')
  })

  it('renders a tag using an element template', () => {
    expect(render('Hello <strong>John</strong>!', { strong: <strong /> })).toBe(
      'Hello <strong>John</strong>!',
    )
  })

  it('keeps props on the element template', () => {
    expect(
      render('<em>docs</em>', { em: <em title="Docs" className="x" /> }),
    ).toBe('<em title="Docs" class="x">docs</em>')
  })

  it('renders nested tags', () => {
    expect(
      render('<em><strong>x</strong> y</em>', {
        em: <em title="t" />,
        strong: <strong />,
      }),
    ).toBe('<em title="t"><strong>x</strong> y</em>')
  })

  it('renders the same tag more than once', () => {
    expect(render('<b>a</b> and <b>b</b>', { b: <b /> })).toBe(
      '<b>a</b> and <b>b</b>',
    )
  })

  it('renders the same tag nested in itself', () => {
    expect(render('<b>a<b>b</b>c</b>', { b: <b /> })).toBe('<b>a<b>b</b>c</b>')
  })

  it('renders self-closing tags', () => {
    expect(render('a<br/>b', { br: <br /> })).toBe('a<br/>b')
    expect(render('a<br />b', { br: <br /> })).toBe('a<br/>b')
  })

  it('keeps the children of an element template on a self-closing tag', () => {
    expect(render('a<i/>b', { i: <i>icon</i> })).toBe('a<i>icon</i>b')
  })

  it('replaces the children of an element template', () => {
    expect(render('<i>new</i>', { i: <i>old</i> })).toBe('<i>new</i>')
  })

  it('leaves unknown tags as literal text', () => {
    expect(render('a <u>b</u> c', { b: <b /> })).toBe(
      'a &lt;u&gt;b&lt;/u&gt; c',
    )
  })

  it('still renders known tags around unknown ones', () => {
    expect(render('<b>a <u>b</u></b>', { b: <b /> })).toBe(
      '<b>a &lt;u&gt;b&lt;/u&gt;</b>',
    )
  })

  it('does not match inherited object properties as tags', () => {
    expect(render('<constructor>x</constructor>')).toBe(
      '&lt;constructor&gt;x&lt;/constructor&gt;',
    )
  })

  it('leaves an unclosed tag as literal text', () => {
    expect(render('a <b>b', { b: <b /> })).toBe('a &lt;b&gt;b')
  })

  it('leaves an unopened closing tag as literal text', () => {
    expect(render('a</b> b', { b: <b /> })).toBe('a&lt;/b&gt; b')
  })

  it('treats a tag left open inside another tag as text', () => {
    expect(render('<em><b>x</em>', { em: <em />, b: <b /> })).toBe(
      '<em>&lt;b&gt;x</em>',
    )
  })

  it('leaves stray angle brackets alone', () => {
    expect(render('1 < 2 and 3 > 2', { b: <b /> })).toBe(
      '1 &lt; 2 and 3 &gt; 2',
    )
  })

  it('calls function components with the children', () => {
    const link = vi.fn((children: React.ReactNode) => (
      <a href="/x">{children}</a>
    ))

    expect(
      render('See <link>the <b>docs</b></link>.', { link, b: <b /> }),
    ).toBe('See <a href="/x">the <b>docs</b></a>.')
    expect(link).toHaveBeenCalledTimes(1)
  })

  it('calls function components with undefined when self-closing', () => {
    const icon = vi.fn((children: React.ReactNode) => (
      <span data-has-children={children !== undefined} />
    ))

    expect(render('a<icon/>b', { icon })).toBe(
      'a<span data-has-children="false"></span>b',
    )
  })

  it('allows function components to render plain strings', () => {
    expect(render('<up>shout</up>', { up: () => 'SHOUT' })).toBe('SHOUT')
  })

  it('throws for a component that is neither element nor function', () => {
    expect(() =>
      // @ts-expect-error: deliberately passing something invalid.
      render('<b>x</b>', { b: 'nope' }),
    ).toThrow(TypeError)
  })

  it('never renders markup as HTML', () => {
    expect(render('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    )
    expect(render('&lt;b&gt;', { b: <b /> })).toBe('&amp;lt;b&amp;gt;')
  })
})

describe('escapeOptions', () => {
  it('keeps escaped values from being parsed as tags', () => {
    const name = String(
      escapeI18nOptions({ name: '<strong>Evil</strong>' }).name,
    )

    expect(render(`Hi ${name}`, { strong: <strong /> })).toBe(
      'Hi &lt;strong&gt;Evil&lt;/strong&gt;',
    )
  })

  it('escapes values that could close a tag in the translation', () => {
    const name = String(escapeI18nOptions({ name: '</strong>' }).name)

    expect(render(`<strong>${name}`, { strong: <strong /> })).toBe(
      '&lt;strong&gt;&lt;/strong&gt;',
    )
  })

  it('escapes inside text nested in tags', () => {
    const name = String(escapeI18nOptions({ name: '<b>x</b>' }).name)

    expect(render(`<b>${name}</b>`, { b: <b /> })).toBe(
      '<b>&lt;b&gt;x&lt;/b&gt;</b>',
    )
  })

  it('escapes inside arrays and plain objects', () => {
    const escaped = escapeI18nOptions({
      list: ['<b>', 'ok'],
      user: { name: '<b>', nested: { x: '<i>' } },
    })

    expect(escaped).toStrictEqual({
      list: ['\uE000b>', 'ok'],
      user: { name: '\uE000b>', nested: { x: '\uE000i>' } },
    })
  })

  it('leaves numbers and other non-strings alone', () => {
    const date = new Date(0)
    const escaped = escapeI18nOptions({
      count: 3,
      flag: true,
      nothing: null,
      missing: undefined,
      date,
    })

    expect(escaped).toStrictEqual({
      count: 3,
      flag: true,
      nothing: null,
      missing: undefined,
      date,
    })
    expect(escaped.date).toBe(date)
  })

  it('escapes defaultValue, which is often data', () => {
    expect(
      escapeI18nOptions({ defaultValue: '<b>fallback</b>' }),
    ).toStrictEqual({
      defaultValue: '\uE000b>fallback\uE000/b>',
    })
  })

  it('escapes the message in defaults but not the scope', () => {
    expect(
      escapeI18nOptions({
        defaults: [
          { scope: 'some.<odd>.scope' },
          { scope: ['a', 'b'] },
          { message: '<b>fallback</b>' },
        ],
      }),
    ).toStrictEqual({
      defaults: [
        { scope: 'some.<odd>.scope' },
        { scope: ['a', 'b'] },
        { message: '\uE000b>fallback\uE000/b>' },
      ],
    })
  })

  it('leaves count, scope and missingBehavior alone', () => {
    expect(
      escapeI18nOptions({ count: 2, scope: 'a.<b>', missingBehavior: 'guess' }),
    ).toStrictEqual({ count: 2, scope: 'a.<b>', missingBehavior: 'guess' })
  })

  it('does not modify the original options', () => {
    const original = { name: '<b>', nested: { x: '<i>' } }

    escapeI18nOptions(original)

    expect(original).toStrictEqual({ name: '<b>', nested: { x: '<i>' } })
  })
})
