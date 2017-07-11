'use strict'

// Inkludieren der benötigten Node Module
const schedule = require('node-schedule')
const winston = require('winston')
const TeleBot = require('telebot')
const _ = require('lodash')
const moment = require('moment')
// Verwendung der Umgebungsvariable "telegramapi" anstatt den Key hardkodiert zu hinterlegen
//const bot = new TeleBot('Telegram-API')

const BUTTONS = {
    movies: {
        label: '🎥 Movies',
        command: '/movies'
    },
    help: {
        label: '❓ Help',
        command: '/help'
    },
    info: {
        label: 'ℹ Info',
        command: '/info'
    }
};

const bot = new TeleBot({
  token: process.env.TELEGRAMAPI, // API Key aus der Umgebungsvariable
  polling: {
        interval: 100, //Prüfungsinterval für neue Anfragen
    },
    usePlugins: ['namedButtons'],
    pluginConfig: {
      namedButtons: {
            buttons: BUTTONS
      }
    }
})

// Verfügbarmachen der Backend-Funktionen -> Calls zur Datenbank und TMDB
const backend = require('./backend.js')

//timer, der jeden Tag um 00:30 die Funktion getData aufruft -> Alle "Upcoming Movies" von TMDB abholt und die DB aktualisiert
let moviesFromApi = schedule.scheduleJob('30 0 * * *', () => {
    winston.info('['+moment().format()+'] Timer gestartet! Die Datenbank wird täglich um 00:30 aktualisiert')
    backend.getDataFromAPI()
})

//timer, der jeden Tag um 19:00Uhr auf neue Einträge in der DB prüft und den User darüber benachrichtigt
let newMovies = schedule.scheduleJob('0 19 * * *', () => {
  winston.info('['+moment().format()+'] Suche nach neuen Filmen in der DB')
  getNewMovies()
})

// TELEGRAM BOT
// Antwort auf /start und /hello. Wird beim Klick auf "Starten" vom Telegram-Client gesendet
bot.on(['/start', '/hello'], (msg) => {
  let replyMarkup = bot.keyboard([
        [BUTTONS.movies.label],
        [BUTTONS.help.label, BUTTONS.info.label]
    ], {resize: true});

    bot.sendMessage(msg.chat.id,'*Willkommen!* Sende einen der folgenden Befehle, um Informationen von diesem Bot zu erhalten: \n/movies für eine Liste aller kommenden Filme \n/help um die Hilfe anzuzeigen \n/info Für Informationen über uns\n\n_Alle Daten stammen von TheMovieDB_', { parse: 'Markdown', replyMarkup })
    //hinterlegen des Users in der DB
    backend.addUser(msg.from.id)
})

// Antwort auf die /help Anfrage mti einem Hilfe-Dialog
bot.on('/help', (msg) => {
    bot.sendMessage(msg.chat.id,'Du bist auf der Suche nach der Hilfe? Hier hast du eine Liste was ich für dich tun kann:\n/movies für eine Liste aller kommenden Filme \n/help um die Hilfe anzuzeigen \n/info Für Informationen über uns')
})

// Ausgabe aller zuknftigen Filme in sortierter Form
bot.on('/movies', (msg) => {
  //hinterlegen des Users in der DB
  backend.addUser(msg.from.id)
  // Alle Filme aus der DB holen
  backend.findAllMovies({release_date: {$gt: moment(new Date()).subtract(1, 'days').format("YYYY-MM-DD")}}, {}, (items) => {
    // Filme nach release_date sortieren
    items = _.orderBy(items,'release_date', 'desc');
    winston.info('['+moment().format()+'] Client ' + msg.from.username + " ("+ msg.from.id +") asked for movies")

    // Ausgabe der Datums-Überschriften (Prüfung von aktuellem Datum gegen letztes Datum im Array )
    let result = ""
    let lastDate = moment("3000-01-01")
    for (let i=0; i<items.length;i++) {
      let movieDate = moment(items[i].release_date) //07.06.2017
       if (movieDate.isBefore(lastDate)) {
         // Neue Datumszeile ins Ergebnis aufnehmen
         result += "\n*" + movieDate.format('DD.MM.YYYY').toString() +"*\n"
         lastDate = movieDate
       }
       result += "/" + items[i].id + " " + items[i].title + "\n"
    }
   bot.sendMessage(msg.chat.id,result, { parse: 'Markdown' })
 })
})

// Ausgabe der Filminformation, wenn eine beliebig lange Nummer (Movie-ID) an den Bot gesendet wurde
bot.on(/\d+/, (msg) => {
  //hinterlegen des Users in der DB
  backend.addUser(msg.from.id)
  winston.info('['+moment().format()+'] Client ' + msg.from.username + " ("+ msg.from.id +") asked for movie: " + msg.text.replace("\/", ""))
  // Das Movie mit passendet ID (vom User gesendet) aus der DB holen
  backend.findOneMovie({id: parseInt(msg.text.replace("\/", ""),10)}, {}, (result) => {
    // Prüfung, ob Ergebnis nicht leer ist (Film nicht existiert). Falls doch, wird Fehler an den User gesendet
    if (typeof result === 'undefined' || result === null) {
      bot.sendMessage(msg.chat.id, "Sorry... Film nicht mehr in der Datenbank", { parse: 'html' })
      return
    }
    let reply = '### <strong>' + result.title + '</strong> ###'
    reply += '\n<strong>Start:</strong> ' + moment(result.release_date).format('DD.MM.YYYY').toString()
    reply += '\n<strong>Bewertung:</strong> ' + result.popularity
    reply += '\n<strong>Beschreibung:</strong> ' + result.overview
    if (typeof result.poster_path !== 'undefined' && result.poster_path !== null) {
      reply += '\n\n<a href="https://image.tmdb.org/t/p/w300'+result.poster_path+'">Picture:</a>'
    }
    bot.sendMessage(msg.chat.id, reply, { parse: 'html' })
  })
})

// Ausgabe, wenn der User nach /info frägt -> Informationen über Sinn, Projektgruppe und Datenquelle
bot.on('/info', (msg) => {
  let reply = 'Wir sind eine Gruppe von Studenten der DHBW in Karlsruhe und haben dieses Projekt im Rahmen einer Vorlesung erstellt.\nMitwirkende:\nTobias R.\nNicolas D.\nDenis Z.\nBenjamin S.\nYannik G.\nManuel L.\n\n_Alle Daten stammen von TheMovieDB_'
  bot.sendMessage(msg.chat.id, reply, {parse: 'Markdown'})
})

// Methode die regelmäßig aufgerufen wird und eine Liste aller neuen Filme an den User übermittelt (Ausschließlich neue Filme)
let getNewMovies = () => {
  // Alle neuen Movies aus der DB holen
  backend.getNewMovies((items) => {
    if (items.length>=1) {
      items = _.orderBy(items,'release_date', 'desc');

      // Ausgabe der Datums-Überschriften (Prüfung von aktuellem Datum gegen letztes Datum im Array )
      let result = "*Wir haben neue Filme gefunden:*\n"
      let lastDate = moment("3000-01-01")
      for (let i=0; i<items.length;i++) {
        let movieDate = moment(items[i].release_date)
          if (movieDate.isBefore(lastDate)) {
            // Neue Datumszeile ins Ergebnis aufnehmen
            result += "\n*" + movieDate.format('DD.MM.YYYY').toString() +"*\n"
            lastDate = movieDate
          }
          result += "/" + items[i].id + " " + items[i].title + "\n"
      }
      // Alle User aus DB holen, damit Diese benachrichtigt werden können
      backend.findAllUsers({}, {}, (users) => {
        for (let i=0; i<users.length; i++) {
          // Nachricht an User senden
          bot.sendMessage(users[i].userId,result, { parse: 'Markdown' })
        }
      })
    }
  })
}

backend.getDataFromAPI() // Intialer Call von getData() direkt beim Aufruf des Scripts

bot.start() // Start Bot
