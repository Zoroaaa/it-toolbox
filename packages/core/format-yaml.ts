import { Result } from './common'
import * as jsYaml from 'js-yaml'

export function yamlToJson(yaml: string): Result<string> {
  try {
    const parsed = jsYaml.load(yaml)
    return { ok: true, value: JSON.stringify(parsed, null, 2) }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function jsonToYaml(json: string): Result<string> {
  try {
    const parsed = JSON.parse(json)
    const yaml = jsYaml.dump(parsed, { indent: 2, lineWidth: -1 })
    return { ok: true, value: yaml }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
