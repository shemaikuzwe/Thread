## K8s cluster

Secrets are kept out of git use this commands(imperative) to create one.

### 1. Create db password secret
```bash
openssl rand -hex 8
printf "generated code"| kubectl create secret generic postgres-password  --from-file=POSTGRES_PASSWORD/dev/stdin --namespace=app
```

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
