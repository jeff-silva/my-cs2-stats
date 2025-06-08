#!/bin/bash
docker compose up --build --force-recreate --remove-orphans
cp -r node/app/pages ./docs