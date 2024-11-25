#!/bin/sh
./startup-webserver.sh 

while ! nc -z localhost 8080; do
  sleep 1
done

npm start
