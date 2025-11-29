import { useState, useEffect } from "react"
import { X, Moon, Sun, Monitor } from "lucide-react"
import { 
  getStoredTheme, 
  updateTheme, 
  THEME_SYSTEM, 
  THEME_DARK, 
  THEME_LIGHT 
} from "../utils/theme"

/**
 * 설정 모달 컴포넌트
 */
const SettingsModal = ({ isOpen, onClose }) => {
  const [selectedTheme, setSelectedTheme] = useState(THEME_SYSTEM)

  // 모달이 열릴 때 저장된 테마 불러오기
  useEffect(() => {
    if (isOpen) {
      setSelectedTheme(getStoredTheme())
    }
  }, [isOpen])

  /**
   * 테마 변경 핸들러
   */
  const handleThemeChange = (theme) => {
    setSelectedTheme(theme)
    updateTheme(theme)
  }

  if (!isOpen) return null

  /**
   * 테마 옵션 버튼 렌더링
   */
  const ThemeOption = ({ theme, icon: Icon, title, description }) => {
    const isSelected = selectedTheme === theme
    
    return (
      <button
        onClick={() => handleThemeChange(theme)}
        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
          isSelected
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-700"
        }`}
      >
        <div className={`p-2 rounded-lg ${
          isSelected
            ? "bg-blue-500 text-white"
            : "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 text-left">
          <div className="font-semibold text-gray-900 dark:text-white">
            {title}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </div>
        </div>
        {isSelected && (
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white"></div>
          </div>
        )}
      </button>
    )
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            설정
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* 화면 모드 선택 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            화면 모드
          </h3>
          
          <div className="space-y-2">
            <ThemeOption
              theme={THEME_SYSTEM}
              icon={Monitor}
              title="시스템 설정"
              description="시스템 설정을 따릅니다"
            />
            <ThemeOption
              theme={THEME_DARK}
              icon={Moon}
              title="어두운 모드"
              description="항상 어두운 테마를 사용합니다"
            />
            <ThemeOption
              theme={THEME_LIGHT}
              icon={Sun}
              title="밝은 모드"
              description="항상 밝은 테마를 사용합니다"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
