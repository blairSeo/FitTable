import { useNavigate } from "react-router-dom";
import HeroSection from "../components/HeroSection";

const SearchPage = () => {
  const navigate = useNavigate();

  const handleSearch = (searchParams) => {
    const params = new URLSearchParams({
      query: searchParams.query || ""
    });

    // 현재 위치가 있으면 URL 파라미터에 추가
    if (searchParams.currentLat && searchParams.currentLng) {
      params.append("currentLat", searchParams.currentLat.toString());
      params.append("currentLng", searchParams.currentLng.toString());
    }

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
