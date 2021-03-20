dev:
	docker run -v $(shell pwd):/web -p 8080:8080 halverneus/static-file-server:latest

.PHONY: dev
