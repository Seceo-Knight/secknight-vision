const Trello = require("trello");
const moment = require('moment');
const axios = require("axios");

const TrelloModel = require('./Trello.model');
const Helper = require('./Trello.helper');
const orgService = require('../../shared/integrations/Organization');
const ProjectService = require('../../shared/integrations/Project');
const ListService = require('../../shared/integrations/List');
const TodoService = require('../../shared/integrations/Todo');
const CheckListService = require('../../shared/integrations/Checklist');
const CheckItemService = require('../../shared/integrations/CheckItem');

const key = process.env.TRELLO_API_KEY || 'YOUR_TRELLO_API_KEY'
const token = process.env.TRELLO_API_TOKEN || 'YOUR_TRELLO_API_TOKEN'
const memberId = '5cdbb901eb1a1f7ef824c5bb'

/**
 * Organizations >> Board   >> List >> Card >> Checklists >> CheckItems
 * Ogranizations >> Project >> Task >> subtasks
 * Ogranizations >> Project >> List >> Task >> Checklists >> subtasks
 *
 * @class TrelloControllers
 */
class TrelloControllers {

    constructor() {
        this.key = process.env.TRELLO_KEY;
        this.secret = process.env.TRELLO_OAUTH_SECRET;
    }

    async getOrgs(req, res) {
        const { access_token, member_id } = res.integrationData;
        const options = {
            method: 'GET',
            url: `https://api.trello.com/1/members/${member_id}/organizations`,
            qs: { key: this.key, token: access_token }
        };

        try {
            const response = await axios({ method: options.method, url: options.url, params: options.qs });
            return res.json({ success: true, data: response.data });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: err.message });
        }
    }

    getBoards(req, res) {
        const { access_token, member_id } = res.integrationData;

        const trello = new Trello(this.key, access_token);
        trello.getBoards(member_id, (err, data) => {
            if (err) {
                console.error(err)
                return res.status(500).json({ success: false, error: err.response.rawEncoded });
            }
            res.json({ success: true, data })
        });
    }

    getOrgBoards(req, res) {
        const orgId = req.params.id;
        const { access_token } = res.integrationData;

        const trello = new Trello(this.key, access_token);
        trello.getOrgBoards(orgId, (err, data) => {
            if (err) {
                console.error(err)
                return res.status(500).json({ success: false, error: err.response.rawEncoded });
            }
            res.json({ success: true, data })
        });
    }

    async getListsOnBoard(req, res) {
        const boardId = req.params.id;
        const { access_token } = res.integrationData;

        try {
            const data = await Helper.getListsOnBoard(this.key, access_token, boardId);
            res.json({ success: true, data })
        } catch (err) {
            console.error(err)
            return res.status(500).json({ success: false, error: err.response.rawEncoded });
        }
    }

    getCardsOnList(req, res) {
        const listId = req.params.id;
        const { access_token } = res.integrationData;

        const trello = new Trello(this.key, access_token);
        trello.getCardsOnList(listId, (err, data) => {
            if (err) {
                console.error(err)
                return res.status(500).json({ success: false, error: err.response.rawEncoded });
            }
            res.json({ success: true, data })
        })
    }

    getChecklistsOnCard(req, res) {
        const cardId = req.params.id;
        const { access_token } = res.integrationData;

        const trello = new Trello(this.key, access_token);
        trello.getChecklistsOnCard(cardId, (err, data) => {
            if (err) {
                console.error(err)
                return res.status(500).json({ success: false, error: err.response.rawEncoded });
            }
            res.json({ success: true, data })
        })
    }

    async insertOrg(req, res) {
        const orgId = req.params.id;
        const creds = { key: this.key, ...res.integrationData };

        const trello = new Trello(this.key, creds.access_token);

        try {
            const boards = await trello.getOrgBoards(orgId);

            if (!boards || boards.length === 0) {
                return res.status(404).json({ success: false, error: 'boards not found.' });
            }

            const orgInsertResponse = await Helper.getAndInsertOrg(creds, orgId);

            for (const board of boards) {
                const boardInsertResponse = await Helper.insertBoard(creds, orgInsertResponse.insertId, board);
                console.log('boardInsertResponse ==> ', boardInsertResponse);

                const lists = await Helper.getListsOnBoard(key, token, board.id);

                for (const list of lists) {
                    const listInsertResponse = await Helper.insertList(boardInsertResponse.insertId, list);
                    console.log('listInsertResponse ==> ', listInsertResponse);

                    // CARD = TODO/TASK
                    for (const card of list.cards) {
                        const cardInsertResponse = await Helper.insertCard(boardInsertResponse.insertId, listInsertResponse.insertId, card);
                        console.log('cardInsertResponse ==> ', cardInsertResponse);


                        const checklists = await trello.getChecklistsOnCard(card.id);

                        for (const checklist of checklists) {
                            const checkListInsertResponse = await Helper.insertCheckList(cardInsertResponse.insertId, checklist);
                            console.log('checkListInsertResponse ==> ', checkListInsertResponse);

                            if (checklist.checkItems.length > 0) {
                                const checkItemValues = checklist.checkItems.map(
                                    e => `("${e.id}", "${e.name}", "${e.state}", ${checkListInsertResponse.insertId}, "${e.idChecklist}", 1)`
                                ).join(',');

                                const checkItemsInsertResponse = await CheckItemService.bulkInsertCheckItem(checkItemValues);
                                console.log('checkItemsInsertResponse ==> ', checkItemsInsertResponse);
                            }
                        }
                    }
                }
            }
            res.json({ success: true });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: err.response ? err.response.rawEncoded : err.message });
        }
    }

    async syncProject(req, res) {
        const boardId = req.params.id;
        const creds = { key: this.key, ...res.integrationData };

        const trello = new Trello(this.key, creds.access_token);

        try {
            const board = await Helper.getBoard(this.key, creds.access_token, boardId);
            if (!board) {
                return res.status(404).json({ success: false, error: 'board not found.' });
            }

            const orgId = board.idOrganization;
            const org = await Helper.getOrg(creds.key, creds.access_token, orgId);
            const orgInsertResponse = await Helper.upsertOrg(creds, org);
            const boardInsertResponse = await Helper.upsertBoard(creds, orgInsertResponse.insertId, board);
            console.log('boardInsertResponse ==> ', boardInsertResponse);

            const lists = await Helper.getListsOnBoard(key, token, board.id);

            for (const list of lists) {
                const listInsertResponse = await Helper.upsertList(boardInsertResponse.insertId, list);
                console.log('listInsertResponse ==> ', listInsertResponse);

                // CARD = TODO/TASK
                for (const card of list.cards) {
                    const cardInsertResponse = await Helper.upsertCard(boardInsertResponse.insertId, listInsertResponse.insertId, card);
                    console.log('cardInsertResponse ==> ', cardInsertResponse);


                    const checklists = await trello.getChecklistsOnCard(card.id);

                    for (const checklist of checklists) {
                        const checkListInsertResponse = await Helper.upsertCheckList(cardInsertResponse.insertId, checklist);
                        console.log('checkListInsertResponse ==> ', checkListInsertResponse);

                        if (checklist.checkItems.length > 0) {
                            const checkItemsInsertResponse = await Helper.bulkUpsertCheckItems(checkListInsertResponse.insertId, checklist.checkItems);
                            console.log('checkItemsInsertResponse ==> ', checkItemsInsertResponse);
                        }
                    }
                }
            }
            res.json({ success: true });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: err.response ? err.response.rawEncoded : err.message });
        }
    }

}

module.exports = new TrelloControllers;

function listInsertParallel(boardInsertResponse, lists) {
    let promises = [];

    lists.forEach(list => {
        const data = {
            ext_list_id: list.id,
            name: list.name,
            project_id: boardInsertResponse.insertId,
            board_id: list.idBoard,
            closed: list.closed,
            status: 1
        };

        promises.push(ListService.insertList(data));
    });

    return new Promise((resolve, reject) => {
        Promise
            .all(promises)
            .then((data) => resolve({ error: null, listInsertResponse: data }))
            .catch((e) => resolve({ error: e, listInsertResponse: null }));
    });
}



const req = {
    decoded: {
        jsonData: {
            admin_id: 1,
            id: 1
        }
    }
}

// const admin_id = req['decoded'].jsonData.admin_id;
// const manager_id = req['decoded'].jsonData.id;
// const orgId = '5e44f447c978b1310fa324e9';
// const access_token = process.env.TRELLO_API_TOKEN || 'YOUR_TRELLO_API_TOKEN'
// const integration_id = 1
// const integration_creds_id = 1
// const trello = new Trello(key, access_token);

// syncOrg()
async function syncOrg() {
    // const orgId = req.params.id;
    // const { access_token, member_id } = res.integrationData;

    // const trello = new Trello(this.key, access_token);

    try {
        // const org = await Helper.getOrg(key, access_token, orgId);
        // let orgData = {
        //     name: org.displayName,
        //     integration_id,
        //     integration_creds_id,
        //     ext_org_id: org.id,
        //     admin_id: admin_id,
        //     manager_id: manager_id
        // };
        // const orgInsertResponse = await orgService.insertOrganisation(orgData);
        const creds = { key, access_token, integration_id, integration_creds_id, admin_id, manager_id };

        const orgInsertResponse = await Helper.getAndInsertOrg(creds, orgId);
        // console.log(org)
        console.log(orgInsertResponse)

        const boards = await trello.getOrgBoards(orgId);

        if (!boards || boards.length === 0) {
            return console.log({ success: false, error: 'boards not found.' });
            // return res.status(404).json({ success: false, error: 'boards not found.' });
        }

        for (const board of boards) {
            // boardData = {
            //     name: board.name,
            //     description: board.desc,
            //     admin_id: admin_id,
            //     manager_id: manager_id,
            //     ext_project_id: board.id,
            //     integration_org_id: orgInsertResponse.insertId,
            //     start_date: '0000-00-00 00:00:00',
            //     end_date: '0000-00-00 00:00:00',
            //     actual_start_date: '0000-00-00 00:00:00',
            //     actual_end_date: '0000-00-00 00:00:00',
            //     status: board.closed ? 0 : 1,
            //     progress: 0
            // }

            // const boardInsertResponse = await ProjectService.insertProject(boardData);
            const boardInsertResponse = await Helper.insertBoard(creds, orgInsertResponse.insertId, board);
            console.log('boardInsertResponse ==> ', boardInsertResponse);

            const lists = await Helper.getListsOnBoard(key, token, board.id);

            for (const list of lists) {
                // const listData = {
                //     ext_list_id: list.id,
                //     name: list.name,
                //     project_id: boardInsertResponse.insertId,
                //     board_id: list.idBoard,
                //     closed: list.closed,
                //     status: 1
                // };

                // const listInsertResponse = await ListService.insertList(listData);
                const listInsertResponse = await Helper.insertList(boardInsertResponse.insertId, list);
                console.log('listInsertResponse ==> ', listInsertResponse);

                // CARD = TODO/TASK
                for (const card of list.cards) {
                    // const progress = (card.badges.checkItemsChecked / card.badges.checkItems) * 100;
                    // const due = card.due ? moment(card.due).utc().format('YYYY:MM:DD HH:mm:SS') : "0000:00:00 00:00:00";
                    // const cardData = {
                    //     ext_id: card.id,
                    //     name: card.name,
                    //     description: card.desc,
                    //     project_id: boardInsertResponse.insertId,
                    //     project_list_id: listInsertResponse.insertId,
                    //     list_id: card.idList,
                    //     check_list_ids: card.idChecklists.toString(),
                    //     check_items: card.badges.checkItems,
                    //     check_items_checked: card.badges.checkItemsChecked,
                    //     due_date: due,
                    //     due_complete: card.dueComplete,
                    //     start_date: "0000:00:00 00:00:00",
                    //     end_date: "0000:00:00 00:00:00",
                    //     status: card.closed ? 3 : 1,
                    //     progress: progress
                    // }

                    // const cardInsertResponse = await TodoService.insertTodo(cardData);
                    const cardInsertResponse = await Helper.insertCard(boardInsertResponse.insertId, listInsertResponse.insertId, card);
                    console.log('cardInsertResponse ==> ', cardInsertResponse);


                    const checklists = await trello.getChecklistsOnCard(card.id);

                    for (const checklist of checklists) {
                        // const checklistData = {
                        //     ext_id: checklist.id,
                        //     name: checklist.name,
                        //     todo_id: cardInsertResponse.insertId,
                        //     board_id: checklist.idBoard,
                        //     card_id: checklist.idCard,
                        //     check_items: checklist.checkItems.length,
                        //     status: 1
                        // }

                        // const checkListInsertResponse = await CheckListService.insertCheckList(checklistData);
                        const checkListInsertResponse = await Helper.insertCheckList(cardInsertResponse.insertId, checklist);
                        console.log('checkListInsertResponse ==> ', checkListInsertResponse);

                        if (checklist.checkItems.length > 0) {
                            const checkItemValues = checklist.checkItems.map(
                                e => `("${e.id}", "${e.name}", "${e.state}", ${checkListInsertResponse.insertId}, "${e.idChecklist}", 1)`
                            ).join(',');

                            const checkItemsInsertResponse = await CheckItemService.bulkInsertCheckItem(checkItemValues);
                            console.log('checkItemsInsertResponse ==> ', checkItemsInsertResponse);
                        }
                    }
                }
            }
        }

        console.log('completed...')
    } catch (err) {
        console.error(err)
        // return res.status(500).json({ success: false, error: err.response.rawEncoded });
    }
}