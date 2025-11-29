// API 엔드포인트 URL (환경 변수 또는 기본값)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

/**
 * 맛집 검색 API 호출
 * @param {string} query - 검색어
 * @param {number} [currentLat] - 현재 위도 (선택)
 * @param {number} [currentLng] - 현재 경도 (선택)
 * @returns {Promise<Array>} 변환된 맛집 데이터 배열
 */
export const searchRestaurants = async (query, currentLat = null, currentLng = null) => {
  try {
    const requestBody = {
      query: query
    };

    // 현재 위치가 있으면 추가
    if (currentLat !== null && currentLng !== null && !isNaN(currentLat) && !isNaN(currentLng)) {
      requestBody.currentLat = currentLat;
      requestBody.currentLng = currentLng;
    }

    const apiUrl = `${API_BASE_URL}/api/parse-query`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      // 404 오류인 경우 특별 처리
      if (response.status === 404) {
        throw new Error(`API 엔드포인트를 찾을 수 없습니다. (${apiUrl})\n백엔드 서버가 실행 중인지 확인해주세요.`);
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API 요청 실패: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // API 응답의 items 배열 (이미 백엔드에서 mockData.js 구조로 변환됨)
    if (!Array.isArray(data.items)) {
      return [];
    }

    // 백엔드에서 이미 name, lat, lng, address 구조로 변환되어 있음
    return data.items;
  } catch (error) {
    console.error("맛집 검색 API 오류:", error);
    
    // 네트워크 오류인 경우
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`서버에 연결할 수 없습니다. (${API_BASE_URL})\n백엔드 서버가 실행 중인지 확인해주세요.`);
    }
    
    throw error;
  }
};

