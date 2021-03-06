'use strict';

import * as express from 'express';
import * as path from 'path';
import * as favicon from 'serve-favicon';
import * as logger from 'morgan';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import index from './routes/index';
import * as ejs from 'ejs';
import * as jwt from 'express-jwt';
import * as privateConfig from './environments/private.config';

const app: express.Express = express();

//view engine setup

app.set('views',path.join(__dirname,'views'));
app.engine('.html',ejs.renderFile);
app.set('view engine','html');

//uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname,'public','favicon.ico')));
app.use(cors());

const authCheck = jwt({
  secret: privateConfig.configs.auth0.secret,
  audience: privateConfig.configs.auth0.clientId
});

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname,'public')));

app.use('/', authCheck);

app.use('/', index)

//catch 404 and forward to error handler
app.use((req,res,next) => {
  var err = new Error('Not Found');
  err['status'] = 404;
  next(err);
});

//error handlers

//development error handler
//will print stacktrace
if(process.env.NODE_ENV === 'development') {
  app.use((err: Error,req,res,next) => {
    res.status(err['status'] || 500);
    res.render('error',{
      title: 'error',
      message: err.message,
      error: err
    });
  });    
}

//production error handler
// no stacktrace leaked to user
app.use((err: Error,req,res,next) => {
  res.status(err['status'] || 500);
  res.render('error',{
    title: 'error',
    message: err.message,
    error: {}
  });
});

export default app;
