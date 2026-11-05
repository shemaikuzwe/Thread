## K8s cluster

Secrets are kept out of git use this commands(imperative) to create one.

### 1. Install helm charts
Redis

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm installredis bitnami/redis --version 28.3.12 --namespace=app
```
Postgres
```bash
helm install my-postgresql bitnami/postgresql --version 18.12.18 --namespace=app
```
Gather their passwords create respective secrets.


### 2. Create database url env
```bash

printf "dburl" | kubectl create secret generic database-url --from-file=DATABASE_URL=/dev/stdin --namespace=app
```

### 3. Create api env secret
```bash
   kubectl create secret generic api-gateway-secretsv1 --from-env-file=apps/api/.env.prod --namespace=app
```
### 4. Create notification env secret
```bash
   kubectl create secret generic notification-secretsv1 --from-env-file=apps/notification/.env.prod --namespace=app
```
### 5. Create web secret
```bash
   kubectl create secret generic web-secretsv1 --from-env-file=apps/web/.env.prod --namespace=app
```
### 6. Setup NGF(nginx gateway fabric) 


```bash
kubectl kustomize "https://github.com/nginx/nginx-gateway-fabric/config/crd/gateway-api/standard?ref=v2.6.3" | kubectl apply -f -
kubectl apply --server-side -f https://raw.githubusercontent.com/nginx/nginx-gateway-fabric/v2.6.3/deploy/crds.yaml
kubectl apply -f https://raw.githubusercontent.com/nginx/nginx-gateway-fabric/v2.6.3/deploy/nodeport/deploy.yaml
```
Path also needed 
```bash
kubectl patch nginxproxy nginx-gateway-proxy-config -n nginx-gateway --type=merge \
  -p '{"spec":{"kubernetes":{"deployment":{"pod":{"nodeSelector":{"node-role.kubernetes.io/control-plane":""},"tolerations":[{"key":"node-role.kubernetes.io/control-plane","operator":"Exists","effect":"NoSchedule"}]}},"service":{"nodePorts":[{"port":30080,"listenerPort":80}]}}}}'

```