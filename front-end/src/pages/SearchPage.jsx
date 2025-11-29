import { useNavigate } from "react-router-dom";
import HeroSection from "../components/HeroSection";
import { mockRestaurants, DEFAULT_CENTER } from "../data/mockData";

const deriveCenterFromQuery = (query) => {
  if (!query) {
    return DEFAULT_CENTER;
  }

  const normalizedQuery = query.toLowerCase();
  const matched = mockRestaurants.filter((restaurant) => {
    const searchableFields = [restaurant.name, restaurant.address].filter(Boolean).map((field) => field.toLowerCase());

    return searchableFields.some((field) => field.includes(normalizedQuery));
  });

  if (matched.length === 0) {
    return DEFAULT_CENTER;
  }

  const avgLat = matched.reduce((sum, restaurant) => sum + restaurant.lat, 0) / matched.length;
  const avgLng = matched.reduce((sum, restaurant) => sum + restaurant.lng, 0) / matched.length;

  return {
    lat: Number(avgLat.toFixed(6)),
    lng: Number(avgLng.toFixed(6))
  };
};

const SearchPage = () => {
  const navigate = useNavigate();

  const handleSearch = (searchParams) => {
    const derivedCenter = deriveCenterFromQuery(searchParams.query);

    const params = new URLSearchParams({
      query: searchParams.query || "",
      lat: derivedCenter.lat.toString(),
      lng: derivedCenter.lng.toString()
    });

    navigate(`/results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <HeroSection
        onSearch={handleSearch}
      />
    </div>
  );
};

export default SearchPage;
