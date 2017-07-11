# UpcomingMoviesBot
Node implementation of a Telegram bot that will pull all upcoming movies from TMDB and provide to interested users

## Prereqs
* A valid TMDB API Key ([TheMovieDB](https://www.themoviedb.org/))
* A existing Telegram Bot with it's API Key ([Telegram Bot](https://core.telegram.org/bots))
* A server which can host the application (preferably Linux based)

## How to use
You have two posibilities to run this application:
#### 1. Inside a Docker container
You will need Docker and docker-compose. Then you will have to enter your API-Keys inside the docker-compose.yml file (`TELEGRAMAPI` and `TMDBAPI`).

Afterwards you can just run the command
`docker-compose up -d` to start the application
#### 2. Directly on the host
Set the environment variables `TELEGRAMAPI` and `TMDBAPI` to their corresponding values and execute the `entrypoint.sh` inside the application directory.

An exmaple line could be `# export TELEGRAMAPI='<your api>' export TMDBAPI='<your api>' ./entrypoint.sh`

## Used tech
* Source of all movie information: [TheMovieDB](https://www.themoviedb.org/)
* NodeJs for serverside implementation
  * [winston](https://github.com/winstonjs/winston)
  * [moment](https://github.com/moment/moment)
  * [lodash](https://github.com/lodash/lodash)
  * [moviedb](https://github.com/impronunciable/moviedb)
  * [tingodb](https://github.com/sergeyksv/tingodb)
  * [telebot](https://github.com/mullwar/telebot)

## Backstory
This project was created by a group of students at DHBW Karlsruhe in Germany as part of a course.
* [Yannik](https://github.com/yannikgail)
* [Denis](https://github.com/Dene1894)
* [Benjamin](https://github.com/el-Ben-Barto)
* [Nicolas](https://github.com/thenightmanager)
* [Tobias](https://github.com/laugmanuel/UpcomingMoviesBot/)

<img src="https://nodejs.org/static/images/logos/nodejs-new-pantone-black.png" height="50em">  <img src="https://www.themoviedb.org/assets/static_cache/bb45549239e25f1770d5f76727bcd7c0/images/v4/logos/408x161-powered-by-rectangle-blue.png" height="50em">
