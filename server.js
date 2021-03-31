'use strict';
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
const NODE_ENV = process.env.NODE_ENV;
const DATABASE_URL= process.env. DATABASE_URL;

require('dotenv').config();

const options = NODE_ENV === 'production' ? { connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } } : { connectionString: DATABASE_URL };
const client = new pg.Client(options);
client.on('error', err => { throw err; });

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());




const handelLocation = (request, response) => {
  const city = request.query.q;
  let key = process.env.GEOCODE_API_KEY;
  const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json&limit=1`;
  const select = 'SELECT * FROM locations WHERE search_query = $1';

  client.query(select, [city])
    .then(results => {
      if (results.rowCount === 0) {
        superagent.get(url)
          .then(data => {
            const geoData = data.body[0];
            const locationInfo = new Location(city, geoData);
            const { search_query, formatted_query, latitude, longitude } = locationInfo;
            let safeValues = [search_query, formatted_query, latitude, longitude];
            let sql = 'INSERT INTO locations (search_query, formatted_query,latitude,longitude) VALUES ($1, $2,$3,$4) RETURNING *';
            client.query(sql, safeValues)
              .then((data) => {
                response.json(data.rows[0]);
              });
          })

          .catch((error) => {
            console.log('error from location', error);
            response.status(500).send('So sorry, something went wrong.');
          });

      } else {
        response.json(results.rows[0]);
      }

    }).catch(e=>console.log(e.message,'kjkjk'));

};




const handelWeather = (req, res) => {
  const city = req.query.q;
  let key = process.env.WEATHER_API_KEY;
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?q=${city}&key=${key}`;
  superagent.get(url)
    .then(weatherInfo => {
      console.log(weatherInfo)
      const geoData = weatherInfo.body;
      geoData.data.map(day => {
        return new Weather(day);
      });
      res.json(Weather.all);
    })
    .catch((error) => {
      console.log(error);

      res.status(500).send('So sorry, something went wrong.');
    });
};

const handelPark = (req, res) => {
  let city = req.query.q;
  let key = process.env.PARKS_API_KEY;
  const url = `https://developer.nps.gov/api/v1/parks?q=${city}&limit=10&api_key=${key}`;
  superagent.get(url)
    .then(Info => {
      const geoData = Info.body;
      geoData.data.map(data => {
        return new Park(data);
      });
      res.json(Park.all);
    })
    .catch((error) => {
      console.log(error);

      res.status(500).send('So sorry, something went wrong.');
    });
};

const handelMovies=(req,res)=>{
  let key =process.env.MOVIE_API_KEY;
  const url =
}


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
  this.fee = info.entranceFees[0].cost;
  this.description = info.description;
  this.url = info.url;
  Park.all.push(this);
}

Park.all = [];

function Movies(info){
  this.titel=
  this.overview=
  this.average_votes=
  this.total_votes=
  this.image_url=
  this.popularity=
  this.released=
}

const handleRequest = (request, response) => {
  console.log(request.query);
  response.send('its work');
};



app.get('/location', handelLocation);
app.get('/weather', handelWeather);
app.get('/', handleRequest);
app.get('/park', handelPark);
app.get('/movies', handelMovies);
app.use('*', handelError);




client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log("Connected to database:", client.connectionParameters.database);
      console.log('Server up on', PORT);
    });
  })
  .catch(err => {
    console.log('ERROR', err);
  });
