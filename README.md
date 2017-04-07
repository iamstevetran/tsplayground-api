# tsplayground-api
This is API repo for [tsplayground](https://github.com/tsplayground/tsplayground)

## How to?
### Setup
- Navigate to repo's root folder.
- Run command `npm install` to install repo's dependencies.
- Run command `cp src/environments/private.config.example.ts src/environments/private.config.ts ` to create private config and fill in your **Auth0** client info. If you haven't have one, create it [here](https://auth0.com/).
- Run command `node_modules/.bin/tsc` to compile Typescript files.

### Start dev server
- Run command `npm install -g nodemon` to install webserver *(optional)*.
- Run command `nodemon app/bin/www.js --ignore app/ts-sandboxes/` to start dev server *(optional)*.
- Now API live at `http://localhost:3000`.

### Get UI to work
- Check the docs [here](https://github.com/tsplayground/tsplayground-ui/blob/master/README.md);