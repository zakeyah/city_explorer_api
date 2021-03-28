'use strict';
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());


const handelLocation = (request,response)=>{
  const locationFolder =require('./data/location.json');
  const locationInfo = new Location (locationFolder[0]);
  response.json(locationInfo);
};

const handelWeather= (req,res)=>{
  const weather = require('./data/weather.json');
  weather.data.forEach(day => {
    let weatherInfo = new Weather(day);
  });
  res.json(Weather.all);
};

const handelError = (req,res)=>{
  res.status(500).send('Error');
};





function Location( info) {
  this.search_query = info.display_name.split(',')[0];
  this.formatted_query =info.display_name;
  this.latitude = info.lat;
  this.longitude = info.lon;
}

function Weather (info){
  this.forecast = info.weather.description;
  this.time = new Date(info.valid_date).toDateString();
  Weather.all.push(this);
}
Weather.all=[];



const handleRequest = (request, response) => {
  console.log(request.query);
  response.send('its work');
};

app.get('/location',handelLocation);
app.get('/weather',handelWeather);
app.get('/', handleRequest);
app.use('*', handelError);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
