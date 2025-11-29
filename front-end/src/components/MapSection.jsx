import { useEffect, useState } from "react";
import { Map, MapMarker } from "react-kakao-maps-sdk";

const MapSection = ({ restaurants, selectedRestaurant, onMarkerClick, center, setCenter }) => {
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (map && center) {
      try {
        map.setCenter(new window.kakao.maps.LatLng(center.lat, center.lng));
      } catch (error) {
        console.error("지도 중심 설정 오류:", error);
      }
    }
  }, [map, center]);

  return (
    <div className="w-full h-full relative bg-gray-200">
      <Map center={{ lat: center.lat, lng: center.lng }} style={{ width: "100%", height: "100%" }} level={3} onCreate={setMap} scrollwheel={true} draggable={true} zoomable={true}>
        {restaurants.map((restaurant, index) => (
          <MapMarker
            key={`${restaurant.name}-${index}`}
            position={{ lat: restaurant.lat, lng: restaurant.lng }}
            onClick={() => onMarkerClick(restaurant)}
            image={{
              src:
                selectedRestaurant?.name === restaurant.name && selectedRestaurant?.lat === restaurant.lat && selectedRestaurant?.lng === restaurant.lng
                  ? "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png"
                  : "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker.png",
              size: {
                width: 30,
                height: 42
              },
              options: {
                offset: {
                  x: 15,
                  y: 42
                }
              }
            }}
          />
        ))}
      </Map>
    </div>
  );
};

export default MapSection;
