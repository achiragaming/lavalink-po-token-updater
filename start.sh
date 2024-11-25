#!/bin/sh
echo "Starting the token generater..."
./startup-webserver.sh

while ! nc -z localhost 8080; do
  echo "Waiting for webserver to be ready..."
  sleep 1
done

echo "Starting Node.js app..."
npm start
