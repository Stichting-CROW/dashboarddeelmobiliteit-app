FROM node:18 AS builder

WORKDIR /usr/src/app

# Build-time configuration. Create React App bakes REACT_APP_* variables into
# the bundle at build time, so they must be set here (not at runtime).
# Defaults point at the public production backend of dashboarddeelmobiliteit.nl;
# override them with --build-arg (or service variables on platforms like
# Railway, which pass them to declared ARGs automatically).
ARG REACT_APP_MAPBOX_TOKEN=pk.eyJ1IjoibmluZTMwMzAiLCJhIjoiY2t2OW1zaTJoMmJnaTJ1czNyMDhhcmFxcSJ9.tHuHTDUPf53RsGBgxZmk2g
ARG REACT_APP_FUSIONAUTH_APPLICATION_ID=bf901170-a2db-4f91-8ca7-24921e961193
ARG REACT_APP_FUSIONAUTH_URL=https://auth.dashboarddeelmobiliteit.nl
ARG REACT_APP_MAIN_API_URL=https://api.dashboarddeelmobiliteit.nl
ARG REACT_APP_MDS_URL=https://mds.dashboarddeelmobiliteit.nl
ENV REACT_APP_MAPBOX_TOKEN=$REACT_APP_MAPBOX_TOKEN \
    REACT_APP_FUSIONAUTH_APPLICATION_ID=$REACT_APP_FUSIONAUTH_APPLICATION_ID \
    REACT_APP_FUSIONAUTH_URL=$REACT_APP_FUSIONAUTH_URL \
    REACT_APP_MAIN_API_URL=$REACT_APP_MAIN_API_URL \
    REACT_APP_MDS_URL=$REACT_APP_MDS_URL

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM ghcr.io/static-web-server/static-web-server:2-alpine

# Single-page app: serve index.html for client-side routes like /stats
ENV SERVER_ROOT=/public \
    SERVER_FALLBACK_PAGE=/public/index.html

COPY --from=builder /usr/src/app/build /public
