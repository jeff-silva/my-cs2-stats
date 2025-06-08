#!/bin/bash
docker compose up --build --force-recreate --remove-orphans
rm -rf ./docs
cp -r node/app/pages ./docs