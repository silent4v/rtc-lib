## Setup Environment
1. Install [Node.js](https://nodejs.org/en/download/)
1. Install [yarn](https://yarnpkg.com/getting-started/install)
1. Install dependence: `yarn install`

## Build and Run
1. Run build: `yarn run build`
1. Run server: `yarn run serve`
1. Run server in debug:
```
npx cross-env DEBUG=* node release/server
```

## Build Docker Image
```
docker build -t chatserver .
```

## Run Docker Container
```
docker run -it --rm -p 80:30000 chatserver
```
