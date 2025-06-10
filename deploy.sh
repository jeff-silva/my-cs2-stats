#!/bin/bash
cd /home/jeff/my-cs2-stats
/home/jeff/.nvm/versions/node/v22.14.0/bin/yarn dev
/usr/bin/git add .
/usr/bin/git commit -m "feat: stats update"
"/usr/bin/git push https://jeff-silva:${GIT_TOKEN}@github.com/jeff-silva/my-cs2-stats.git"