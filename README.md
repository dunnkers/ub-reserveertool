# UB reserveertool
By Jeroen Overschie

## Pushing backend to Docker Hub
1. `docker build -t ub-backend .`
2. `docker tag ub-backend:latest dunnkers/ub-reserveertool:backend`
3. `docker push dunnkers/ub-reserveertool:backend`
4. `kubectl delete deployments/ub-backend`
5. `kubectl apply -f gcp.yaml`


```shell
docker build -t ub-backend .
docker tag ub-backend:latest dunnkers/ub-reserveertool:backend
docker push dunnkers/ub-reserveertool:backend
kubectl delete deployments/ub-backend
kubectl apply -f gcp.yaml
```

## Backend usage

Test using curl as such:

```shell
curl localhost:3001/reservations -H "Content-Type: application/x-www-form-urlencoded" -X POST -d "email=..."
```