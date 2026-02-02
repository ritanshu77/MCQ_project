const axios = require('axios');

let config = {
  method: 'get',
  maxBodyLength: Infinity,
  url: 'http://localhost:3001/questions/unit/allsets/69711a7e3727311c42c27a9a',
  headers: {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTc3MjE0OGY2MWYzZjY2YzgzZDk2MjYiLCJpYXQiOjE3Njk0MTQ5ODQsImV4cCI6MTc3MDAxOTc4NH0.NPbAxx0oqzulpKDRj1rx1m5F67YFdtbN4l-Ptw-ZtEo',
    'Connection': 'keep-alive',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
    'Cookie': '__next_hmr_refresh_hash__=310; token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTc3MjE0OGY2MWYzZjY2YzgzZDk2MjYiLCJpYXQiOjE3Njk0MTQ5ODQsImV4cCI6MTc3MDAxOTc4NH0.NPbAxx0oqzulpKDRj1rx1m5F67YFdtbN4l-Ptw-ZtEo; id=69772148f61f3f66c83d9626'
  }
};

axios.request(config)
.then((response) => {
  console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.data && response.data.data.chapters && response.data.data.chapters.length > 0) {
        const firstSet = response.data.data.chapters[0].sets[0];
        console.log("Checking first set for userResult:");
        console.log(JSON.stringify(firstSet, null, 2));
        if (firstSet.userResult) {
            console.log("✅ userResult FOUND!");
        } else {
            console.log("❌ userResult MISSING!");
        }
    }
  })
  .catch((error) => {
  console.log(error.message);
  if (error.response) {
      console.log(error.response.data);
      console.log(error.response.status);
  }
});
