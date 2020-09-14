# UB reserveertool
By Jeroen Overschie

## Pushing backend to Docker Hub
1. `docker build -t ub-backend .`
2. `docker tag ub-backend:latest dunnkers/ub-reserveertool:backend`
3. `docker push dunnkers/ub-reserveertool:backend`
4. `kubectl delete deployments/ub-backend`
5. `kubectl apply -f gcp.yaml`