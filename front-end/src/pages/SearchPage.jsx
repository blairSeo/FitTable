import { useState } from "react"
import { useNavigate } from "react-router-dom"
import HeroSection from "../components/HeroSection"
import SettingsModal from "../components/SettingsModal"
import VideoModal from "../components/VideoModal"
import { Settings } from "lucide-react"

/**
 * 검색 페이지 컴포넌트
 */
const SearchPage = () => {
  const navigate = useNavigate()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isVideoOpen, setIsVideoOpen] = useState(false)
  
  const VIDEO_URL = "https://sangmin.v4.wecandeo.com/play/video/v?key=89dFFlYX1EtfgPzG6Hu3R7QTJuN2InVWUBmMLo4gLqUie&urlKey=default"

  /**
   * 검색 실행 핸들러
   */
  const handleSearch = (searchParams) => {
    const params = new URLSearchParams({
      query: searchParams.query || ""
    })

    // 현재 위치가 있으면 URL 파라미터에 추가
    if (searchParams.currentLat && searchParams.currentLng) {
      params.append("currentLat", searchParams.currentLat.toString())
      params.append("currentLng", searchParams.currentLng.toString())
    }

    navigate(`/results?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative">
      <HeroSection 
        onSearch={handleSearch} 
        onLogoClick={() => setIsVideoOpen(true)}
      />
      
      {/* 설정 버튼 */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 border-2 border-gray-200 dark:border-gray-700 z-50"
        aria-label="설정"
      >
        <Settings className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      </button>

      {/* 설정 모달 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* 비디오 모달 */}
      <VideoModal
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        videoUrl={VIDEO_URL}
      />
    </div>
  )
}

export default SearchPage
