import { useNavigate } from "react-router-dom";
import HeroSection from "../components/HeroSection";

const SearchPage = () => {
  const navigate = useNavigate();

  const handleSearch = (searchParams) => {
    // 검색어만 전달 (중심 좌표는 API 결과에서 결정)
    const params = new URLSearchParams({
      query: searchParams.query || ""
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
