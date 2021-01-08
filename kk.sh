lsof -i tcp:443 |grep LISTEN|awk '{print $2}' |xargs kill -9
lsof -i tcp:8443 |grep LISTEN|awk '{print $2}' |xargs kill -9
