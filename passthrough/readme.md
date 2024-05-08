# Commands to setup passthrough app

## edit app

* edit app.js
* docker build -t tomasvdn/passthrough:<tag> .
* docker push tomasvdn/passthrough:<tag>

## deploy on cluster

* edit the image in ```deployment.yaml``` to the correct image (and tag)
* ```kubectl apply -f deployment.yaml```
* ```kubectl apply -f service.yaml```

## Rest API

* ```/request``` => if the amount of requests from the given IP is reached, return error code 503, otherwise forward to the url given during configuration
* ```/limit/get/:ip``` => returns the information for a given IP
* ```/limit/set/:ip/:limitCpu/:guaranteedCpu/:limitMem/:guaranteedMem``` => sets the guaranteed memory and cpu level for a given IP, as well as the amount needed per request
* ```/set_saas_url/:url``` => sets the url the requests should be forwarded to
* ```/resources/set/:cpu/:memory => sets the total resource (max the app can use)
