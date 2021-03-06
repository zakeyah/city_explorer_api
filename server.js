'use strict';
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');


const NODE_ENV = process.env.NODE_ENV;
const DATABASE_URL = process.env.DATABASE_URL;

require('dotenv').config();

const options = NODE_ENV === 'production' ? { connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } } : { connectionString: DATABASE_URL };
const client = new pg.Client(options);
client.on('error', err => { throw err; });

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());




const handelLocation = (request, response) => {
  const city = request.query.city;
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

    })
    .catch((error) => {
      console.log(error);
      response.status(500).send('So sorry, something went wrong.');
    });

};




const handelWeather = (req, res) => {
  const city = req.query.search_query;
  let key = process.env.WEATHER_API_KEY;
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&key=${key}`;
  superagent.get(url)
    .then(weatherInfo => {
      const geoData = weatherInfo.body;
      geoData.data.map(day => {
        return new Weather(day);
      });
      res.json(Weather.all);
    })
    .catch((error) => {
      console.log(error.message);
      res.status(500).send('So sorry, something went wrong.');
    });
};

const handelPark = (req, res) => {
  let city = req.query.search_query;
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

const handelMovies = (req, res) => {
  let key = process.env.MOVIE_API_KEY;
  let city = req.query.search_query;
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${city}`;


  superagent(url)
    .then(info => {
      const geoData = info.body;
      geoData.results.map(data => {
        return new Movies(data);
      });
      res.json(Movies.all);

    })
    .catch((error) => {
      console.log(error);

      res.status(500).send('So sorry, something went wrong.');
    });

};

const handelyelp = (req, res) => {
  let city = req.query.search_query;
  const key = process.env.YELP_API_KEY;
  const url = `https://api.yelp.com/v3/businesses/search?location=${city}`;

  superagent.get(url)
    .set(`Authorization`, `Bearer ${key}`)
    .then(info => {
      const geoData = info.body;
      geoData.businesses.map(data => {
        return new Yelp(data);
      });
      res.status(200).send(Yelp.all);
    })
    .catch((error) => {
      console.log(error);

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
  this.fee = info.entranceFees[0].cost;
  this.description = info.description;
  this.url = info.url;
  Park.all.push(this);
}

Park.all = [];

function Movies(info) {
  this.titel = info.title;
  this.overview = info.overview;
  this.average_votes = info.vote_average;
  this.total_votes = info.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w500/${info.poster_path}`;
  this.popularity = info.popularity;
  this.released = info.release_date;
  Movies.all.push(this);
}
Movies.all = [];
function Yelp(info) {

  this.name = info.name;
  this.image_url = info.image_url;
  this.price = info.price;
  this.rating = info.rating;
  this.url = info.url;
  Yelp.all.push(this);
}
Yelp.all = [];

const handleRequest = (request, response) => {
  console.log(request.query);
  response.send('its work');
};



app.get('/location', handelLocation);
app.get('/weather', handelWeather);
app.get('/', handleRequest);
app.get('/parks', handelPark);
app.get('/movies', handelMovies);
app.get('/yelp', handelyelp);
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
