const router = require('express').Router();

const TrelloAuth = require('./Trello.auth');
const Trello = require('./Trello.controller');
const Middleware = require('./Trello.middleware');

class TrelloRoutes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.get('/auth/login', (req, res) => TrelloAuth.authenticate(req, res));
        this.myRoutes.get('/auth/callback', (req, res) => TrelloAuth.callback(req, res));

        this.myRoutes.use(Middleware.getIntegration);

        this.myRoutes.get('/orgs', (req, res) => Trello.getOrgs(req, res));
        this.myRoutes.get('/boards', (req, res) => Trello.getBoards(req, res));
        this.myRoutes.get('/orgs/:id/boards', (req, res) => Trello.getOrgBoards(req, res));
        this.myRoutes.get('/boards/:id/lists', (req, res) => Trello.getListsOnBoard(req, res));
        this.myRoutes.get('/lists/:id/cards', (req, res) => Trello.getCardsOnList(req, res));
        this.myRoutes.get('/cards/:id/checklists', (req, res) => Trello.getChecklistsOnCard(req, res));

        this.myRoutes.get('/orgs/:id/import', (req, res) => Trello.insertOrg(req, res));
        this.myRoutes.get('/boards/:id/sync', (req, res) => Trello.syncProject(req, res));
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = new TrelloRoutes;