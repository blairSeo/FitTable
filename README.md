# FitTable - 맛집 추천 서비스

맛집 추천 서비스의 Front-End 프로젝트입니다.

## 기술 스택

- **Framework**: React (Vite 기반)
- **Language**: JavaScript (.jsx)
- **Styling**: Tailwind CSS
- **Map Library**: `react-kakao-maps-sdk`
- **Icons**: `lucide-react`

## 프로젝트 구조

```
FitTable/
├── src/
│   ├── components/
│   │   ├── HeroSection.jsx      # 검색 및 예산 필터 섹션
│   │   ├── MapSection.jsx       # 카카오맵 표시
│   │   └── ResultCards.jsx      # 맛집 카드 리스트
│   ├── data/
│   │   └── mockData.js          # Mock 데이터
│   ├── App.jsx                  # 메인 앱 컴포넌트
│   ├── main.jsx                 # 진입점
│   └── index.css                # 전역 스타일
├── index.html
├── package.json
└── README.md
```

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 카카오맵 API 키 설정

`.env` 파일을 생성하고 카카오맵 API 키를 설정하세요:

```bash
VITE_KAKAO_MAP_API_KEY=your_kakao_map_api_key_here
```

카카오맵 API 키 발급:
1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. 애플리케이션 생성
3. JavaScript 키 복사
4. 플랫폼 설정에서 도메인 등록 (localhost:5173 등)

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 4. 빌드

```bash
npm run build
```

## 주요 기능

### 1. Hero & Search Section
- 로고: "FitTable"
- 자연어 검색창: "강남역 데이트하기 좋은 파스타집" 같은 질문 입력
- 예산 필터:
  - 토글 버튼: [1인당 예산] vs [총 예산]
  - 금액 입력: 숫자 입력 (자동으로 '원' 단위 표시)
  - 인원 입력: '총 예산' 모드일 때만 활성화
- 내 주변 찾기 버튼: 브라우저 geolocation API 사용

### 2. Map Section
- 카카오맵 표시
- 초기 좌표: 서울 강남역 (37.498095, 127.027610)
- Mock Data 맛집 위치에 마커 표시
- 선택된 마커는 빨간색, 미선택은 기본 색상

### 3. Result Cards
- 가로 스크롤 가능한 카드 리스트
- 카드 정보:
  - 대표 이미지 (Unsplash 랜덤 이미지)
  - 식당 이름 & 평점 (⭐️ 네이버 지도 스타일)
  - 태그 (#인스타핫플 #데이트 등)
  - AI 추천 코멘트 (강조 표시)

## Mock Data

현재 백엔드 연동 전이므로 `src/data/mockData.js`에 하드코딩된 더미 데이터를 사용합니다.

맛집 데이터 구조:
```javascript
{
  id: number,
  name: string,
  rating: number,
  tags: string[],
  aiComment: string,
  lat: number,
  lng: number,
  image: string,
  pricePerPerson: number,
  address: string
}
```

## 개발 참고사항

- 모바일 퍼스트 디자인 적용
- 모든 컴포넌트는 `.jsx` 확장자 사용 (TypeScript 사용 안 함)
- Tailwind CSS로 스타일링
- 반응형 디자인 고려

## 라이선스

MIT

