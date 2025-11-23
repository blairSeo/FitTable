// Mock Data for 맛집 추천 서비스
export const mockRestaurants = [
  {
    id: 1,
    name: "오마카세 테이블",
    rating: 4.5,
    tags: ["#인스타핫플", "#데이트", "#분위기깡패"],
    aiComment: "예산 5만 원으로 즐길 수 있는 최고의 오마카세입니다.",
    lat: 37.498095,
    lng: 127.02761,
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop",
    pricePerPerson: 50000,
    totalPrice: null,
    address: "서울 강남구 테헤란로 123"
  },
  {
    id: 2,
    name: "로맨틱 파스타하우스",
    rating: 4.3,
    tags: ["#데이트", "#이탈리안", "#분위기좋은"],
    aiComment: "강남역에서 가장 분위기 좋은 파스타 전문점입니다.",
    lat: 37.499095,
    lng: 127.02861,
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop",
    pricePerPerson: 35000,
    totalPrice: null,
    address: "서울 강남구 강남대로 456"
  },
  {
    id: 3,
    name: "한식당 미각",
    rating: 4.7,
    tags: ["#한식", "#가족모임", "#프리미엄"],
    aiComment: "트렌디한 한식 코스를 저렴한 가격에 즐길 수 있습니다.",
    lat: 37.497095,
    lng: 127.02661,
    image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=300&fit=crop",
    pricePerPerson: 40000,
    totalPrice: null,
    address: "서울 강남구 역삼동 789"
  },
  {
    id: 4,
    name: "스시바 토로",
    rating: 4.6,
    tags: ["#일식", "#프리미엄", "#오마카세"],
    aiComment: "합리적인 가격의 고급 일식 오마카세를 제공합니다.",
    lat: 37.500095,
    lng: 127.02961,
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop",
    pricePerPerson: 60000,
    totalPrice: null,
    address: "서울 강남구 논현로 321"
  },
  {
    id: 5,
    name: "브런치 카페 모닝",
    rating: 4.4,
    tags: ["#브런치", "#카페", "#인스타핫플"],
    aiComment: "아침부터 저녁까지 즐길 수 있는 감성 브런치 카페입니다.",
    lat: 37.496095,
    lng: 127.02561,
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop",
    pricePerPerson: 25000,
    totalPrice: null,
    address: "서울 강남구 테헤란로2길 654"
  },
  {
    id: 6,
    name: "스테이크 하우스",
    rating: 4.8,
    tags: ["#스테이크", "#데이트", "#프리미엄"],
    aiComment: "가성비 최고의 스테이크 하우스로 유명합니다.",
    lat: 37.501095,
    lng: 127.03061,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop",
    pricePerPerson: 75000,
    totalPrice: null,
    address: "서울 강남구 강남대로98길 147"
  }
];

// 초기 지도 중심 좌표 (서울 강남역)
export const DEFAULT_CENTER = {
  lat: 37.498095,
  lng: 127.02761
};
