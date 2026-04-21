#!/bin/bash

echo "Starting backend..."
cd apps/api
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH
./gradlew bootRun &

cd ../mobile

echo "Starting Expo..."
npx expo start --tunnel