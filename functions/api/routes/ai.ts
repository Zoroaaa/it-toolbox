import { Hono } from 'hono'
import type { Env } from '../../types'

export const aiRoute = new Hono<{ Bindings: Env }>()

/**
 * Workers AI 的模型 ID 是有生命周期的配置项，不是稳定的常量：
 * @cf/meta/llama-3.1-8b-instruct 已于 2026-05-30 退役，继续调用会直接抛错。
 *
 * 这里不再用 JS 超时提前返回：实测超时后返回会让边缘取消上游子请求，
 * 业务 JSON 被 Cloudflare HTML 502 覆盖。直接 await 模型自然完成。
 */
const AI_MODELS = [
  '@cf/meta/llama-3.1-8b-instruct-fast',
  '@cf/zai-org/glm-4.7-flash',
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
] as const

type AiMessage = { role: string; content: string }
type AiRawOutput = {
  response?: unknown
  result?: { response?: unknown }
  choices?: Array<{ message?: { content?: unknown } }>
}
type AiOutcome = { ok: true; value: string; model: string } | { ok: false; error: string }

/** 兼容 Workers AI 不同模型的输出形态：{response} / OpenAI choices / 旧版 result.response */
function extractAiText(output: AiRawOutput): string {
  if (typeof output.response === 'string') return output.response
  if (typeof output.result?.response === 'string') return output.result.response
  const content = output.choices?.[0]?.message?.content
  return typeof content === 'string' ? content : ''
}

/** 单模型调用：空响应兜底、异常转结构化错误 */
async function runSingleModel(
  env: Env,
  model: string,
  messages: AiMessage[],
): Promise<AiOutcome> {
  try {
    const output = (await env.AI.run(model as keyof AiModels, { messages } as never)) as AiRawOutput
    const text = extractAiText(output)
    if (!text.trim()) return { ok: false, error: '返回内容为空' }
    return { ok: true, value: text, model }
  } catch (e) {
    const message = (e as Error).message || '调用失败'
    return { ok: false, error: message.slice(0, 160) }
  }
}

/** 统一 AI 调用：按候选模型逐个降级，任何失败都不抛异常 */
async function runAiModel(env: Env, messages: AiMessage[]): Promise<AiOutcome> {
  if (!env.AI || typeof env.AI.run !== 'function') {
    return { ok: false, error: 'AI 绑定未配置，请在 Pages 项目中绑定 Workers AI' }
  }

  const failures: string[] = []

  for (const model of AI_MODELS) {
    const outcome = await runSingleModel(env, model, messages)
    if (outcome.ok) return outcome
    failures.push(`${model} → ${outcome.error}`)
  }

  return { ok: false, error: `AI 调用失败（${failures.join('；')}）` }
}

/**
 * 解析模型返回的 JSON：兼容代码围栏、前后夹带说明文字、以及被截断的片段。
 * 解析失败返回 null，由调用方转成可读的业务错误。
 */
export function parseAiJson(raw: string): unknown | null {
  const cleaned = raw.replace(/```json/gi, '```').replace(/```/g, '').trim()
  try {
    return JSON.parse(cleaned) as unknown
  } catch {
    /* 继续尝试提取第一个平衡的 JSON 对象 */
  }

  const start = cleaned.indexOf('{')
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
      continue
    }
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        try {
          return JSON.parse(cleaned.slice(start, i + 1)) as unknown
        } catch {
          return null
        }
      }
    }
  }

  return null
}

aiRoute.post('/explain', async (c) => {
  const { code, language = 'unknown' } = await c.req.json<{ code: string; language?: string }>()
  if (!code?.trim()) return c.json({ success: false, error: 'code is required' }, 400)
  if (code.length > 4000) return c.json({ success: false, error: 'Code too long (max 4000 chars)' }, 400)

  const messages = [
    { role: 'system', content: 'You are a senior developer. Explain code clearly and concisely in Chinese. Focus on what it does, key concepts, and any notable patterns or issues.' },
    { role: 'user', content: `请解释以下 ${language} 代码：\n\n\`\`\`${language}\n${code}\n\`\`\`` }
  ]

  const aiResult = await runAiModel(c.env, messages)
  if (!aiResult.ok) return c.json({ success: false, error: aiResult.error }, 502)
  c.header('X-AI-Model', aiResult.model)
  const result = { response: aiResult.value }
  return c.json({ success: true, data: { explanation: result.response } })
})

aiRoute.post('/regex', async (c) => {
  const { description } = await c.req.json<{ description: string }>()
  if (!description?.trim()) return c.json({ success: false, error: 'description is required' }, 400)

  const messages = [
    { role: 'system', content: 'You are a regex expert. Given a description, return ONLY a JSON object with: {"pattern": "regex_here", "flags": "gi", "explanation": "brief explanation in Chinese"}. No markdown, no extra text.' },
    { role: 'user', content: description }
  ]

  const aiResult = await runAiModel(c.env, messages)
  if (!aiResult.ok) return c.json({ success: false, error: aiResult.error }, 502)
  c.header('X-AI-Model', aiResult.model)
  const result = { response: aiResult.value }
  const parsed = parseAiJson(result.response)
  if (!parsed) return c.json({ success: false, error: 'Failed to parse AI response' }, 500)
  return c.json({ success: true, data: parsed })
})

aiRoute.post('/sql', async (c) => {
  const { description, schema } = await c.req.json<{ description: string; schema?: string }>()
  if (!description?.trim()) return c.json({ success: false, error: 'description is required' }, 400)

  const schemaContext = schema ? `\n\nDatabase schema:\n\`\`\`sql\n${schema}\n\`\`\`` : ''
  const messages = [
    { role: 'system', content: 'You are a SQL expert. Generate clean, optimized SQL based on the description. Return ONLY a JSON object: {"sql": "SQL_HERE", "explanation": "brief explanation in Chinese"}. No markdown.' },
    { role: 'user', content: `${description}${schemaContext}` }
  ]

  const aiResult = await runAiModel(c.env, messages)
  if (!aiResult.ok) return c.json({ success: false, error: aiResult.error }, 502)
  c.header('X-AI-Model', aiResult.model)
  const result = { response: aiResult.value }
  const parsed = parseAiJson(result.response)
  if (!parsed) return c.json({ success: false, error: 'Failed to parse AI response' }, 500)
  return c.json({ success: true, data: parsed })
})

aiRoute.post('/review', async (c) => {
  const { code, language = 'unknown' } = await c.req.json<{ code: string; language?: string }>()
  if (!code?.trim()) return c.json({ success: false, error: 'code is required' }, 400)
  if (code.length > 4000) return c.json({ success: false, error: 'Code too long (max 4000 chars)' }, 400)

  const messages = [
    {
      role: 'system',
      content: `You are a senior code reviewer. Analyze the code and return ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
{
  "security": { "score": 0-100, "issues": ["issue1"], "suggestions": ["suggestion1"] },
  "performance": { "score": 0-100, "issues": ["issue1"], "suggestions": ["suggestion1"] },
  "readability": { "score": 0-100, "issues": ["issue1"], "suggestions": ["suggestion1"] },
  "overall": "综合评价文字"
}
Score rules: 80-100 = good, 60-79 = needs improvement, 0-59 = poor.
All text must be in Chinese. Be specific and actionable.`
    },
    { role: 'user', content: `请审查以下 ${language} 代码：\n\n\`\`\`${language}\n${code}\n\`\`\`` }
  ]

  const aiResult = await runAiModel(c.env, messages)
  if (!aiResult.ok) return c.json({ success: false, error: aiResult.error }, 502)
  c.header('X-AI-Model', aiResult.model)
  const result = { response: aiResult.value }
  const parsed = parseAiJson(result.response)
  if (!parsed) return c.json({ success: false, error: 'Failed to parse AI response' }, 500)
  return c.json({ success: true, data: parsed })
})

aiRoute.post('/json-schema', async (c) => {
  const { json } = await c.req.json<{ json: string }>()
  if (!json?.trim()) return c.json({ success: false, error: 'json is required' }, 400)
  if (json.length > 8000) return c.json({ success: false, error: 'JSON too long (max 8000 chars)' }, 400)

  const messages = [
    {
      role: 'system',
      content: `You are a JSON Schema expert. Given a JSON sample, generate a comprehensive JSON Schema with Chinese descriptions. Return ONLY a valid JSON object (no markdown, no extra text) with this structure:
{
  "schema": "the complete JSON Schema as a formatted string with proper indentation",
  "explanation": "brief explanation in Chinese about the schema structure"
}
The schema should include:
- Proper type definitions
- Required fields
- Descriptions in Chinese for each property
- Appropriate constraints (minLength, maxLength, minimum, maximum, pattern, etc.)
- Handle nested objects and arrays correctly
- Use Draft-07 JSON Schema format`
    },
    { role: 'user', content: `请为以下JSON生成JSON Schema：\n\n${json}` }
  ]

  const aiResult = await runAiModel(c.env, messages)
  if (!aiResult.ok) return c.json({ success: false, error: aiResult.error }, 502)
  c.header('X-AI-Model', aiResult.model)
  const result = { response: aiResult.value }
  const parsed = parseAiJson(result.response)
  if (!parsed) return c.json({ success: false, error: 'Failed to parse AI response' }, 500)
  return c.json({ success: true, data: parsed })
})

aiRoute.post('/commit-msg', async (c) => {
  const { diff } = await c.req.json<{ diff: string }>()
  if (!diff?.trim()) return c.json({ success: false, error: 'diff is required' }, 400)
  if (diff.length > 8000) return c.json({ success: false, error: 'Diff too long (max 8000 chars)' }, 400)

  const messages = [
    {
      role: 'system',
      content: `You are a Git expert. Analyze the diff and generate a Conventional Commits message. Return ONLY a valid JSON object (no markdown, no extra text) with this structure:
{
  "message": "the complete commit message in Conventional Commits format",
  "type": "feat/fix/docs/style/refactor/perf/test/chore",
  "scope": "affected scope (optional, e.g., api, ui, auth)",
  "description": "brief description in Chinese",
  "body": "optional detailed explanation in Chinese if the change is complex"
}
Conventional Commits format: type(scope): description\n\n[optional body]\n\n[optional footer]
Rules:
- Use Chinese for description and body
- Keep description under 50 characters
- Use imperative mood (添加, 修复, 更新, etc.)
- Be specific and concise`
    },
    { role: 'user', content: `请分析以下Git diff并生成提交信息：\n\n${diff}` }
  ]

  const aiResult = await runAiModel(c.env, messages)
  if (!aiResult.ok) return c.json({ success: false, error: aiResult.error }, 502)
  c.header('X-AI-Model', aiResult.model)
  const result = { response: aiResult.value }
  const parsed = parseAiJson(result.response)
  if (!parsed) return c.json({ success: false, error: 'Failed to parse AI response' }, 500)
  return c.json({ success: true, data: parsed })
})

aiRoute.post('/extract', async (c) => {
  const { text, fields } = await c.req.json<{ text: string; fields?: string }>()
  if (!text?.trim()) return c.json({ success: false, error: 'text is required' }, 400)
  if (text.length > 4000) return c.json({ success: false, error: 'Text too long (max 4000 chars)' }, 400)

  const fieldsHint = fields ? `\n\n用户希望提取以下字段：${fields}` : '\n\n自动识别并提取关键信息'

  const messages = [
    {
      role: 'system',
      content: `You are an information extraction expert. Extract structured data from unstructured text and return ONLY a valid JSON object (no markdown, no extra text) with this structure:
{
  "data": { "field1": "value1", "field2": "value2", ... },
  "explanation": "brief explanation in Chinese about what was extracted"
}
Rules:
- Extract relevant information based on the text content
- Use appropriate data types (string, number, boolean, array)
- If a field cannot be found, set it to null
- All text in explanation must be in Chinese
- Be accurate and don't hallucinate information not in the text`
    },
    { role: 'user', content: `请从以下文本中提取结构化信息：${fieldsHint}\n\n文本内容：\n${text}` }
  ]

  const aiResult = await runAiModel(c.env, messages)
  if (!aiResult.ok) return c.json({ success: false, error: aiResult.error }, 502)
  c.header('X-AI-Model', aiResult.model)
  const result = { response: aiResult.value }
  const parsed = parseAiJson(result.response)
  if (!parsed) return c.json({ success: false, error: 'Failed to parse AI response' }, 500)
  return c.json({ success: true, data: parsed })
})

aiRoute.post('/translate', async (c) => {
  const { text, sourceLang, targetLang } = await c.req.json<{ text: string; sourceLang: string; targetLang: string }>()
  if (!text?.trim()) return c.json({ success: false, error: 'text is required' }, 400)
  if (text.length > 4000) return c.json({ success: false, error: 'Text too long (max 4000 chars)' }, 400)

  const sourceHint = sourceLang === 'auto' ? '自动检测源语言' : `源语言：${sourceLang}`
  const messages = [
    {
      role: 'system',
      content: `You are a professional translator specializing in technical documentation. Translate the text and return ONLY a valid JSON object (no markdown, no extra text) with this structure:
{
  "translation": "translated text here",
  "detectedLanguage": "detected source language (only when sourceLang is auto)",
  "notes": "optional notes about technical terms preserved or translation decisions"
}
Rules:
- Preserve technical terms, code snippets, and proper nouns
- Maintain the original formatting and structure
- Use natural, fluent language for the target language
- All notes must be in Chinese`
    },
    { role: 'user', content: `${sourceHint}\n目标语言：${targetLang}\n\n需要翻译的文本：\n${text}` }
  ]

  const aiResult = await runAiModel(c.env, messages)
  if (!aiResult.ok) return c.json({ success: false, error: aiResult.error }, 502)
  c.header('X-AI-Model', aiResult.model)
  const result = { response: aiResult.value }
  const parsed = parseAiJson(result.response)
  if (!parsed) return c.json({ success: false, error: 'Failed to parse AI response' }, 500)
  return c.json({ success: true, data: parsed })
})

aiRoute.post('/error-explain', async (c) => {
  const { errorText, context } = await c.req.json<{ errorText: string; context?: string }>()
  if (!errorText?.trim()) return c.json({ success: false, error: 'errorText is required' }, 400)
  if (errorText.length > 4000) return c.json({ success: false, error: 'Error text too long (max 4000 chars)' }, 400)

  const contextHint = context ? `\n\n上下文信息：${context}` : ''
  const messages = [
    {
      role: 'system',
      content: `You are a debugging expert. Analyze error messages and provide explanations and solutions. Return ONLY a valid JSON object (no markdown, no extra text) with this structure:
{
  "cause": "root cause explanation in Chinese",
  "explanation": "detailed explanation in Chinese",
  "solutions": ["solution 1", "solution 2", ...],
  "relatedDocs": "optional related documentation or resources"
}
Rules:
- Identify the root cause of the error
- Provide clear, actionable solutions
- All text must be in Chinese
- Be specific and practical`
    },
    { role: 'user', content: `请分析以下错误信息并提供解决方案：${contextHint}\n\n错误信息：\n${errorText}` }
  ]

  const aiResult = await runAiModel(c.env, messages)
  if (!aiResult.ok) return c.json({ success: false, error: aiResult.error }, 502)
  c.header('X-AI-Model', aiResult.model)
  const result = { response: aiResult.value }
  const parsed = parseAiJson(result.response)
  if (!parsed) return c.json({ success: false, error: 'Failed to parse AI response' }, 500)
  return c.json({ success: true, data: parsed })
})

aiRoute.post('/naming', async (c) => {
  const { description, style, type } = await c.req.json<{ description: string; style: string; type: string }>()
  if (!description?.trim()) return c.json({ success: false, error: 'description is required' }, 400)

  const messages = [
    {
      role: 'system',
      content: `You are a naming expert for programming. Generate appropriate names based on descriptions. Return ONLY a valid JSON object (no markdown, no extra text) with this structure:
{
  "suggestions": [
    { "name": "suggestedName", "type": "variable/function/class/constant", "style": "naming style used", "explanation": "why this name is good" }
  ]
}
Rules:
- Generate 3-5 different suggestions
- Follow the requested naming style (${style})
- Consider the type (${type})
- Names should be clear, meaningful, and follow best practices
- All explanations must be in Chinese`
    },
    { role: 'user', content: `功能描述：${description}\n命名风格：${style}\n类型：${type}` }
  ]

  const aiResult = await runAiModel(c.env, messages)
  if (!aiResult.ok) return c.json({ success: false, error: aiResult.error }, 502)
  c.header('X-AI-Model', aiResult.model)
  const result = { response: aiResult.value }
  const parsed = parseAiJson(result.response)
  if (!parsed) return c.json({ success: false, error: 'Failed to parse AI response' }, 500)
  return c.json({ success: true, data: parsed })
})

aiRoute.post('/mock-data', async (c) => {
  const { description, count } = await c.req.json<{ description: string; count: number }>()
  if (!description?.trim()) return c.json({ success: false, error: 'description is required' }, 400)

  const messages = [
    {
      role: 'system',
      content: `You are a mock data generator. Generate realistic test data based on descriptions. Return ONLY a valid JSON object (no markdown, no extra text) with this structure:
{
  "data": [ ... array of ${count} mock objects ... ],
  "explanation": "brief explanation in Chinese about the generated data"
}
Rules:
- Generate exactly ${count} items
- Data should look realistic (e.g., real-looking names, valid email formats, reasonable prices)
- Use appropriate data types
- All explanations must be in Chinese`
    },
    { role: 'user', content: `数据描述：${description}\n生成数量：${count}` }
  ]

  const aiResult = await runAiModel(c.env, messages)
  if (!aiResult.ok) return c.json({ success: false, error: aiResult.error }, 502)
  c.header('X-AI-Model', aiResult.model)
  const result = { response: aiResult.value }
  const parsed = parseAiJson(result.response)
  if (!parsed) return c.json({ success: false, error: 'Failed to parse AI response' }, 500)
  return c.json({ success: true, data: parsed })
})

aiRoute.post('/shell-cmd', async (c) => {
  const { description } = await c.req.json<{ description: string }>()
  if (!description?.trim()) return c.json({ success: false, error: 'description is required' }, 400)

  const messages = [
    {
      role: 'system',
      content: `You are a shell command expert. Generate shell commands based on natural language descriptions. Return ONLY a valid JSON object (no markdown, no extra text) with this structure:
{
  "bash": "bash command here",
  "powershell": "powershell equivalent command here",
  "explanation": "what the command does in Chinese",
  "warnings": ["warning 1", "warning 2"],
  "isDangerous": true/false
}
Rules:
- Provide both Bash and PowerShell equivalents when possible
- Mark dangerous commands (rm -rf, format, etc.) with isDangerous: true
- Include warnings for potentially harmful operations
- All explanations must be in Chinese
- Commands should be safe and follow best practices`
    },
    { role: 'user', content: `描述：${description}` }
  ]

  const aiResult = await runAiModel(c.env, messages)
  if (!aiResult.ok) return c.json({ success: false, error: aiResult.error }, 502)
  c.header('X-AI-Model', aiResult.model)
  const result = { response: aiResult.value }
  const parsed = parseAiJson(result.response)
  if (!parsed) return c.json({ success: false, error: 'Failed to parse AI response' }, 500)
  return c.json({ success: true, data: parsed })
})
