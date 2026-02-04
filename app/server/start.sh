#!/bin/sh
set -e

echo "Building TypeScript..."
npm run build

echo "Generating Prisma client..."
npx prisma generate

if [ -f ./dist/server.js ]; then
	ENTRY=./dist/server.js
elif [ -f ./dist/src/server.js ]; then
	ENTRY=./dist/src/server.js
else
	echo "No server entry found after build"
	exit 1
fi

echo "Starting $ENTRY"
exec node "$ENTRY"


