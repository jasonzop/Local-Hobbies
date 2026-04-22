#!/bin/bash

echo "Starting database..."
cd /workspaces/Local-Hobbies
docker compose up -d

sleep 5

echo "Setting Java 17..."
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

echo "Starting backend..."
cd /workspaces/Local-Hobbies/apps/api
./gradlew bootRun &

sleep 8

echo "Starting Expo..."
cd /workspaces/Local-Hobbies/apps/mobile
npx expo start -c