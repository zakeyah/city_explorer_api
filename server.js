'use strict';
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const locations = {};
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());


const handelLocation = (request, response) => {
  const city = request.query.city;
  let key = process.env.GEOCODE_API_KEY;
  const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json&limit=1`;
  
  superagent.get(url)
  .then(data => {
    const geoData = data.body[0];
    const locationInfo = new Location(city, geoData);
    let SQL = 'INSERT INTO people (search_query, formatted_query,latitude,longitude) VALUES ($1, $2,$3,$4) RETURNING *';
    let safeValues = [search_query, formatted_query,latitude,longitude];
    client.query(SQL, safeValues)
    .then( results => {
      response.status(200).json(results);
       
        
    })

      .catch((error) => {

        response.status(500).send('So sorry, something went wrong.');
      });
  

};
const handelWeather = (req, res) => {
  const city = req.query.city;
  let key = process.env.WEATHER_API_KEY;
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&key=${key}`;
  superagent.get(url)
    .then(weatherInfo => {
      const geoData = weatherInfo.body;
      geoData.data.map(day => {
        let newWeather = new Weather(day);
      });
      res.json(Weather.all);
    })
    .catch((error) => {

      res.status(500).send('So sorry, something went wrong.');
    });
};

const handelPark = (req, res) => {
  let key = process.env.PARKS_API_KEY;
  const url = `https://developer.nps.gov/api/v1/parks?key=${key}`;
  superagent.get(url)
    .then(Info => {
      const geoData = Info;
      console.log('hi');
      geoData.data.map(data => {
        let newPark = new park(data);
      });
      res.json(Park.all);
    })
    .catch((error) => {

      res.status(500).send('So sorry, something went wrong.');
    });
};


const handelError = (req, res) => {
  res.status(500).send('Error');
};





function Location(city, info) {
  this.search_query = city;
  this.formatted_query = info.display_name;
  this.latitude = info.lat;
  this.longitude = info.lon;
}

function Weather(info) {
  this.forecast = info.weather.description;
  this.time = new Date(info.valid_date).toDateString();
  Weather.all.push(this);
}
Weather.all = [];

function Park(info) {
  this.name = info.fullName;
  this.address = `${info.addresses[0].line1}, ${info.addresses[0].city}, ${info.addresses[0].stateCode} ${info.addresses[0].postalCode}`;
  this.fee = info.entranceFees[0].cost ;
  this.description = info.description;
  this.url = info.url;
  Park.all.push(this);
}

Park.all=[];



const handleRequest = (request, response) => {
  console.log(request.query);
  response.send('its work');
};

app.get('/location', handelLocation);
app.get('/weather', handelWeather);
app.get('/', handleRequest);
app.get('/park',handelPark);
app.use('*', handelError);



app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
