# Dashboard Deelmobiliteit: frontend app

This is the frontend app of [dashboarddeelmobiliteit.nl](https://dashboarddeelmobiliteit.nl/), bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

The goal of this app is to give insightful information on the use of shared mobility in The Netherlands.
- Not logged in users can see where shared vehicles are at the current moment
- Logged in users (municipalities) can see more indepth insights

The app uses the [API](https://gitlab.com/bikedashboard/dashboard-api) to get its data. The API gets its data from the postgresql database. The postgresql database is filled with data from the [go-import-vehicles](https://gitlab.com/bikedashboard/go-import-vehicles) script, that sources the data from all the different shared mobility providers.

Dashboard Deelmobiliteit is a project by non profit organisation [CROW](https://crow.nl/). Tips, comments or questions? Contact the team at info@deelfietsdashboard.nl!

## How to deploy?

If you run

    npm run deploy

the updated app will be deployed to GitHub pages. You can then view the app at https://dashboarddeelmobiliteit.nl

## How to add layers and sources?

Add your sources here:
- `components/Map/sources.js`
- `pollApi/`

Activate the layers&sources per page:
 - `src/pages/MapPage.jsx`

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Problems solved

### GitHub pages sais: y is not defined

Solved problem like this: https://github.com/alex3165/react-mapbox-gl/issues/931#issuecomment-826135957

### Github forgets custom domain gh-pages

The custom domain name in GitHub settings did reset on every deploy to gh-pages.

Adding a file named `CNAME` into the build folder fixed this: https://github.com/gitname/react-gh-pages/issues/19#issuecomment-436148409

### Github doesn't support Single Page App routing

I.e. /route/route-name gives an 404.

I solved this by implementing this hack: https://create-react-app.dev/docs/deployment/#notes-on-client-side-routing

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `yarn build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
