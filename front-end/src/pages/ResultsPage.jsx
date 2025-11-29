import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useKakaoLoader } from "react-kakao-maps-sdk"
import MapSection from "../components/MapSection"
import { DEFAULT_CENTER } from "../data/mockData"
import { searchRestaurants } from "../utils/api"
import { ArrowLeft } from "lucide-react"

const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_MAP_API_KEY || "YOUR_KAKAO_MAP_API_KEY"

/**
 * 검색 결과 페이지 컴포넌트
 */
const ResultsPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // 카카오맵 SDK 초기화
  const [mapLoading, mapError] = useKakaoLoader({
    appkey: KAKAO_APP_KEY
  })

  // 상태 관리
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  /**
   * URL 파라미터에서 검색 조건 파싱
   */
  const parseSearchParams = () => {
    const query = searchParams.get("query") || ""
    const currentLatParam = searchParams.get("currentLat")
    const currentLngParam = searchParams.get("currentLng")
    
    const currentLat = currentLatParam ? parseFloat(currentLatParam) : null
    const currentLng = currentLngParam ? parseFloat(currentLngParam) : null
    
    const hasValidLocation = 
      currentLat !== null && 
      currentLng !== null && 
      !isNaN(currentLat) && 
      !isNaN(currentLng)

    return { query, currentLat, currentLng, hasValidLocation }
  }

  /**
   * 검색 결과 초기화
   */
  const resetResults = () => {
    setRestaurants([])
    setSelectedRestaurant(null)
    setError(null)
    setMapCenter(DEFAULT_CENTER)
    setCurrentPage(1)
    setHasMore(false)
    setTotal(0)
  }

  /**
   * 검색 결과의 중심 좌표 계산
   */
  const calculateMapCenter = (items) => {
    if (items.length === 0) return DEFAULT_CENTER
    
    const avgLat = items.reduce((sum, r) => sum + r.lat, 0) / items.length
    const avgLng = items.reduce((sum, r) => sum + r.lng, 0) / items.length
    
    return { lat: avgLat, lng: avgLng }
  }

  /**
   * 맛집 검색 API 호출
   */
  const fetchRestaurants = async (page = 1) => {
    const { query, currentLat, currentLng, hasValidLocation } = parseSearchParams()

    // 검색 조건이 없으면 초기화
    if (!query && !hasValidLocation) {
      resetResults()
      return
    }

    // 로딩 상태 설정
    if (page === 1) {
      setIsLoading(true)
      setError(null)
      setCurrentPage(1)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const result = await searchRestaurants(query, currentLat, currentLng, page)
      
      if (page === 1) {
        setRestaurants(result.items)
      } else {
        setRestaurants((prev) => [...prev, ...result.items])
      }
      
      setHasMore(result.hasMore)
      setTotal(result.total)
      setCurrentPage(result.page)
      
      // 검색 결과가 있으면 첫 번째 항목 선택 및 지도 중심 설정
      if (result.items.length > 0) {
        if (page === 1) {
          setSelectedRestaurant(result.items[0])
          setMapCenter(calculateMapCenter(result.items))
        }
      } else if (page === 1) {
        setSelectedRestaurant(null)
        setMapCenter(DEFAULT_CENTER)
      }
    } catch (err) {
      console.error("[ResultsPage] 맛집 검색 오류:", err)
      setError(err.message || "맛집 검색 중 오류가 발생했습니다.")
      
      if (page === 1) {
        resetResults()
      }
    } finally {
      if (page === 1) {
        setIsLoading(false)
      } else {
        setIsLoadingMore(false)
      }
    }
  }

  // URL 파라미터 변경 시 검색 실행
  useEffect(() => {
    fetchRestaurants(1)
  }, [searchParams])

  /**
   * 레스토랑 선택 핸들러
   */
  const handleRestaurantSelect = (restaurant) => {
    setSelectedRestaurant(restaurant)
    setMapCenter({ lat: restaurant.lat, lng: restaurant.lng })
  }

  /**
   * 더보기 버튼 클릭 핸들러
   */
  const handleLoadMore = () => {
    if (!hasMore || isLoadingMore) return
    fetchRestaurants(currentPage + 1)
  }

  /**
   * 레스토랑 카드 렌더링
   */
  const RestaurantCard = ({ restaurant, index }) => {
    const isSelected = 
      selectedRestaurant?.name === restaurant.name &&
      selectedRestaurant?.lat === restaurant.lat &&
      selectedRestaurant?.lng === restaurant.lng

    return (
      <div
        key={`${restaurant.name}-${index}`}
        onClick={() => handleRestaurantSelect(restaurant)}
        className={`bg-white dark:bg-gray-700 rounded-2xl shadow-sm hover:shadow-xl overflow-hidden cursor-pointer transition-all duration-300 border-2 transform hover:-translate-y-1 ${
          isSelected
            ? "border-blue-500 shadow-blue-100 dark:shadow-blue-900/20 shadow-lg ring-2 ring-blue-200 dark:ring-blue-800"
            : "border-gray-100 dark:border-gray-600 hover:border-gray-200 dark:hover:border-gray-500"
        }`}
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex-1 pr-2">
              {restaurant.name}
            </h3>
            {isSelected && (
              <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                선택됨
              </div>
            )}
          </div>

          {/* 카테고리 */}
          {restaurant.category_name && (
            <div className="mb-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                {restaurant.category_name}
              </span>
            </div>
          )}

          <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-600">
            {/* 주소 */}
            <div className="flex items-start gap-2">
              <span className="text-gray-400 dark:text-gray-500 text-sm">📍</span>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed flex-1">
                {restaurant.address}
              </p>
            </div>

            {/* 전화번호 */}
            {restaurant.phone && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 dark:text-gray-500 text-sm">📞</span>
                <a
                  href={`tel:${restaurant.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                >
                  {restaurant.phone}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col relative overflow-hidden bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        {/* 검색 결과 패널 */}
        <div className="w-full md:w-96 lg:w-[420px] bg-white dark:bg-gray-800 shadow-xl overflow-y-auto z-40 h-1/2 md:h-full flex flex-col">
          {/* 헤더 */}
          <div className="sticky top-0 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-700 px-4 py-4 z-10 backdrop-blur-sm bg-white/95 dark:bg-gray-800/95">
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => navigate("/")}
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-2 rounded-xl shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">돌아가기</span>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                검색 결과
              </h2>
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-semibold">
                {total}개
              </span>
            </div>
          </div>

          {/* 검색 결과 목록 */}
          <div className="p-4">
            {isLoading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">
                  검색 중...
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">⚠️</div>
                <p className="text-gray-600 dark:text-gray-400 font-medium text-lg mb-2">
                  오류가 발생했습니다
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
                  {error}
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  다시 검색하기
                </button>
              </div>
            ) : restaurants.length > 0 ? (
              <>
                <div className="space-y-4">
                  {restaurants.map((restaurant, index) => (
                    <RestaurantCard
                      key={`${restaurant.name}-${restaurant.lat}-${restaurant.lng}-${index}`}
                      restaurant={restaurant}
                      index={index}
                    />
                  ))}
                </div>
                
                {/* 더보기 버튼 */}
                {hasMore && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-medium transition-colors duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      {isLoadingMore ? (
                        <>
                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>로딩 중...</span>
                        </>
                      ) : (
                        <span>더보기</span>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-600 dark:text-gray-400 font-medium text-lg mb-2">
                  검색 결과가 없습니다
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
                  다른 검색 조건으로 시도해보세요
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  검색 조건 변경하기
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 지도 영역 */}
        <div className="flex-1 relative">
          {mapLoading && (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800">
              <div className="text-gray-600 dark:text-gray-400">
                지도를 불러오는 중...
              </div>
            </div>
          )}
          {mapError && (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800">
              <div className="text-red-600 dark:text-red-400">
                지도 로드 실패: {mapError.message || "카카오맵 API 키를 확인해주세요."}
              </div>
            </div>
          )}
          {!mapLoading && !mapError && (
            <MapSection 
              center={mapCenter} 
              restaurants={restaurants}
              selectedRestaurant={selectedRestaurant}
              onMarkerClick={handleRestaurantSelect}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default ResultsPage
