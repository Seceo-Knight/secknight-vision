const router = require('express').Router();
const passport = require('passport');

const JiraAuth = require('./Jira.Auth');
const Jira = require('./Jira.controller');
const Middleware = require('./Jira.middleware');

class JiraRoutes {
    constructor() {
        this.myRoutes = router;
        passport.serializeUser((user, done) => done(null, user));
        passport.deserializeUser((obj, done) => done(null, obj));
        this.core();
    }

    core() {
        this.myRoutes.get(
            '/auth/login',
            passport.authenticate('atlassian'),
            (req, res) => JiraAuth.authenticate(req, res)
        );
        this.myRoutes.get(
            '/auth/callback',
            passport.authenticate('atlassian'),
            (req, res) => JiraAuth.callback(req, res)
        );
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = new JiraRoutes;