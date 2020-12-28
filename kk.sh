lsof -i tcp:443 |grep LISTEN|awk '{print $2}' |xargs kill -9
