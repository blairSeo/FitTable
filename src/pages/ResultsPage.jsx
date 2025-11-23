import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useKakaoLoader } from 'react-kakao-maps-sdk';
import MapSection from '../components/MapSection';
import ResultCards from '../components/ResultCards';
import { mockRestaurants, DEFAULT_CENTER } from '../data/mockData';
import { ArrowLeft } from 'lucide-react';

const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_MAP_API_KEY || 'YOUR_KAKAO_MAP_API_KEY';

const ResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // 카카오맵 SDK 초기화
  const [loading, error] = useKakaoLoader({
    appkey: KAKAO_APP_KEY,
  });

  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [center, setCenter] = useState(DEFAULT_CENTER);

  // URL 파라미터에서 검색 조건 가져오기
  useEffect(() => {
    const query = searchParams.get('query') || '';
    const budget = searchParams.get('budget') || '';
    const budgetType = searchParams.get('budgetType') || 'perPerson';
    const numberOfPeople = parseInt(searchParams.get('numberOfPeople') || '2');
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');

    // 위치 설정
    if (lat && lng) {
      setCenter({ lat, lng });
    }

    // 검색 실행
    let filtered = [...mockRestaurants];

    // 예산 필터링
    if (budget) {
      const budgetNum = parseInt(budget);
      if (budgetType === 'perPerson') {
        filtered = filtered.filter((r) => r.pricePerPerson <= budgetNum);
      } else {
        const maxPerPerson = Math.floor(budgetNum / numberOfPeople);
        filtered = filtered.filter((r) => r.pricePerPerson <= maxPerPerson);
      }
    }

    // 검색어 필터링
    if (query) {
      const queryLower = query.toLowerCase();
      filtered = filtered.filter((r) =>
        r.name.toLowerCase().includes(queryLower) ||
        r.tags.some((tag) => tag.toLowerCase().includes(queryLower)) ||
        r.aiComment.toLowerCase().includes(queryLower)
      );
    }

    setRestaurants(filtered);
    if (filtered.length > 0) {
      setSelectedRestaurant(filtered[0]);
      setCenter({ lat: filtered[0].lat, lng: filtered[0].lng });
    }
  }, [searchParams]);

  // 마커 클릭 핸들러
  const handleMarkerClick = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setCenter({ lat: restaurant.lat, lng: restaurant.lng });
  };

  // 카드 클릭 핸들러
  const handleCardClick = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setCenter({ lat: restaurant.lat, lng: restaurant.lng });
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
                onClick={() => navigate('/')}
                className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 text-gray-700 font-medium text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">돌아가기</span>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                검색 결과
              </h2>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                {restaurants.length}개
              </span>
            </div>
          </div>
          <div className="p-4">
            {restaurants.length > 0 ? (
              <div className="space-y-4">
                {restaurants.map((restaurant) => (
                  <div
                    key={restaurant.id}
                    onClick={() => handleCardClick(restaurant)}
                    className={`bg-white rounded-2xl shadow-sm hover:shadow-xl overflow-hidden cursor-pointer transition-all duration-300 border-2 transform hover:-translate-y-1 ${
                      selectedRestaurant?.id === restaurant.id
                        ? 'border-blue-500 shadow-blue-100 shadow-lg ring-2 ring-blue-200'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    {/* 이미지 */}
                    <div className="w-full h-52 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative">
                      <img
                        src={restaurant.image}
                        alt={restaurant.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                        }}
                      />
                      {selectedRestaurant?.id === restaurant.id && (
                        <div className="absolute top-3 right-3 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          선택됨
                        </div>
                      )}
                    </div>

                    {/* 카드 내용 */}
                    <div className="p-5">
                      {/* 이름 & 평점 */}
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-gray-900 flex-1 pr-2">
                          {restaurant.name}
                        </h3>
                        <div className="flex items-center gap-1 bg-yellow-50 px-2.5 py-1 rounded-full">
                          <span className="text-yellow-600 text-base font-bold">{restaurant.rating}</span>
                          <span className="text-yellow-500 text-lg">⭐</span>
                        </div>
                      </div>

                      {/* 태그 */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {restaurant.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors border border-blue-100"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* AI 추천 코멘트 */}
                      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 p-4 rounded-xl mb-4 shadow-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-600 font-bold text-sm">✨</span>
                          <p className="text-sm text-gray-800 leading-relaxed flex-1">
                            <span className="font-bold text-yellow-800">AI 추천:</span>{' '}
                            {restaurant.aiComment}
                          </p>
                        </div>
                      </div>

                      {/* 가격 정보 */}
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">1인당 예산</p>
                            <p className="text-lg font-bold text-gray-900">
                              {new Intl.NumberFormat('ko-KR').format(restaurant.pricePerPerson)}원
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400 truncate max-w-[120px]">
                              {restaurant.address}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-600 font-medium text-lg mb-2">검색 결과가 없습니다</p>
                <p className="text-gray-400 text-sm mb-6">다른 검색 조건으로 시도해보세요</p>
                <button
                  onClick={() => navigate('/')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  검색 조건 변경하기
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽 지도 영역 (전체 화면) */}
        <div className="flex-1 relative">
          {loading && (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <div className="text-gray-600">지도를 불러오는 중...</div>
            </div>
          )}
          {error && (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <div className="text-red-600">지도 로드 실패: {error.message || '카카오맵 API 키를 확인해주세요.'}</div>
            </div>
          )}
          {!loading && !error && (
            <MapSection
              restaurants={restaurants}
              selectedRestaurant={selectedRestaurant}
              onMarkerClick={handleMarkerClick}
              center={center}
              setCenter={setCenter}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;

