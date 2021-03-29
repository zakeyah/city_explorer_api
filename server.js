'use strict';
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const locations = {};
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());


const handelLocation = (request,response)=>{
  
  const city = request.query.city;
  let key = process.env.GEOCODE_API_KEY;
  const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json&limit=1`;

  if(locations[url]){
    response.json(locations[url]);
  }else{
    superagent.get(url)
      .then(data=>{
        const geoData =data.body[0];
        const locationInfo = new Location (city,geoData);
        locations[url]=locationInfo;
        response.json(locationInfo);
      })

      .catch((error) => {
        console.log('ERROR', error);
        response.status(500).send('So sorry, something went wrong.');
      });
  }

};
const handelWeather= (req,res)=>{
  const weather = require('./data/weather.json');
  weather.data.map(day => {
    let weatherInfo = new Weather(day);
  });
  res.json(Weather.all);
};


const handelError = (req,res)=>{
  res.status(500).send('Error');
};





function Location( city,info) {
  this.search_query = city;
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

function errorHandler(error, req, res) {
  res.status(500).send(error);
}

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
