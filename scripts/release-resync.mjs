#!/usr/bin/env node
/**
 * 按 docs/releases/version-map.json 重建 GitHub tag 与 Release。
 *
 * 默认 dry-run，只打印计划；真正执行需显式 --apply 且提供 GITHUB_TOKEN。
 * 建议先执行 --dry-run 核对，再执行 --apply --delete-old。
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const map = JSON.parse(readFileSync(join(root, 'docs', 'releases', 'version-map.json'), 'utf8'))
const apply = process.argv.includes('--apply')
const deleteOld = process.argv.includes('--delete-old')
const token = process.env.GITHUB_TOKEN

const API = 'https://api.github.com'
const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type': 'application/json',
}

const log = (action, detail) => console.log(`${apply ? '[apply]' : '[dry-run]'} ${action} ${detail}`)

async function api(path, init = {}) {
  const res = await fetch(`${API}/repos/${map.repo}${path}`, { ...init, headers })
  if (res.status === 404) return { status: 404, data: null }
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path} → ${res.status} ${await res.text()}`)
  return { status: res.status, data: res.status === 204 ? null : await res.json() }
}

async function resolveSha(commit) {
  // GitHub 创建 ref 要求完整 40 位 SHA，短 SHA 先通过 commits 接口展开
  const path = commit === 'HEAD' ? '/commits/main' : `/commits/${commit}`
  const { data } = await api(path)
  return data.sha
}

async function ensureTag(tag, sha) {
  const existing = await api(`/git/ref/tags/${tag}`)
  if (existing.status === 200) {
    if (existing.data.object.sha !== sha) {
      log('tag-update', `${tag} → ${sha}`)
      if (apply) {
        await api(`/git/refs/tags/${tag}`, {
          method: 'PATCH',
          body: JSON.stringify({ sha, force: true }),
        })
      }
    }
    return
  }
  log('tag-create', `${tag} → ${sha}`)
  if (apply) {
    await api('/git/refs', {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/tags/${tag}`, sha }),
    })
  }
}

async function upsertRelease({ tag, notes }) {
  const body = readFileSync(join(root, notes), 'utf8')
  const list = (await api('/releases?per_page=100')).data ?? []
  let existing = list.find((release) => release.tag_name === tag)

  // GitHub 列表接口偶发短暂不一致，回退到按 tag 精确查询
  if (!existing) {
    const single = await api(`/releases/tags/${tag}`)
    if (single.status === 200) existing = single.data
  }

  if (existing) {
    log('release-update', tag)
    if (apply) {
      await api(`/releases/${existing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: tag, body, draft: false, prerelease: false }),
      })
    }
    return
  }

  log('release-create', tag)
  if (apply) {
    try {
      await api('/releases', {
        method: 'POST',
        body: JSON.stringify({ tag_name: tag, name: tag, body, draft: false, prerelease: false }),
      })
    } catch (error) {
      // GitHub 列表接口存在短暂不一致，POST 可能返回 already_exists，此时改为更新
      if (!String(error.message).includes('already_exists')) throw error
      const fresh = (await api('/releases?per_page=100')).data ?? []
      const created = fresh.find((release) => release.tag_name === tag)
      if (!created) throw error
      await api(`/releases/${created.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: tag, body, draft: false, prerelease: false }),
      })
    }
  }
}

async function deleteRelease(tag) {
  const list = (await api('/releases?per_page=100')).data ?? []
  const existing = list.find((release) => release.tag_name === tag)
  if (!existing) return
  log('release-delete', tag)
  if (apply) await api(`/releases/${existing.id}`, { method: 'DELETE' })
}

async function deleteTag(tag) {
  const existing = await api(`/git/ref/tags/${tag}`)
  if (existing.status !== 200) return
  log('tag-delete', tag)
  if (apply) await api(`/git/refs/tags/${tag}`, { method: 'DELETE' })
}

async function main() {
  if (apply && !token) {
    console.error('缺少 GITHUB_TOKEN。请通过环境变量传入有 repo 权限的 fine-grained token。')
    process.exit(1)
  }

  console.log(`仓库：${map.repo}；模式：${apply ? 'APPLY' : 'DRY-RUN'}；删除旧标签：${deleteOld ? '是' : '否'}`)

  for (const item of map.archive) {
    await ensureTag(item.tag, await resolveSha(item.commit))
  }

  for (const release of map.releases) {
    const sha = await resolveSha(release.commit)
    await ensureTag(release.tag, sha)
    await upsertRelease(release)
  }

  if (deleteOld) {
    for (const tag of map.obsoleteTags) {
      // 先删 Release 再删 tag，避免留下悬空发布
      await deleteRelease(tag)
      await deleteTag(tag)
    }
  }

  console.log('\n完成。核对命令：')
  console.log('  git ls-remote --tags origin')
  console.log(`  gh release list  # 或访问 https://github.com/${map.repo}/releases`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
