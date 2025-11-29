/**
 * API 유틸리티
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787"
const API_ENDPOINT = `${API_BASE_URL}/api/parse-query`

/**
 * 맛집 검색 API 호출
 * @param {string} query - 검색어
 * @param {number|null} currentLat - 현재 위도 (선택)
 * @param {number|null} currentLng - 현재 경도 (선택)
 * @param {number} page - 페이지 번호 (기본값: 1)
 * @returns {Promise<{items: Array, hasMore: boolean, total: number, page: number}>}
 */
export const searchRestaurants = async (query, currentLat = null, currentLng = null, page = 1) => {
  try {
    // 요청 본문 구성
    const requestBody = {
      query: query || "",
      page: page
    }

    // 현재 위치가 유효하면 추가
    if (
      currentLat !== null && 
      currentLng !== null && 
      !isNaN(currentLat) && 
      !isNaN(currentLng)
    ) {
      requestBody.currentLat = currentLat
      requestBody.currentLng = currentLng
    }

    // API 호출
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    })

    // 에러 처리
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          `API 엔드포인트를 찾을 수 없습니다. (${API_ENDPOINT})\n` +
          `백엔드 서버가 실행 중인지 확인해주세요.`
        )
      }
      
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.error || 
        `API 요청 실패: ${response.status} ${response.statusText}`
      )
    }

    // 응답 데이터 파싱
    const data = await response.json()

    // 응답 검증
    if (!Array.isArray(data.items)) {
      return {
        items: [],
        hasMore: false,
        total: 0,
        page: page
      }
    }

    return {
      items: data.items,
      hasMore: data.hasMore || false,
      total: data.total || data.items.length,
      page: data.page || page
    }
  } catch (error) {
    console.error("[API] 맛집 검색 오류:", error)
    
    // 네트워크 오류 처리
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `서버에 연결할 수 없습니다. (${API_BASE_URL})\n` +
        `백엔드 서버가 실행 중인지 확인해주세요.`
      )
    }
    
    throw error
  }
}
