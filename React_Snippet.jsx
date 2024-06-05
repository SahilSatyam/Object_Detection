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


from jira import JIRA
import requests
import os

try:
    server_url = 'https://your-jira-instance.atlassian.net'
    email = 'your-email@example.com'
    api_token = 'your-api-token'

    jira = JIRA(server=server_url, basic_auth=(email, api_token))

    main_issue_dict = {
        'project': {'key': 'PROJ'},
        'summary': 'Main Issue Summary',
        'description': 'Description of the main issue.',
        'issuetype': {'name': 'Story'},
    }

    main_issue = jira.create_issue(fields=main_issue_dict)
    print(f"Created main issue {main_issue.key}")

except requests.exceptions.RequestException as e:
    print(f"An error occurred: {e}")
    if hasattr(e, 'response'):
        print(f"Response content: {e.response.content}")

