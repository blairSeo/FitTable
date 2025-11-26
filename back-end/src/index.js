import { Hono } from 'hono'

const MODEL_NAME = '@cf/meta/llama-3.1-8b-instruct'

const app = new Hono()

const buildPrompt = (query) => [
  {
    role: 'system',
    content:
      '당신은 맛집 검색을 돕는 어시스턴트입니다. 사용자가 입력한 자연어 문장에서 위치 정보(좌표 포함)와 선호하는 음식 종류를 추출하고, 검색에 쓸 주요 키워드 배열을 만들어 JSON으로만 답변하세요.' +
      ' 위치는 대한민국 내 주요 행정구역/상권/역 이름 등을 기반으로 가장 적합한 중심 좌표를 추정해 위도와 경도를 소수점 6자리까지 제공하세요.' +
      ' 음식 종류는 없으면 null 로 반환합니다. 키워드는 최소 1개 이상 포함하세요.'
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
      '\n  "cuisine": "<선호 음식 종류>" // 없으면 null,' +
      '\n  "keywords": ["<검색 키워드>", "..."] // 최소 1개 이상' +
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
  let location = null

  if (result?.location?.name) {
    const { latitude, longitude } = result.location
    const hasValidCoords = typeof latitude === 'number' && !Number.isNaN(latitude) && typeof longitude === 'number' && !Number.isNaN(longitude)

    location = hasValidCoords
      ? {
          name: String(result.location.name),
          latitude,
          longitude
        }
      : {
          name: String(result.location.name),
          latitude: null,
          longitude: null
        }
  }

  const cuisine = result.cuisine === null || result.cuisine === undefined || result.cuisine === '' ? null : String(result.cuisine)

  const rawKeywords = Array.isArray(result.keywords) ? result.keywords : []
  const keywords = rawKeywords.map((keyword) => String(keyword).trim()).filter((keyword) => keyword.length > 0)

  if (keywords.length === 0) {
    throw new Error('AI가 검색 키워드를 제공하지 않았습니다.')
  }

  return {
    location,
    cuisine,
    keywords
  }
}

const extractInfoWithAI = async (aiBinding, query) => {
  const messages = buildPrompt(query)
  const aiResponse = await aiBinding.run(MODEL_NAME, { messages })
  const parsed = parseAiResponse(aiResponse)
  return ensureValidResult(parsed)
}

const buildNaverQuery = ({ keywords }) => {
  const keywordPart = Array.isArray(keywords) ? keywords.join(' ') : ''
  const full = keywordPart.trim()
  return full
}

const searchNaverLocal = async (env, { location, keywords }) => {
  if (!env.NAVER_CLIENT_ID || !env.NAVER_CLIENT_SECRET) {
    throw new Error('NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET이 설정되지 않았습니다.')
  }

  const query = buildNaverQuery({ location, keywords })

  if (!query) {
    throw new Error('네이버 검색에 사용할 쿼리가 비어 있습니다.')
  }

  const params = new URLSearchParams({
    query,
    display: '10',
    start: '1',
    sort: 'random'
  })

  const response = await fetch(`https://openapi.naver.com/v1/search/local.json?${params.toString()}`, {
    method: 'GET',
    headers: {
      'X-Naver-Client-Id': env.NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': env.NAVER_CLIENT_SECRET
    }
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`네이버 API 호출 실패 (status: ${response.status}): ${text}`)
  }

  const data = await response.json()

  const simplifiedItems = Array.isArray(data.items)
    ? data.items.map((item) => ({
        title: item.title,
        link: item.link,
        category: item.category,
        description: item.description,
        telephone: item.telephone,
        address: item.address,
        roadAddress: item.roadAddress,
        mapx: item.mapx,
        mapy: item.mapy
      }))
    : []

  return {
    query,
    total: typeof data.total === 'number' ? data.total : simplifiedItems.length,
    items: simplifiedItems
  }
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

  const currentLatRaw = payload?.currentLat ?? payload?.currentLatitude
  const currentLngRaw = payload?.currentLng ?? payload?.currentLongitude

  const currentLat = typeof currentLatRaw === 'number' ? currentLatRaw : currentLatRaw !== undefined ? parseFloat(currentLatRaw) : NaN
  const currentLng = typeof currentLngRaw === 'number' ? currentLngRaw : currentLngRaw !== undefined ? parseFloat(currentLngRaw) : NaN

  const hasCurrentLocation = !Number.isNaN(currentLat) && !Number.isNaN(currentLng)

  if (!query) {
    return c.json({ error: 'query 필드는 필수입니다.' }, 400)
  }

  try {
    const aiResult = await extractInfoWithAI(c.env.AI, query)

    let resolvedLocation = aiResult.location

    const needsFallback =
      !resolvedLocation ||
      typeof resolvedLocation.latitude !== 'number' ||
      Number.isNaN(resolvedLocation.latitude) ||
      typeof resolvedLocation.longitude !== 'number' ||
      Number.isNaN(resolvedLocation.longitude)

    if (needsFallback && hasCurrentLocation) {
      resolvedLocation = {
        name: resolvedLocation?.name || '현재 위치',
        latitude: currentLat,
        longitude: currentLng
      }
    }

    const finalResult = {
      ...aiResult,
      location: resolvedLocation
    }

    let naverResult = null
    try {
      naverResult = await searchNaverLocal(c.env, finalResult)
    } catch (naverError) {
      console.error('[naver-search:error]', naverError)
    }

    return c.json({
      ...finalResult,
      naver: naverResult
    })
  } catch (error) {
    console.error('[parse-query:error]', error)
    const message = error instanceof Error ? error.message : 'AI 처리 중 오류가 발생했습니다.'
    const status = message.includes('위치') || message.includes('좌표') ? 422 : 500
    return c.json({ error: message }, status)
  }
})

export default app
