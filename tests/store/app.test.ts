import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '@/store/app'

const reset = () => {
  useAppStore.setState({ favorites: [], history: {}, recentTools: [] })
  localStorage.clear()
}

describe('应用状态', () => {
  beforeEach(reset)

  it('收藏可添加与移除', () => {
    const store = useAppStore.getState()
    store.toggleFavorite('json-formatter')
    expect(useAppStore.getState().favorites).toEqual(['json-formatter'])
    expect(useAppStore.getState().isFavorited('json-formatter')).toBe(true)
    useAppStore.getState().toggleFavorite('json-formatter')
    expect(useAppStore.getState().favorites).toEqual([])
  })

  it('最近使用去重并保持在最前', () => {
    const { addRecentTool } = useAppStore.getState()
    addRecentTool('a')
    addRecentTool('b')
    addRecentTool('a')
    expect(useAppStore.getState().recentTools).toEqual(['a', 'b'])
  })

  it('最近使用上限 20', () => {
    const { addRecentTool } = useAppStore.getState()
    for (let i = 0; i < 25; i++) addRecentTool(`tool-${i}`)
    const recent = useAppStore.getState().recentTools
    expect(recent).toHaveLength(20)
    expect(recent[0]).toBe('tool-24')
  })

  it('历史记录去重、前置并限制 10 条', () => {
    const { addHistory } = useAppStore.getState()
    for (let i = 0; i < 15; i++) addHistory('json-formatter', `input-${i}`)
    const history = useAppStore.getState().getHistory('json-formatter')
    expect(history).toHaveLength(10)
    expect(history[0].input).toBe('input-14')
    addHistory('json-formatter', 'input-14')
    expect(useAppStore.getState().getHistory('json-formatter')[0]).toEqual(
      expect.objectContaining({ input: 'input-14' }),
    )
    expect(useAppStore.getState().getHistory('json-formatter')).toHaveLength(10)
  })

  it('未开启历史记录的工具不写入', () => {
    useAppStore.getState().addHistory('password-gen', 'secret')
    useAppStore.getState().addHistory('aes-encrypt', 'secret')
    expect(useAppStore.getState().getHistory('password-gen')).toEqual([])
    expect(useAppStore.getState().getHistory('aes-encrypt')).toEqual([])
  })

  it('可删除单条与清空历史', () => {
    const { addHistory } = useAppStore.getState()
    addHistory('json-formatter', 'one')
    addHistory('json-formatter', 'two')
    const first = useAppStore.getState().getHistory('json-formatter')[1]
    useAppStore.getState().removeHistory('json-formatter', first.timestamp)
    expect(useAppStore.getState().getHistory('json-formatter')).toHaveLength(1)
    useAppStore.getState().clearHistory()
    expect(useAppStore.getState().history).toEqual({})
  })

  it('空白输入不写入历史', () => {
    useAppStore.getState().addHistory('json-formatter', '   ')
    expect(useAppStore.getState().getHistory('json-formatter')).toEqual([])
  })

  it('不同工具历史互不影响', () => {
    const { addHistory } = useAppStore.getState()
    addHistory('base64', '1')
    addHistory('url-encode', '2')
    expect(useAppStore.getState().getHistory('base64')).toHaveLength(1)
    expect(useAppStore.getState().getHistory('url-encode')).toHaveLength(1)
  })

  it('收藏上限 200，超出丢弃最旧', () => {
    for (let i = 0; i < 205; i++) useAppStore.getState().toggleFavorite(`tool-${i}`)
    expect(useAppStore.getState().favorites).toHaveLength(200)
    expect(useAppStore.getState().favorites[0]).toBe('tool-204')
    expect(useAppStore.getState().favorites).not.toContain('tool-0')
  })

  it('主题切换写入 resolvedTheme 与 DOM', () => {
    useAppStore.getState().setThemeMode('light')
    expect(useAppStore.getState().resolvedTheme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    useAppStore.getState().setThemeMode('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('移动端菜单开关', () => {
    useAppStore.getState().setMobileMenuOpen(true)
    expect(useAppStore.getState().mobileMenuOpen).toBe(true)
    useAppStore.getState().toggleMobileMenu()
    expect(useAppStore.getState().mobileMenuOpen).toBe(false)
  })
})
