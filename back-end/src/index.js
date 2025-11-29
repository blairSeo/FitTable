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
 * 한국 주요 지역 좌표 데이터베이스
 */
const LOCATION_DATABASE = {
  '사당역': { name: '사당역', latitude: 37.4765, longitude: 126.9816 },
  '강남역': { name: '강남역', latitude: 37.4980, longitude: 127.0276 },
  '홍대입구': { name: '홍대입구', latitude: 37.5563, longitude: 126.9233 },
  '명동': { name: '명동', latitude: 37.5636, longitude: 126.9826 },
  '이태원': { name: '이태원', latitude: 37.5345, longitude: 126.9946 },
  '잠실': { name: '잠실', latitude: 37.5133, longitude: 127.1028 },
  '신촌': { name: '신촌', latitude: 37.5551, longitude: 126.9368 },
  '건대입구': { name: '건대입구', latitude: 37.5406, longitude: 127.0692 },
  '압구정': { name: '압구정', latitude: 37.5271, longitude: 127.0284 },
  '청담동': { name: '청담동', latitude: 37.5194, longitude: 127.0473 }
}

/**
 * 쿼리에서 지역명 추출 (간단한 패턴 매칭)
 */
const extractLocationFromQuery = (query) => {
  const lowerQuery = query.toLowerCase()
  
  for (const [key, value] of Object.entries(LOCATION_DATABASE)) {
    if (lowerQuery.includes(key.toLowerCase())) {
      return value
    }
  }
  
  return null
}

/**
 * AI 프롬프트 생성
 */
const buildPrompt = (query) => {
  // 쿼리에서 지역명 추출 시도
  const extractedLocation = extractLocationFromQuery(query)
  
  const locationHint = extractedLocation 
    ? `\n\n참고: "${extractedLocation.name}"의 좌표는 위도 ${extractedLocation.latitude}, 경도 ${extractedLocation.longitude}입니다.`
    : ''
  
  return [
    {
      role: 'system',
      content:
        'You are a helpful assistant for restaurant search in South Korea. Extract location information (with coordinates) and create a keywords array from the user\'s natural language query. ' +
        'Return ONLY valid JSON without any markdown formatting, code blocks, or additional text. ' +
        'For locations, you MUST use the exact location name mentioned by the user (e.g., "사당역", "강남역", "홍대입구"). Do NOT modify or translate the location name. ' +
        'Provide accurate coordinates (latitude and longitude) for major districts, commercial areas, or subway stations in South Korea. ' +
        'Keywords must include at least 1 item and should be in Korean.'
    },
    {
      role: 'user',
      content:
        `Extract information from this Korean query: "${query}"${locationHint}\n\n` +
        'Return ONLY a valid JSON object in this exact format (use Korean for location names and keywords):\n' +
        '{\n' +
        '  "location": {\n' +
        '    "name": "사용자가 언급한 정확한 지역명 (예: 사당역, 강남역)",\n' +
        '    "latitude": 37.123456,\n' +
        '    "longitude": 127.123456\n' +
        '  },\n' +
        '  "keywords": ["키워드1", "키워드2"]\n' +
        '}\n\n' +
        'Important rules:\n' +
        '1. Return ONLY the JSON object, no other text, no markdown, no code blocks\n' +
        '2. Use the EXACT location name from the query (do not modify or translate)\n' +
        '3. All location names and keywords must be in Korean\n' +
        '4. Provide accurate coordinates for the location'
    }
  ]
}

/**
 * AI 응답에서 JSON 추출
 */
const extractJsonFromResponse = (text) => {
  // 마크다운 코드 블록 제거
  text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  
  // JSON 객체 찾기 (중괄호로 시작하고 끝나는 부분)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return jsonMatch[0]
  }
  
  return text
}

/**
 * AI 응답 파싱
 */
const parseAiResponse = (raw) => {
  const textPayload = raw?.response || raw?.output_text || ''
  
  if (!textPayload) {
    throw new Error('AI 응답이 비어 있습니다.')
  }

  // JSON 추출 시도
  let jsonText = extractJsonFromResponse(textPayload)
  
  // 여러 번 시도 (마크다운 제거 후)
  try {
    return JSON.parse(jsonText)
  } catch (firstError) {
    // 추가 정리 시도
    jsonText = jsonText
      .replace(/^[^{]*/, '') // 시작 부분의 비JSON 텍스트 제거
      .replace(/[^}]*$/, '') // 끝 부분의 비JSON 텍스트 제거
      .trim()
    
    try {
      return JSON.parse(jsonText)
    } catch (secondError) {
      console.error('[AI Response Parse Error]')
      console.error('Original response:', textPayload)
      console.error('Extracted JSON:', jsonText)
      console.error('First error:', firstError.message)
      console.error('Second error:', secondError.message)
      throw new Error(`AI 응답 JSON 파싱 실패: ${secondError.message}`)
    }
  }
}

/**
 * 검색에 부적합한 단어 목록 (조사, 접속사 등)
 */
const INVALID_KEYWORDS = [
  '의', '을', '를', '이', '가', '에', '에서', '로', '으로', '와', '과', '도', '만', '부터', '까지',
  '은', '는', '에게', '께', '한테', '더', '또', '그리고', '또한', '또는', '그런데', '하지만',
  '근처', '주변', '주위', '주변에', '근처에', '주위에', '주변의', '근처의', '주위의',
  '좋은', '좋은', '추천', '추천하는', '추천된', '맛있는', '맛있는', '맛있고', '맛있게',
  '있어', '있는', '있고', '있게', '있을', '있을까', '있나요', '있어요', '있습니다',
  '해주세요', '해줘', '해주시', '해주', '해', '주세요', '줘', '주시',
  '알려주세요', '알려줘', '알려', '알고', '알', '찾아', '찾아주', '찾아줘', '찾아주세요',
  '보고', '보고싶', '보고싶어', '보고싶은', '보고싶어요', '보고싶습니다',
  '궁금', '궁금해', '궁금하', '궁금한', '궁금해요', '궁금합니다',
  '어디', '어디에', '어디서', '어디에서', '어디가', '어디를',
  '무엇', '무엇을', '무엇이', '무엇인', '무엇인가', '무엇인지',
  '어떤', '어떤게', '어떤것', '어떤거', '어떤지', '어떻게',
  '이거', '이것', '이게', '이건', '이거를', '이것을',
  '그거', '그것', '그게', '그건', '그거를', '그것을',
  '저거', '저것', '저게', '저건', '저거를', '저것을',
  '데이트', '데이트하기', '데이트하', '데이트할', '데이트하는', '데이트하기 좋은',
  '좋은', '좋은데', '좋아', '좋아요', '좋아하는', '좋아해', '좋아해요',
  '가고', '가고싶', '가고싶어', '가고싶은', '가고싶어요', '가고싶습니다',
  '가볼', '가볼만', '가볼만한', '가볼만해', '가볼만해요',
  '다녀', '다녀온', '다녀왔', '다녀왔어', '다녀왔어요', '다녀왔습니다',
  '방문', '방문한', '방문했', '방문했어', '방문했어요', '방문했습니다',
  '예', '네', '응', '그래', '그렇', '그렇네', '그렇네요',
  '아니', '아니요', '아니야', '아닌', '아닙니다',
  '있다', '있어', '있는', '있고', '있게', '있을', '있을까', '있나요', '있어요', '있습니다',
  '없다', '없어', '없는', '없고', '없게', '없을', '없을까', '없나요', '없어요', '없습니다'
]

/**
 * 검색에 적합한 키워드인지 확인
 */
const isValidSearchKeyword = (keyword) => {
  if (!keyword || typeof keyword !== 'string') return false
  
  const trimmed = keyword.trim()
  
  // 빈 문자열 체크
  if (trimmed.length === 0) return false
  
  // 너무 짧은 단어 제외 (1-2자, 단 지역명은 예외)
  if (trimmed.length <= 2) {
    // 주요 지역명은 허용 (예: 역, 동, 구 등)
    const shortLocationPatterns = /^(역|동|구|시|군|면|리|가|로|길)$/
    if (!shortLocationPatterns.test(trimmed)) {
      return false
    }
  }
  
  // 숫자만 있는 경우 제외
  if (/^\d+$/.test(trimmed)) return false
  
  // 특수문자만 있는 경우 제외
  if (/^[^\w가-힣]+$/.test(trimmed)) return false
  
  // 검색에 부적합한 단어 목록에 포함된 경우 제외
  if (INVALID_KEYWORDS.includes(trimmed)) return false
  
  // 부적합한 단어로 시작하거나 끝나는 경우 제외
  const invalidPrefixes = ['의', '을', '를', '이', '가', '에', '에서', '로', '으로', '와', '과', '도', '만']
  const invalidSuffixes = ['의', '을', '를', '이', '가', '에', '에서', '로', '으로', '와', '과', '도', '만', '해주세요', '해줘', '주세요', '줘']
  
  for (const prefix of invalidPrefixes) {
    if (trimmed.startsWith(prefix + ' ')) return false
  }
  
  for (const suffix of invalidSuffixes) {
    if (trimmed.endsWith(' ' + suffix)) return false
  }
  
  return true
}

/**
 * 키워드 정제 및 필터링
 */
const refineKeywords = (rawKeywords, locationName = null) => {
  if (!Array.isArray(rawKeywords)) return []
  
  // 1단계: 기본 정제 (공백 제거, 빈 문자열 제거)
  let keywords = rawKeywords
    .map((keyword) => String(keyword).trim())
    .filter((keyword) => keyword.length > 0)
  
  // 2단계: 검색에 적합한 키워드만 필터링
  keywords = keywords.filter(isValidSearchKeyword)
  
  // 3단계: 중복 제거
  keywords = [...new Set(keywords)]
  
  // 4단계: 지역명이 키워드에 포함되어 있지 않으면 추가 (검색에 유용)
  if (locationName && !keywords.includes(locationName)) {
    const locationNameTrimmed = String(locationName).trim()
    if (isValidSearchKeyword(locationNameTrimmed)) {
      keywords.unshift(locationNameTrimmed) // 맨 앞에 추가
    }
  }
  
  // 5단계: "맛집"이 없으면 추가 (기본 검색어)
  if (!keywords.includes('맛집') && !keywords.some(k => k.includes('맛집'))) {
    keywords.push('맛집')
  }
  
  return keywords
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

  // 키워드 정제 및 필터링
  const rawKeywords = Array.isArray(result.keywords) ? result.keywords : []
  const keywords = refineKeywords(rawKeywords, location?.name)

  if (keywords.length === 0) {
    throw new Error('AI가 검색 키워드를 제공하지 않았습니다.')
  }

  console.log('[Keyword Refinement]')
  console.log('[Keyword Refinement] Raw keywords:', rawKeywords)
  console.log('[Keyword Refinement] Refined keywords:', keywords)

  return { location, keywords }
}

/**
 * AI를 사용하여 쿼리에서 정보 추출
 */
const extractInfoWithAI = async (aiBinding, query) => {
  // 먼저 간단한 패턴 매칭으로 지역명 추출 시도
  const extractedLocation = extractLocationFromQuery(query)
  
  const messages = buildPrompt(query)
  
  // AI 응답 로깅
  console.log('[AI Request] Query:', query)
  if (extractedLocation) {
    console.log('[AI Request] Extracted location from query:', extractedLocation)
  }
  
  const aiResponse = await aiBinding.run(MODEL_NAME, { messages })
  
  // 원본 응답 로깅
  const rawResponseText = aiResponse?.response || aiResponse?.output_text || ''
  console.log('[AI Response Raw]', rawResponseText.substring(0, 500)) // 처음 500자만 로깅
  
  const parsed = parseAiResponse(aiResponse)
  
  // 파싱된 결과 로깅
  console.log('[AI Response Parsed]', JSON.stringify(parsed, null, 2))
  
  // 추출된 지역명이 있고 AI 결과의 지역명이 이상하면 보정
  if (extractedLocation && parsed?.location?.name) {
    const aiLocationName = String(parsed.location.name).trim()
    const extractedLocationName = extractedLocation.name
    
    // AI가 지역명을 잘못 추출했을 가능성이 있으면 보정
    if (!aiLocationName.includes(extractedLocationName) && 
        !extractedLocationName.includes(aiLocationName)) {
      console.log('[AI Location Correction] AI가 추출한 지역명이 이상합니다. 보정합니다.')
      console.log('[AI Location Correction] AI:', aiLocationName)
      console.log('[AI Location Correction] Extracted:', extractedLocationName)
      
      // 추출된 지역명으로 대체
      parsed.location = {
        name: extractedLocationName,
        latitude: extractedLocation.latitude,
        longitude: extractedLocation.longitude
      }
    } else if (!parsed.location.latitude || !parsed.location.longitude) {
      // 좌표가 없으면 추출된 좌표 사용
      parsed.location.latitude = extractedLocation.latitude
      parsed.location.longitude = extractedLocation.longitude
    }
  }
  
  const validated = validateAiResult(parsed)
  
  // 검증된 결과 로깅
  console.log('[AI Response Validated]', JSON.stringify(validated, null, 2))
  
  return validated
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
        address: item.road_address_name || item.address_name || '',
        phone: item.phone || '',
        category_name: item.category_name || ''
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
  console.log('[kakao-search] 응답:', JSON.stringify(data, null, 2))
  
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
    console.log('[parse-query] AI 결과:', JSON.stringify(aiResult, null, 2))

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
