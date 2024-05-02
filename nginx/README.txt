requirements: minikube addons enable ingress

om ingress regels te plaatsen:
kubectl apply -f ingress.yaml -n [namespace van de saas-app]

in de experiment.conf file als targeturl: [naam nginx service].[naam nginx namespace]