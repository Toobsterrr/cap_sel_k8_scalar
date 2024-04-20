# Setup

* start saas app
* run ```kubectl describe services -n <namespace>```
* find EndPoints
* ssh in minikube ```minikube ssh``` (only works in kubernetes environment)

# Use

* configuration: ```wget http://<endpoint>/<resource>/<int>/<int>```, with ```<endpoint>``` the found endpoint, ```resource>``` the resource you want to change (from ```set_mem```, ```set_cpu```, ```set_io```) and ```<int>``` the amount of tenants (0 = single tenant) and the config for given resource
* request: ```wget http://<endpoint>/request/<int>```  with int only in case of multi tenant app

API reference (look only at code, comments are wrong: ![documentation](https://github.com/Danacus/k8-scalar/blob/master/studies/WOC2019/docs/API%20of%20the%20SaaS%20application.pdf)
