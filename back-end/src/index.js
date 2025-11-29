import { Hono } from 'hono'

// ============================================================================
// 상수 정의
// ============================================================================

const MODEL_NAME = '@cf/meta/llama-3.1-8b-instruct'
const KAKAO_API_BASE_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json'
const KAKAO_SEARCH_RADIUS = 20000 // 20km
const KAKAO_SEARCH_SIZE = 15 // 최대 15개

// ============================================================================
// CORS 미들웨어
// ============================================================================

const corsMiddleware = async (c, next) => {
  const origin = c.req.header('Origin') || '*'
  
  c.header('Access-Control-Allow-Origin', origin)
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  c.header('Access-Control-Allow-Credentials', 'true')
  c.header('Access-Control-Max-Age', '600')
  
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204)
  }
  
  await next()
}

// ============================================================================
// AI 관련 함수
// ============================================================================

/**
 * AI 프롬프트 생성
 */
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

/**
 * AI 응답 파싱
 */
const parseAiResponse = (raw) => {
  const textPayload = raw?.response || raw?.output_text || ''
  
  if (!textPayload) {
    throw new Error('AI 응답이 비어 있습니다.')
  }

  try {
    return JSON.parse(textPayload)
  } catch (error) {
    throw new Error('AI 응답 JSON 파싱 실패')
  }
}

/**
 * AI 결과 검증 및 정규화
 */
const validateAiResult = (result) => {
  // 위치 정보 처리
  let location = null
  if (result?.location?.name) {
    const { latitude, longitude } = result.location
    const hasValidCoords = 
      typeof latitude === 'number' && 
      !Number.isNaN(latitude) && 
      typeof longitude === 'number' && 
      !Number.isNaN(longitude)

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

  // 음식 종류 처리
  const cuisine = 
    result.cuisine === null || 
    result.cuisine === undefined || 
    result.cuisine === '' 
      ? null 
      : String(result.cuisine)

  // 키워드 처리
  const rawKeywords = Array.isArray(result.keywords) ? result.keywords : []
  const keywords = rawKeywords
    .map((keyword) => String(keyword).trim())
    .filter((keyword) => keyword.length > 0)

  if (keywords.length === 0) {
    throw new Error('AI가 검색 키워드를 제공하지 않았습니다.')
  }

  return { location, cuisine, keywords }
}

/**
 * AI를 사용하여 쿼리에서 정보 추출
 */
const extractInfoWithAI = async (aiBinding, query) => {
  const messages = buildPrompt(query)
  const aiResponse = await aiBinding.run(MODEL_NAME, { messages })
  const parsed = parseAiResponse(aiResponse)
  return validateAiResult(parsed)
}

// ============================================================================
// 카카오 API 관련 함수
// ============================================================================

/**
 * 카카오 검색 쿼리 생성
 */
const buildKakaoQuery = (keywords) => {
  if (!Array.isArray(keywords)) return ''
  return keywords.join(' ').trim()
}

/**
 * 카카오 API 에러 처리
 */
const handleKakaoApiError = async (response) => {
  let errorMessage = `카카오 API 호출 실패 (status: ${response.status})`
  
  try {
    const errorData = await response.json()
    if (errorData.message) {
      errorMessage += `: ${errorData.message}`
    }
  } catch {
    const text = await response.text()
    if (text) {
      errorMessage += `: ${text}`
    }
  }
  
  throw new Error(errorMessage)
}

/**
 * 카카오 API 응답 데이터 변환
 */
const transformKakaoResponse = (documents) => {
  return documents
    .map((item) => {
      const lng = parseFloat(item.x)
      const lat = parseFloat(item.y)

      // 좌표가 유효하지 않으면 제외
      if (isNaN(lat) || isNaN(lng)) {
        return null
      }

      return {
        name: item.place_name || '',
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        address: item.road_address_name || item.address_name || ''
      }
    })
    .filter((item) => item !== null)
}

/**
 * 카카오 로컬 API 검색
 */
const searchKakaoLocal = async (env, { location, keywords, page = 1 }) => {
  if (!env.KAKAO_REST_API_KEY) {
    throw new Error('KAKAO_REST_API_KEY가 설정되지 않았습니다.')
  }

  const query = buildKakaoQuery(keywords)
  if (!query) {
    throw new Error('카카오 검색에 사용할 쿼리가 비어 있습니다.')
  }

  // API 요청 파라미터 구성
  const params = new URLSearchParams({
    query,
    size: String(KAKAO_SEARCH_SIZE),
    page: String(page)
  })

  // 위치 정보가 있으면 중심 좌표와 반경 추가
  if (location?.longitude && location?.latitude) {
    params.append('x', location.longitude.toString())
    params.append('y', location.latitude.toString())
    params.append('radius', String(KAKAO_SEARCH_RADIUS))
  }

  // API 호출
  const response = await fetch(`${KAKAO_API_BASE_URL}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `KakaoAK ${env.KAKAO_REST_API_KEY}`
    }
  })

  if (!response.ok) {
    await handleKakaoApiError(response)
  }

  const data = await response.json()
  
  // 응답 구조 검증
  if (!data || typeof data !== 'object') {
    throw new Error('카카오 API 응답 형식이 올바르지 않습니다.')
  }

  // documents 배열 검증
  if (!Array.isArray(data.documents)) {
    console.warn('[kakao-search] documents가 배열이 아닙니다:', data)
    return {
      query,
      total: 0,
      items: [],
      hasMore: false,
      page
    }
  }

  // 데이터 변환
  const items = transformKakaoResponse(data.documents)
  
  console.log(`[kakao-search] 검색 완료: query="${query}", page=${page}, 결과=${items.length}개`)

  // 페이지네이션 정보
  const total = typeof data.meta?.total_count === 'number' ? data.meta.total_count : items.length
  const isEnd = data.meta?.is_end === true
  const hasMore = !isEnd && items.length > 0

  return {
    query,
    total,
    items,
    hasMore,
    page
  }
}

// ============================================================================
// 요청 파라미터 처리 함수
// ============================================================================

/**
 * 요청 본문에서 좌표 파싱
 */
const parseCoordinates = (payload) => {
  const currentLatRaw = payload?.currentLat ?? payload?.currentLatitude
  const currentLngRaw = payload?.currentLng ?? payload?.currentLongitude

  const currentLat = 
    typeof currentLatRaw === 'number' 
      ? currentLatRaw 
      : currentLatRaw !== undefined 
        ? parseFloat(currentLatRaw) 
        : NaN
  
  const currentLng = 
    typeof currentLngRaw === 'number' 
      ? currentLngRaw 
      : currentLngRaw !== undefined 
        ? parseFloat(currentLngRaw) 
        : NaN

  const hasValidCoords = !Number.isNaN(currentLat) && !Number.isNaN(currentLng)
  
  return {
    currentLat: hasValidCoords ? currentLat : null,
    currentLng: hasValidCoords ? currentLng : null,
    hasValidCoords
  }
}

/**
 * 요청 본문에서 페이지 번호 파싱
 */
const parsePage = (payload) => {
  const pageRaw = payload?.page
  const page = 
    typeof pageRaw === 'number' && pageRaw > 0 
      ? pageRaw 
      : pageRaw !== undefined 
        ? parseInt(pageRaw, 10) 
        : 1
  
  return Number.isNaN(page) || page < 1 ? 1 : page
}

// ============================================================================
// API 엔드포인트
// ============================================================================

const app = new Hono()

// CORS 미들웨어 적용
app.use('*', corsMiddleware)

/**
 * 검색어 파싱 및 맛집 검색 API
 */
app.post('/api/parse-query', async (c) => {
  // AI 바인딩 확인
  if (!c.env?.AI) {
    return c.json({ error: 'AI 바인딩이 설정되지 않았습니다.' }, 500)
  }

  // 요청 본문 파싱
  let payload
  try {
    payload = await c.req.json()
  } catch (error) {
    return c.json({ error: 'JSON 본문을 파싱할 수 없습니다.' }, 400)
  }

  const query = typeof payload?.query === 'string' ? payload.query.trim() : ''
  const { currentLat, currentLng, hasValidCoords } = parseCoordinates(payload)
  const page = parsePage(payload)

  // 검색어가 없고 현재 위치가 있으면 현재 위치 기반 검색
  if (!query && hasValidCoords) {
    try {
      const result = await searchKakaoLocal(c.env, {
        location: {
          name: '현재 위치',
          latitude: currentLat,
          longitude: currentLng
        },
        keywords: ['맛집'],
        page
      })

      return c.json({
        items: result.items || [],
        hasMore: result.hasMore || false,
        total: result.total || 0,
        page: result.page || page
      })
    } catch (error) {
      console.error('[current-location-search:error]', error)
      const message = error instanceof Error ? error.message : '현재 위치 기반 검색 중 오류가 발생했습니다.'
      return c.json({ error: message }, 500)
    }
  }

  // 검색어가 없으면 에러
  if (!query) {
    return c.json({ 
      error: 'query 필드는 필수이거나 현재 위치 정보가 필요합니다.' 
    }, 400)
  }

  // AI를 사용하여 쿼리 분석
  try {
    const aiResult = await extractInfoWithAI(c.env.AI, query)
    console.log('[ai-result]', aiResult)

    // 위치 이름을 키워드에 추가 (없는 경우)
    if (aiResult.location?.name && Array.isArray(aiResult.keywords)) {
      const locationName = String(aiResult.location.name).trim()
      if (locationName && !aiResult.keywords.includes(locationName)) {
        aiResult.keywords.push(locationName)
      }
    }

    // 위치 정보가 없거나 유효하지 않으면 현재 위치로 대체
    let resolvedLocation = aiResult.location
    const needsLocationFallback =
      !resolvedLocation ||
      typeof resolvedLocation.latitude !== 'number' ||
      Number.isNaN(resolvedLocation.latitude) ||
      typeof resolvedLocation.longitude !== 'number' ||
      Number.isNaN(resolvedLocation.longitude)

    if (needsLocationFallback && hasValidCoords) {
      resolvedLocation = {
        name: resolvedLocation?.name || '현재 위치',
        latitude: currentLat,
        longitude: currentLng
      }
    }

    // 카카오 API 검색
    let kakaoResult = null
    try {
      kakaoResult = await searchKakaoLocal(c.env, {
        ...aiResult,
        location: resolvedLocation,
        page
      })
    } catch (kakaoError) {
      console.error('[kakao-search:error]', kakaoError)
    }

    return c.json({
      items: kakaoResult?.items || [],
      hasMore: kakaoResult?.hasMore || false,
      total: kakaoResult?.total || 0,
      page: kakaoResult?.page || page
    })
  } catch (error) {
    console.error('[parse-query:error]', error)
    const message = error instanceof Error ? error.message : 'AI 처리 중 오류가 발생했습니다.'
    const status = message.includes('위치') || message.includes('좌표') ? 422 : 500
    return c.json({ error: message }, status)
  }
})

export default app
