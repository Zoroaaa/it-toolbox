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

  it('历史记录去重、前置并限制 20 条', () => {
    const { addHistory } = useAppStore.getState()
    for (let i = 0; i < 25; i++) addHistory('json-formatter', `input-${i}`)
    const history = useAppStore.getState().getHistory('json-formatter')
    expect(history).toHaveLength(20)
    expect(history[0].input).toBe('input-24')
    addHistory('json-formatter', 'input-24')
    expect(useAppStore.getState().getHistory('json-formatter')[0]).toEqual(
      expect.objectContaining({ input: 'input-24' }),
    )
    expect(useAppStore.getState().getHistory('json-formatter')).toHaveLength(20)
  })

  it('空白输入不写入历史', () => {
    useAppStore.getState().addHistory('json-formatter', '   ')
    expect(useAppStore.getState().getHistory('json-formatter')).toEqual([])
  })

  it('不同工具历史互不影响', () => {
    const { addHistory } = useAppStore.getState()
    addHistory('a', '1')
    addHistory('b', '2')
    expect(useAppStore.getState().getHistory('a')).toHaveLength(1)
    expect(useAppStore.getState().getHistory('b')).toHaveLength(1)
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
