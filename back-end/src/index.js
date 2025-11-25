import { Hono } from 'hono'

const MODEL_NAME = '@cf/meta/llama-3.1-8b-instruct'

const app = new Hono()

const buildPrompt = (query) => [
  {
    role: 'system',
    content:
      '당신은 맛집 검색을 돕는 어시스턴트입니다. 사용자가 입력한 자연어 문장에서 위치 정보(좌표 포함)와 선호하는 음식 종류를 추출해 JSON으로만 답변하세요.' +
      ' 위치는 대한민국 내 주요 행정구역/상권/역 이름 등을 기반으로 가장 적합한 중심 좌표를 추정해 위도와 경도를 소수점 6자리까지 제공하세요.' +
      ' 음식 종류는 없으면 null 로 반환합니다.'
  },
  {
    role: 'user',
    content:
      `입력: """${query}"""` +
      '\n\n다음 형식을 지켜 JSON 문자열만 반환하세요:' +
      '\n{' +
      '\n  "location": {' +
      '\n    "name": "<사용자가 언급한 장소 이름>",' +
      '\n    "latitude": <위도 (number)>,' +
      '\n    "longitude": <경도 (number)>' +
      '\n  },' +
      '\n  "cuisine": "<선호 음식 종류>" // 없으면 null' +
      '\n}'
  }
]

const parseAiResponse = (raw) => {
  const textPayload = typeof raw?.response === 'string' ? raw.response : typeof raw?.output_text === 'string' ? raw.output_text : ''
  if (!textPayload) {
    throw new Error('AI 응답이 비어 있습니다.')
  }

  try {
    const parsed = JSON.parse(textPayload)
    return parsed
  } catch (error) {
    throw new Error('AI 응답 JSON 파싱 실패')
  }
}

const ensureValidResult = (result) => {
  if (!result?.location?.name) {
    throw new Error('AI가 위치를 추출하지 못했습니다.')
  }

  const { latitude, longitude } = result.location

  if (typeof latitude !== 'number' || Number.isNaN(latitude) || typeof longitude !== 'number' || Number.isNaN(longitude)) {
    throw new Error('AI가 좌표를 제공하지 않았습니다.')
  }

  const cuisine = result.cuisine === null || result.cuisine === undefined || result.cuisine === '' ? null : String(result.cuisine)

  return {
    location: {
      name: String(result.location.name),
      latitude,
      longitude
    },
    cuisine
  }
}

const extractInfoWithAI = async (aiBinding, query) => {
  const messages = buildPrompt(query)
  const aiResponse = await aiBinding.run(MODEL_NAME, { messages })
  const parsed = parseAiResponse(aiResponse)
  return ensureValidResult(parsed)
}

app.post('/api/parse-query', async (c) => {
  if (!c.env?.AI) {
    return c.json({ error: 'AI 바인딩이 설정되지 않았습니다.' }, 500)
  }

  let payload

  try {
    payload = await c.req.json()
  } catch (error) {
    return c.json({ error: 'JSON 본문을 파싱할 수 없습니다.' }, 400)
  }

  const query = typeof payload?.query === 'string' ? payload.query.trim() : ''

  if (!query) {
    return c.json({ error: 'query 필드는 필수입니다.' }, 400)
  }

  try {
    const result = await extractInfoWithAI(c.env.AI, query)
    return c.json(result)
  } catch (error) {
    console.error('[parse-query:error]', error)
    const message = error instanceof Error ? error.message : 'AI 처리 중 오류가 발생했습니다.'
    const status = message.includes('위치') || message.includes('좌표') ? 422 : 500
    return c.json({ error: message }, status)
  }
})

export default app
