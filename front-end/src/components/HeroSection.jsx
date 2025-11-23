import { useState, useRef, useEffect } from "react";
import { MapPin, Search, X, Settings, X as XIcon } from "lucide-react";

const HeroSection = ({ onSearch, onLocationClick, budget, setBudget, budgetType, setBudgetType, numberOfPeople, setNumberOfPeople }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    // 페이지 로드 시 자동 포커스
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleSearch = () => {
    if (onSearch) {
      onSearch({
        query: searchQuery,
        budget,
        budgetType,
        numberOfPeople: budgetType === "total" ? numberOfPeople : 1
      });
    }
  };

  const handleLocationSearch = () => {
    // 위치 가져오기 후 검색 실행
    if (onLocationClick) {
      onLocationClick(() => {
        // 위치를 가져온 후 검색 실행
        handleSearch();
      });
    } else {
      // 위치 클릭 핸들러가 없으면 바로 검색 실행
      handleSearch();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  };

  const formatCurrency = (value) => {
    if (!value) return "";
    return new Intl.NumberFormat("ko-KR").format(value) + "원";
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 py-8 md:py-12">
      {/* Logo */}
      <div className="mb-8 md:mb-12">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">FitTable</h1>
        <p className="text-center text-gray-500 mt-2 text-sm md:text-base">AI 기반 맛집 추천 서비스</p>
      </div>

      {/* 구글 스타일 검색창 */}
      <div className="w-full max-w-2xl mb-8">
        <div className={`relative w-full transition-all duration-200 rounded-3xl ${isFocused ? "shadow-xl scale-[1.02]" : "shadow-lg hover:shadow-xl"}`}>
          <div
            className={`flex items-center w-full px-5 py-4 bg-white rounded-3xl border-2 transition-all duration-200 ${
              isFocused ? "border-blue-500 shadow-blue-100" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {/* 검색 아이콘 */}
            <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />

            {/* 검색 입력 필드 */}
            <input
              ref={searchInputRef}
              type="text"
              placeholder="강남역 데이트하기 좋은 파스타집"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="flex-1 text-base md:text-lg bg-transparent outline-none text-gray-900 placeholder-gray-400"
            />

            {/* 클리어 버튼 */}
            {searchQuery && (
              <button onClick={handleClear} className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 예산 설정 버튼 및 액션 버튼 */}
      <div className="w-full max-w-2xl space-y-4">
        {/* 예산 설정 버튼 */}
        <button
          onClick={() => setIsBudgetModalOpen(true)}
          className={`w-full py-3 px-6 rounded-2xl font-medium transition-all duration-200 ${
            budget ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-blue-200" : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-2 border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5" />
              <span className="font-semibold">예산 설정</span>
            </div>
            {budget && (
              <div className="text-right">
                <div className="text-sm font-bold">
                  {budgetType === "perPerson" ? "1인당" : "총"} {formatCurrency(budget)}
                </div>
                {budgetType === "total" && <div className="text-xs text-blue-600 mt-0.5">{numberOfPeople}인 기준</div>}
              </div>
            )}
          </div>
        </button>

        {/* 내 주변 맛집 찾기 버튼 */}
        <button
          onClick={handleLocationSearch}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-200 hover:shadow-xl flex items-center justify-center gap-3 text-base"
        >
          <MapPin className="w-5 h-5" />내 주변 맛집 찾기
        </button>
      </div>

      {/* 예산 설정 모달 */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setIsBudgetModalOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-xl font-bold text-gray-900">예산 설정</h2>
              <button onClick={() => setIsBudgetModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <XIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-6 space-y-6">
              {/* Toggle Button */}
              <div className="flex items-center justify-center bg-gray-50 rounded-2xl p-1.5">
                <button
                  onClick={() => setBudgetType("perPerson")}
                  className={`flex-1 py-3 px-6 rounded-xl text-sm font-medium transition-all duration-200 ${
                    budgetType === "perPerson" ? "bg-white text-blue-600 shadow-md font-semibold" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  1인당 예산
                </button>
                <button
                  onClick={() => setBudgetType("total")}
                  className={`flex-1 py-3 px-6 rounded-xl text-sm font-medium transition-all duration-200 ${
                    budgetType === "total" ? "bg-white text-blue-600 shadow-md font-semibold" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  총 예산
                </button>
              </div>

              {/* Budget Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{budgetType === "perPerson" ? "1인당 예산" : "총 예산"}</label>
                <input
                  type="number"
                  placeholder="예: 50,000"
                  step={1000}
                  value={budget || ""}
                  onChange={(e) => setBudget(e.target.value ? parseInt(e.target.value) : "")}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base"
                />
                {budget && (
                  <div className="mt-2">
                    <span className="text-lg font-bold text-blue-600">{formatCurrency(budget)}</span>
                  </div>
                )}
              </div>

              {/* Number of People (총 예산 모드일 때만) */}
              {budgetType === "total" && (
                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">인원 수</label>
                  <input
                    type="number"
                    placeholder="예: 2"
                    min="1"
                    value={numberOfPeople || ""}
                    onChange={(e) => setNumberOfPeople(e.target.value ? parseInt(e.target.value) : "")}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base"
                  />
                </div>
              )}

              {/* 모달 액션 버튼 */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setBudget("");
                    setNumberOfPeople(2);
                    setBudgetType("perPerson");
                  }}
                  className="flex-1 py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                >
                  초기화
                </button>
                <button
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all"
                >
                  적용
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroSection;
