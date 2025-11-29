import { X } from "lucide-react"

/**
 * 비디오 모달 컴포넌트
 */
const VideoModal = ({ isOpen, onClose, videoUrl }) => {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none" 
      onClick={onClose}
    >
      <div 
        className="bg-black rounded-2xl shadow-2xl w-full max-w-5xl aspect-video relative transform transition-all pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 rounded-lg bg-gray-800/90 hover:bg-gray-700 text-white transition-colors z-10 shadow-lg"
          aria-label="닫기"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 비디오 iframe */}
        <div className="w-full h-full rounded-2xl overflow-hidden">
          <iframe
            src={videoUrl}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="FitTable 홍보 영상"
          />
        </div>
      </div>
    </div>
  )
}

export default VideoModal

