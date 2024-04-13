#! /bin/bash

sla="limitrange_bronze"
namespace=`sed -e 's#.*_\(\)#\1#' <<< ${sla}`
echo SLA configuration ${namespace}
echo ==============================
# echo $sla
# echo $namespace
# exit


kubectl delete -f resourcequota/compute-resources.yaml --namespace=${namespace}
kubectl delete -f slas/${sla}/limits.yaml --namespace=${namespace}
kubectl delete -f deploy_saas_kube.yaml --namespace=${namespace}
kubectl delete -f expose.yaml --namespace=${namespace}
kubectl delete -f slas/${sla}/namespace.yaml

