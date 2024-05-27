import React, { useState, useEffect, useMemo } from 'react';

const MyComponent = ({ initialQuery }) => {
  const [data, setData] = useState(null);

  // Define your data fetching function
  const fetchData = async (query) => {
    const response = await fetch(`your-api-url/${query}`);
    const data = await response.json();
    return data;
  };

  // Use useMemo to cache the result of fetchData
  const memoizedData = useMemo(() => {
    return fetchData(initialQuery).then((fetchedData) => setData(fetchedData));
  }, [initialQuery]); // Only re-fetch data if initialQuery changes

  useEffect(() => {
    // This effect runs once after the component mounts
    // and whenever memoizedData changes due to initialQuery changing
    memoizedData.then((fetchedData) => {
      console.log("Fetched data:", fetchedData);
    });
  }, [memoizedData]);

  return (
    <div>
      {/* Render your component */}
    </div>
  );
};

export default MyComponent;
