#! /bin/bash
for sla in `ls slas` 
  do 
   namespace=`sed -e 's#.*_\(\)#\1#' <<< ${sla}`
   # echo SLA configuration ${namespace}
   # echo ==============================
    echo $sla
    echo $namespace
    exit

   kubectl create -f slas/${sla}/namespace.yaml     # maak namespace
   kubectl create -f resourcequota/compute-resources.yaml --namespace=${namespace}  # limits per namespace
   kubectl create -f slas/${sla}/limits.yaml --namespace=${namespace}   # limits per pod
   kubectl create -f deploy_saas_kube.yaml --namespace=${namespace}     # deploy 1 replica
   kubectl create -f expose.yaml --namespace=${namespace}               # maak service
   kubectl get pods --namespace=${namespace}
   kubectl describe service saas --namespace=${namespace}
  done

