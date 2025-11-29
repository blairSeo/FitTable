import { useState, useRef, useEffect } from "react"
import { MapPin, Search, X } from "lucide-react"

/**
 * 히어로 섹션 컴포넌트 (검색 입력)
 */
const HeroSection = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const searchInputRef = useRef(null)

  // 페이지 로드 시 자동 포커스
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus()
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  /**
   * 현재 위치 가져오기
   */
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("위치 정보를 사용할 수 없습니다."))
        return
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }),
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  }

  /**
   * 검색 실행
   */
  const handleSearch = async () => {
    let currentLat = null
    let currentLng = null

    // 검색어가 없으면 현재 위치 가져오기
    if (!searchQuery.trim()) {
      try {
        const location = await getCurrentLocation()
        currentLat = location.lat
        currentLng = location.lng
      } catch (error) {
        console.error("현재 위치 가져오기 실패:", error)
        // 위치를 가져오지 못해도 빈 검색어로 진행
      }
    }

    if (onSearch) {
      onSearch({
        query: searchQuery,
        currentLat,
        currentLng
      })
    }
  }

  /**
   * Enter 키 입력 처리
   */
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  /**
   * 검색어 클리어
   */
  const handleClear = () => {
    setSearchQuery("")
    searchInputRef.current?.focus()
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 py-8 md:py-12">
      {/* 로고 */}
      <div className="mb-8 md:mb-12">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          FitTable
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mt-2 text-sm md:text-base">
          AI 기반 맛집 추천 서비스
        </p>
      </div>

      {/* 검색창 */}
      <div className="w-full max-w-2xl mb-8">
        <div className={`relative w-full transition-all duration-200 rounded-3xl ${
          isFocused ? "shadow-xl scale-[1.02]" : "shadow-lg hover:shadow-xl"
        }`}>
          <div
            className={`flex items-center w-full px-5 py-4 bg-white dark:bg-gray-800 rounded-3xl border-2 transition-all duration-200 ${
              isFocused
                ? "border-blue-500 shadow-blue-100 dark:shadow-blue-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
            
            <input
              ref={searchInputRef}
              type="text"
              placeholder="강남역 데이트하기 좋은 파스타집"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="flex-1 text-base md:text-lg bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />

            {searchQuery && (
              <button
                onClick={handleClear}
                className="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 검색 버튼 */}
      <div className="w-full max-w-2xl">
        <button
          onClick={handleSearch}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-200 hover:shadow-xl flex items-center justify-center gap-3 text-base"
        >
          <MapPin className="w-5 h-5" />
          맛집 검색
        </button>
      </div>
    </div>
  )
}

export default HeroSection
