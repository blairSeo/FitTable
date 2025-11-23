import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/HeroSection';

const SearchPage = () => {
  const navigate = useNavigate();
  const [budget, setBudget] = useState('');
  const [budgetType, setBudgetType] = useState('perPerson');
  const [numberOfPeople, setNumberOfPeople] = useState(2);
  const [center, setCenter] = useState(null);

  // 현재 위치 가져오기
  const getCurrentLocation = (showAlert = false, callback = null) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCenter(newCenter);
          if (callback) {
            callback(newCenter);
          }
        },
        (error) => {
          console.error('위치 정보를 가져올 수 없습니다:', error);
          if (showAlert) {
            alert('위치 정보를 가져올 수 없습니다. 브라우저 위치 권한을 확인해주세요.');
          }
          if (callback) {
            callback(null);
          }
        }
      );
    } else {
      if (showAlert) {
        alert('브라우저가 위치 정보를 지원하지 않습니다.');
      }
      if (callback) {
        callback(null);
      }
    }
  };

  const handleLocationClick = (onComplete = null) => {
    getCurrentLocation(true, (location) => {
      if (onComplete) {
        onComplete(location);
      }
    });
  };

  // 페이지 첫 로드 시 현재 위치 가져오기
  useEffect(() => {
    getCurrentLocation(false);
  }, []);

  const handleSearch = (searchParams) => {
    // 검색 조건을 URL 파라미터로 전달
    const params = new URLSearchParams({
      query: searchParams.query || '',
      budget: budget || '',
      budgetType: budgetType,
      numberOfPeople: numberOfPeople.toString(),
      lat: center?.lat?.toString() || '',
      lng: center?.lng?.toString() || '',
    });
    
    navigate(`/results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <HeroSection
        onSearch={handleSearch}
        onLocationClick={handleLocationClick}
        budget={budget}
        setBudget={setBudget}
        budgetType={budgetType}
        setBudgetType={setBudgetType}
        numberOfPeople={numberOfPeople}
        setNumberOfPeople={setNumberOfPeople}
      />
    </div>
  );
};

export default SearchPage;

