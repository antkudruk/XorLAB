#!/bin/bash
cd xorlab
rm -rf node_modules && rm -rf dist && npm install && npm run build
cd ..

cd xorlab-linalg
rm -rf node_modules && rm -rf dist && npm install && npm run build
cd ..

cd preprocessor-library
rm -rf node_modules && rm -rf dist && npm install && npm run build
cd ..

cd xorlab-discover
rm -rf node_modules && rm -rf dist && npm install && npm run build
cd ..

cd examples/timetable
rm -rf node_modules && rm -rf dist && rm -rf generated && npm install && npx xorlab-preprocessor && npm run build
cd ../../

cd examples/calendar
rm -rf node_modules && rm -rf dist && rm -rf generated && npm install && npx xorlab-preprocessor && npm run build
cd ../../

cd examples/periodic-table
rm -rf node_modules && rm -rf dist && rm -rf generated && npm install && npx xorlab-preprocessor && npm run build
cd ../../

cd examples/poissons
rm -rf node_modules && rm -rf dist && rm -rf generated && npm install && npx xorlab-preprocessor && npm run build
cd ../../
