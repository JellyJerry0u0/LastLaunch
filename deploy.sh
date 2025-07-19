cd  /home/ubuntu/LastLaunch/client
npm install
npm run build

cd /home/ubuntu/LastLaunch/server
npm install
pm2 restart LastLaunch || pm2 start src/index.js --name LastLaunch-server

