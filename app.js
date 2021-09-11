/**
 * Module dependencies.
 */
 require("dotenv").config();
 const cors = require("cors")
 const path = require('path');
 const chalk = require('chalk')
 const logger = require('morgan');
 const express = require ("express")
 const mongoose = require("mongoose")
 const errorHandler = require('errorhandler');
 const session = require('express-session');
 const UserRoutes = require("./AppModules/UserAuth.module/auth.routes")
 const AdminRoutes = require("./AppModules/Admin.module/admin.routes")
 
 const {MONGODB_URI, SESSION_SECRET} = require("./config/index")
 

 const {isAuth} =require("./Utils/isAuth")
 
 
  /**
   * Create Express server.
   */
  const app = express();
  
  /**
   * Routers
   */
  
  
  /** 10100000
   * Connect to MongoDB.
   */
  mongoose.set('useFindAndModify', false);
  mongoose.set('useCreateIndex', true);
  mongoose.set('useNewUrlParser', true);
  mongoose.Promise = Promise;
  mongoose.connect(MONGODB_URI, { useUnifiedTopology: true }, () => console.log("Database connection successful."));
  mongoose.connection.on('error', (err) => {
    console.error(err);
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
    process.exit();
  });
  
  /**
   * Express configuration.
   */
  app.set('host', process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
  app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 3003);
  
  if (process.env.NODE_ENV === 'development') {
    app.use(logger('dev'));
  }
  app.set("view engine", "ejs")
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));
  app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: SESSION_SECRET,
    cookie: { maxAge: 1209600000 }, // two weeks in milliseconds
  }));
  app.use(cors());
  app.use('/', express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
  
  /**
   * Notes routes.
   */
  app.use("/user", UserRoutes)
  app.use("/admin", AdminRoutes)
  
  /**
   * Error Handler.
   */
  if (process.env.NODE_ENV === 'development') {
    // only use in development
    app.use(errorHandler());
  } else {
    app.use((err, req, res, next) => {
      console.error(err);
      res.status(500).send('Server Error');
    });
  }
  
  /**
   * Start Express server.
   */
  app.listen(app.get('port'), () => {
    console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
    console.log('  Press CTRL-C to stop\n');
  });
  
  module.exports = app;
  