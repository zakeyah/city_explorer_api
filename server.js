'use strict';
const express = require('express');
const cosr = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cosr());

const handelLocation = (request,response)=>{
  const locationFolder =require('./data/location.json');
  const locationInfo = new Location (locationFolder[0]);
  response.json(locationInfo);
};
app.get('/location',handelLocation);


function Location(info) {
  this.search_query = info.display_name.split(',')[0];
  this.formatted_query =info.display_name;
  this.latitude = info.lat;
  this.longitude = info.lon;
}






const handleRequest = (request, response) => {
  console.log(request.query);
  response.send('its work');
};

app.get('/', handleRequest);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
