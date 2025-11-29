import { Map, MapMarker } from "react-kakao-maps-sdk"

/**
 * 지도 섹션 컴포넌트
 */
const MapSection = ({ 
  center, 
  restaurants = [], 
  selectedRestaurant = null, 
  onMarkerClick 
}) => {
  /**
   * 레스토랑이 선택되었는지 확인
   */
  const isRestaurantSelected = (restaurant) => {
    if (!selectedRestaurant) return false
    
    return (
      selectedRestaurant.name === restaurant.name &&
      selectedRestaurant.lat === restaurant.lat &&
      selectedRestaurant.lng === restaurant.lng
    )
  }

  return (
    <div className="w-full h-full relative bg-gray-200">
      <Map 
        center={center} 
        style={{ width: "100%", height: "100%" }} 
        level={3} 
        scrollwheel={true} 
        draggable={true} 
        zoomable={true}
      >
        {restaurants.map((restaurant, index) => {
          const isSelected = isRestaurantSelected(restaurant)

          return (
            <MapMarker
              key={`${restaurant.name}-${restaurant.lat}-${restaurant.lng}-${index}`}
              position={{ lat: restaurant.lat, lng: restaurant.lng }}
              clickable={true}
              onClick={() => onMarkerClick && onMarkerClick(restaurant)}
              {...(isSelected && {
                image: {
                  src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png",
                  size: { width: 29, height: 42 },
                  options: {
                    offset: { x: 14, y: 42 }
                  }
                }
              })}
            />
          )
        })}
      </Map>
    </div>
  )
}

export default MapSection
