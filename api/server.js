const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session')
const knex = require('../data/dbConfig.js')

const restrict = require('./middleware/restricted.js');

const authRouter = require('./auth/auth-router.js');
const jokesRouter = require('./jokes/jokes-router.js');

const server = express();

server.use(
    session({
        name:'idk',
        secret: 'uuhh shh',
        saveUninitialized: false,
        resave: false,
        store: new session.MemoryStore({
            knex,
            createTable: true,
            clearInterval: 1000 * 60 * 10,
            tablename: 'sessions',
            sidfieldname: 'sid',
        }),
        cookie: {
            maxAge: 1000 * 60 * 10,
            secure: false,
            httpOnly: true
        }
    })
)

server.use(helmet());
server.use(cors());
server.use(express.json());

server.use('/api/auth', authRouter);
server.use('/api/jokes', restrict, jokesRouter); // only logged-in users should have access!

module.exports = server;
