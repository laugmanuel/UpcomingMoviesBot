#!/bin/bash
echo "RUNNING WITH USER ID ${UID}" 
if [[ ! $TELEGRAMAPI ]]; then
	echo "Telegram API Key is not set. Please set ENV variable \"TELEGRAMAPI\""
	exit 1
fi
if [[ ! $TMDBAPI ]]; then
	echo "TMDB API Key is not set. Please set ENV variable \"TMDBAPI\""
	exit 2
fi

npm install -a
node app.js
