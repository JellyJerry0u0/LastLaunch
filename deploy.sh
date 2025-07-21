cd  /home/ubuntu/LastLaunch/client
npm install
npm run build

cd /home/ubuntu/LastLaunch/server
npm install
pm2 restart last-launch-server --update-env || pm2 start src/index.js --name last-launch-server --update-env

