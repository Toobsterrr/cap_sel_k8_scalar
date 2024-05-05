# Commands to start minikube cluster with experiment controllers

## Start and setup minikube
(helm and minikube/kubectl assumed to be installed using package manager. If not, follow this ![md](https://github.com/Danacus/k8-scalar/blob/master/docs/tutorial.md))

1. Set repo: ```export k8_scalar_dir=`pwd`/cap_sel_k8_scalar```
2. Start minikube: ``` minikube start --no-vtx-check --driver=kvm2 --cpus 4 --memory 8192 --network-plugin=cni --cni=calico```
3. Deploy Heapster monitoring service: 
	- ```role=`kubectl get clusterrole | grep heapster | head -n1 | awk '{print $1;}'` ```
	- ```kubectl delete clusterrole $role```
	- ```helm install ${k8_scalar_dir}/monitoring-core --generate-name --namespace=kube-system```
4. Check if everything worked: ```kubectl get pods --namespace=kube-system```

## Setup experiment controllers:
### Setup
The autoscaler and experiment-controller interact directly with the Kubernetes cluster. The _kubectl_ tool, which is used for this interaction, requires configuration. Secrets are used to pass this sensitive information to the required pods. 
Note the following instructions work for minikube. Instructions for other kubernetes vendors are not exactly the same. We try to differentiate the common parts for all vendors and kubernetes-specific parts 

* Copying the kube config file and the secret. The next snippet creates the required keys for a cluster for any vendor. First, prepare a directory that contains all the required files. 

- ```mkdir ${k8_scalar_dir}/secrets```
- ```cd ${k8_scalar_dir}/secrets```
- ```cp ~/.kube/config .```

**Additional instructions for Minikube**

First the following keys need to be copied as well

```
cp ~/.minikube/ca.crt .
cp ~/.minikube/profiles/minikube/client.crt .
cp ~/.minikube/profiles/minikube/client.key .
```
Secondly, change all absolute paths in the  `config` file to the location at which these secrets are mounted by the `experiment-controller` and `arba` Helm charts, i.e. `/root/.kube`. The directories `minikube` and `minikube/profiles/minikube`  of the local machine must be changed to `/root/.kube`. You can either do it manually or modify and execute one of the following two sed scripts:

*Windows*

Replace manually 'eddy' with your username stored in $my_username
```
sed -i 's/C:\\Users\\eddy\\.minikube\\profiles\\minikube\\/\/root\/.kube\//g' ./config
sed -i 's/C:\\Users\\eddy\\.minikube\\/\/root\/.kube\//g' ./config
```

*Linux/MacOS*

```
sed -i "s,${HOME}/.minikube/\(profiles/minikube/\|\),/root/.kube/,g" ./config
```

### Creating the secret

Finally, the following command will create the secret. You will have to create the same secret in two different namespaces.  Do note that the keys required depend on the platform that you have your cluster deployed on.

```
#Secret for ARBA that runs in the kube-system namespace
kubectl create secret generic kubeconfig --from-file . --namespace=kube-system
```
```
#The same secret for the experiment-controller that runs in default namespace
kubectl create secret generic kubeconfig --from-file . 
```

## Create new nodes

```minikube node add`` (twice, once for m02, once for m03)

## Start experiment controllers from cap_k8 (repeat for aggressive)

1. ```helm install ${k8_scalar_dir}/experiment-controller-normal --generate-name```
1. ```kubectl -it exec experiment-controller-normal-0 -- bash```
3. ```kubectl exec -it experiment-controller-normal-0 --  "touch /exp/var/logs/console-log.txt; java -jar /exp/lib/scalar-1.0.0.jar /exp/etc/platform.properties /tmp/experiment.properties >> /exp/var/logs/console-log.txt"```
4. ```kubectl exec -it experiment-controller-normal-0 --  "java -jar /exp/lib/scalar-1.0.0.jar /exp/etc/platform.properties /tmp/experiment.properties >> /exp/var/logs/console-log.txt"```

Results are found in the respective homefolder

