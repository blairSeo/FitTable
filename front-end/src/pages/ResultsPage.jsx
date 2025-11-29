import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useKakaoLoader } from "react-kakao-maps-sdk";
import MapSection from "../components/MapSection";
import { DEFAULT_CENTER } from "../data/mockData";
import { searchRestaurants } from "../utils/api";
import { ArrowLeft } from "lucide-react";

const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_MAP_API_KEY || "YOUR_KAKAO_MAP_API_KEY";

const ResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 카카오맵 SDK 초기화
  const [mapLoading, mapError] = useKakaoLoader({
    appkey: KAKAO_APP_KEY
  });

  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // URL 파라미터에서 검색 조건 가져오기
  useEffect(() => {
    const query = searchParams.get("query") || "";
    const currentLatParam = searchParams.get("currentLat");
    const currentLngParam = searchParams.get("currentLng");
    
    const currentLat = currentLatParam ? parseFloat(currentLatParam) : null;
    const currentLng = currentLngParam ? parseFloat(currentLngParam) : null;

    // 검색어가 없고 현재 위치도 없으면 초기화
    if (!query && (!currentLat || !currentLng || isNaN(currentLat) || isNaN(currentLng))) {
      setRestaurants([]);
      setSelectedRestaurant(null);
      setError(null);
      setMapCenter(DEFAULT_CENTER);
      setCurrentPage(1);
      setHasMore(false);
      setTotal(0);
      return;
    }

    // API 호출
    const fetchRestaurants = async () => {
      setIsLoading(true);
      setError(null);
      setCurrentPage(1);

      try {
        const result = await searchRestaurants(query || "", currentLat, currentLng, 1);
        setRestaurants(result.items);
        setHasMore(result.hasMore);
        setTotal(result.total);
        
        if (result.items.length > 0) {
          setSelectedRestaurant(result.items[0]);
          // 검색 결과의 중심 좌표 계산
          const avgLat = result.items.reduce((sum, r) => sum + r.lat, 0) / result.items.length;
          const avgLng = result.items.reduce((sum, r) => sum + r.lng, 0) / result.items.length;
          setMapCenter({ lat: avgLat, lng: avgLng });
        } else {
          setSelectedRestaurant(null);
          setMapCenter(DEFAULT_CENTER);
        }
      } catch (err) {
        console.error("맛집 검색 오류:", err);
        setError(err.message || "맛집 검색 중 오류가 발생했습니다.");
        setRestaurants([]);
        setSelectedRestaurant(null);
        setHasMore(false);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, [searchParams]);

  // 카드 클릭 핸들러
  const handleCardClick = (restaurant) => {
    setSelectedRestaurant(restaurant);
    // 선택된 레스토랑으로 지도 중심 이동
    setMapCenter({ lat: restaurant.lat, lng: restaurant.lng });
  };

  // 마커 클릭 핸들러
  const handleMarkerClick = (restaurant) => {
    setSelectedRestaurant(restaurant);
    // 선택된 레스토랑으로 지도 중심 이동
    setMapCenter({ lat: restaurant.lat, lng: restaurant.lng });
  };

  // 더보기 버튼 클릭 핸들러
  const handleLoadMore = async () => {
    const query = searchParams.get("query") || "";
    const currentLatParam = searchParams.get("currentLat");
    const currentLngParam = searchParams.get("currentLng");
    
    const currentLat = currentLatParam ? parseFloat(currentLatParam) : null;
    const currentLng = currentLngParam ? parseFloat(currentLngParam) : null;

    if ((!query && (!currentLat || !currentLng)) || !hasMore || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const result = await searchRestaurants(query || "", currentLat, currentLng, nextPage);
      
      setRestaurants((prev) => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setCurrentPage(nextPage);
    } catch (err) {
      console.error("더보기 로드 오류:", err);
      setError(err.message || "더보기 로드 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden bg-gray-50">
      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        {/* 왼쪽 검색 결과 패널 */}
        <div className="w-full md:w-96 lg:w-[420px] bg-white shadow-xl overflow-y-auto z-40 h-1/2 md:h-full flex flex-col">
          {/* 헤더 (뒤로가기 버튼 + 검색 결과 제목) */}
          <div className="sticky top-0 bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 px-4 py-4 z-10 backdrop-blur-sm bg-white/95">
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => navigate("/")}
                className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 text-gray-700 font-medium text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">돌아가기</span>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">검색 결과</h2>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">{restaurants.length}개</span>
            </div>
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600 font-medium text-lg">검색 중...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">⚠️</div>
                <p className="text-gray-600 font-medium text-lg mb-2">오류가 발생했습니다</p>
                <p className="text-gray-400 text-sm mb-6">{error}</p>
                <button onClick={() => navigate("/")} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 shadow-md hover:shadow-lg">
                  다시 검색하기
                </button>
              </div>
            ) : restaurants.length > 0 ? (
              <>
                <div className="space-y-4">
                  {restaurants.map((restaurant, index) => (
                    <div
                      key={`${restaurant.name}-${index}`}
                      onClick={() => handleCardClick(restaurant)}
                      className={`bg-white rounded-2xl shadow-sm hover:shadow-xl overflow-hidden cursor-pointer transition-all duration-300 border-2 transform hover:-translate-y-1 ${
                        selectedRestaurant?.name === restaurant.name && selectedRestaurant?.lat === restaurant.lat && selectedRestaurant?.lng === restaurant.lng
                          ? "border-blue-500 shadow-blue-100 shadow-lg ring-2 ring-blue-200"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      {/* 카드 내용 */}
                      <div className="p-5">
                        {/* 이름 */}
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl font-bold text-gray-900 flex-1 pr-2">{restaurant.name}</h3>
                          {selectedRestaurant?.name === restaurant.name && selectedRestaurant?.lat === restaurant.lat && selectedRestaurant?.lng === restaurant.lng && (
                            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">선택됨</div>
                          )}
                        </div>

                        {/* 주소 */}
                        <div className="pt-3 border-t border-gray-100">
                          <div className="flex items-start gap-2">
                            <span className="text-gray-400 text-sm">📍</span>
                            <p className="text-sm text-gray-600 leading-relaxed flex-1">{restaurant.address}</p>
                          </div>
                        </div>
                      </div>
                    </div>
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
                <p className="text-gray-600 font-medium text-lg mb-2">검색 결과가 없습니다</p>
                <p className="text-gray-400 text-sm mb-6">다른 검색 조건으로 시도해보세요</p>
                <button onClick={() => navigate("/")} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 shadow-md hover:shadow-lg">
                  검색 조건 변경하기
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽 지도 영역 (전체 화면) */}
        <div className="flex-1 relative">
          {mapLoading && (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <div className="text-gray-600">지도를 불러오는 중...</div>
            </div>
          )}
          {mapError && (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <div className="text-red-600">지도 로드 실패: {mapError.message || "카카오맵 API 키를 확인해주세요."}</div>
            </div>
          )}
          {!mapLoading && !mapError && (
            <MapSection 
              center={mapCenter} 
              restaurants={restaurants}
              selectedRestaurant={selectedRestaurant}
              onMarkerClick={handleMarkerClick}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
