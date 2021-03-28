const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

const handleRequest = (request, response) => {
  console.log(request.query);
  response.send('its work');
};

app.get('/', handleRequest);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
