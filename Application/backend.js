'use strict'

// Inkludieren der benötigten Node Module
const winston = require('winston')
const moment = require('moment')
const _ = require('lodash')
//const moviedb = require('moviedb')('TMDB-API')
const moviedb = require('moviedb')(process.env.TMDBAPI)
const Db = require('tingodb')().Db, assert = require('assert')

// Setzen des Datenbankverzeichnisses und anlegen der zwei Datenbanken (Movies und Users)
let db = new Db('./database/', {})
let movieCollection = db.collection("movies.db")
let userCollection = db.collection("users.db")

// Alle "Upcoming Movies" von der API von TMDB holen
this.getDataFromAPI = (page) => {
  if (page == undefined) page=1
  winston.info('[' +moment().format() + '] Request of page #' + page)
    // API-Aufruf. Wichtig ist Sprache Deutsch und Region Deutschland. Filme außerhalb von DE werden nicht betrachtet
    moviedb.miscUpcomingMovies({ language: 'de-DE', page: page, region: 'DE'}, (err, res) => {
      this.writeMovies(res.results)
      if (res.page<res.total_pages) {
        // Rekursiver Aufruf, wenn mehere Seiten von der API zurückgegeben werden
        this.getDataFromAPI(page+1)
      }
    })
}

// Alle Filme in "data" in die Datenbank schreiben
this.writeMovies = (data) => {
  // Alle Filme aus der DB holen
  this.findAllMovies({}, {}, (ids) => {
    for (let i=0;i<data.length;i++) {
      let found = false;
      for(let j=0;j<ids.length;j++) {
        // Prüfen, ob Film vorhanden ist. Wenn ja, wird das Date-Added-Feld nicht angepasst.
        if (ids[j].id === data[i].id) {
          let set = _.omit(data[i], '_dt')
          found = true
          break;
        }
      }
      // Wenn Film nicht vorhanden, wird aktuelles Datum in Date-Added gesetzt
      if (!found) {
        data[i]._dt = moment(new Date()).valueOf()
      }

      winston.info('['+moment().format()+'] Updating Movie with ID ' + data[i].id)
      // Update der Movie-Collection mit den neuen Inhalten. Vorhandene Einträge werden geupdated (z.B. Bewertung des Films)
      movieCollection.update({id: data[i].id}, {$set: data[i]}, {upsert: true}, (err, result) => {
        assert.equal(null, err)
      })
    }
  })
}

// Alle Filme aus der Datenbank holen
this.findAllMovies = (query, projection, callback) => {
  winston.info('['+moment().format()+'] Reading Movie DB Entries!')
  // Aufruf von TingoDB-API mit Suche aller Filme
  movieCollection.find(query, projection).toArray((err, item) => {
    assert.equal(null, err);
    if (typeof callback !== 'undefined' && callback !== null)  callback(item)
  })
}

// Ein bestimmter Film aus der Datenbank holen
this.findOneMovie = (query, projection, callback) => {
  // Aufruf TingoDB-API mit Suche nach einem User (übergabeparameter "query" und "projection")
  movieCollection.findOne(query, projection, (err, item) => {
   assert.equal(null, err);
   if (typeof callback !== 'undefined' && callback !== null)  callback(item)
 })
}

// Alle neuen Filme aus der DB holen (bei denen das Date-Added-Feld maximal ein Tag alt ist)
this.getNewMovies = (callback) => {
  let date = moment(new Date()).subtract(1, 'days').valueOf()
  winston.info('['+moment().format()+']' + date)
  // Aufruf TingoDB-API mit Suche _dt > aktuelles Datum
  this.findAllMovies({'_dt': {$gt: date}}, {}, (result) => {
      if (typeof callback !== 'undefined' && callback !== null)  callback(result)
  })
}

// User in die User-DB einfügen bzw. updaten, falls bereits vorhanden
this.addUser = (userId) => {
  // Verwendung von update mit upsert:true -> einfügen, wenn nicht vorhanden
  userCollection.update({}, {userId: userId}, {upsert: true}, (err, result) => {
    assert.equal(null, err)
  })
}

// Alle User aus der User-DB holen
this.findAllUsers = (query, projection, callback) => {
  winston.info('['+moment().format()+'] Reading User DB Entries!')
  // Aufruf von TingoDB-API mit Suche aller User
  userCollection.find(query, projection).toArray((err, item) => {
    assert.equal(null, err)
    if (typeof callback !== 'undefined' && callback !== null)  callback(item)
  })
}
