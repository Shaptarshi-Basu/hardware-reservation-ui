# Hardware reservation UI

Implementation that allows to visualize the current reservation status of environments and enables manual reserve and unreserve and environment

## Getting started

### `npm install`

Installs all the dependent packages from the package json filr

### Edit the .env file

```
REACT_APP_REST_API_IP=localhost
REACT_APP_REST_API_PORT=:7070
```

The value are edited to point to the IP and port where the NEAT Hardware Reservation API is hosted

### `npm start`


Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### Deployment

WIP ! Dockerile has been added. Future helm manifests to be added to enable kube deployment and orchestration.


