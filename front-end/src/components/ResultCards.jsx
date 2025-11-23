import { Star } from "lucide-react";

const ResultCards = ({ restaurants, selectedRestaurant, onCardClick }) => {
  return (
    <div className="w-full bg-white">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">추천 맛집 ({restaurants.length})</h2>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-4 px-4 py-4" style={{ minWidth: "max-content" }}>
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              onClick={() => onCardClick(restaurant)}
              className={`flex-shrink-0 w-[280px] bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform hover:scale-105 ${
                selectedRestaurant?.id === restaurant.id ? "ring-2 ring-blue-500" : ""
              }`}
            >
              {/* 이미지 */}
              <div className="w-full h-[200px] bg-gray-200 overflow-hidden">
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/280x200?text=No+Image";
                  }}
                />
              </div>

              {/* 카드 내용 */}
              <div className="p-4">
                {/* 이름 & 평점 */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900 truncate">{restaurant.name}</h3>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-semibold">{restaurant.rating}</span>
                  </div>
                </div>

                {/* 태그 */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {restaurant.tags.map((tag, index) => (
                    <span key={index} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* AI 추천 코멘트 */}
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    <span className="font-semibold text-yellow-800">AI 추천:</span> {restaurant.aiComment}
                  </p>
                </div>

                {/* 가격 정보 */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    1인당 <span className="font-semibold text-gray-900">{new Intl.NumberFormat("ko-KR").format(restaurant.pricePerPerson)}원</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultCards;
