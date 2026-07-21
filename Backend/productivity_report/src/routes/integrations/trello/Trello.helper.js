const moment = require('moment');
const axios = require("axios");

const orgService = require('../../shared/integrations/Organization');
const ProjectService = require('../../shared/integrations/Project');
const ListService = require('../../shared/integrations/List');
const TodoService = require('../../shared/integrations/Todo');
const CheckListService = require('../../shared/integrations/Checklist');
const CheckItemService = require('../../shared/integrations/CheckItem');

class TrelloHelper {

    async getOrgs(key, access_token, member_id) {
        const response = await axios.get(`https://api.trello.com/1/members/${member_id}/organizations`, {
            params: { key, token: access_token }
        });
        return response.data;
    }

    async getOrg(key, access_token, orgId) {
        const response = await axios.get(`https://api.trello.com/1/organizations/${orgId}`, {
            params: { key, token: access_token }
        });
        return response.data;
    }

    async getBoard(key, access_token, boardId) {
        const response = await axios.get(`https://api.trello.com/1/boards/${boardId}`, {
            params: { key, token: access_token }
        });
        return response.data;
    }

    async getListsOnBoard(key, access_token, boardId) {
        const response = await axios.get(`https://api.trello.com/1/boards/${boardId}/lists`, {
            params: {
                cards: 'all',
                card_fields: 'all',
                filter: 'open',
                fields: 'all',
                key,
                token: access_token
            }
        });
        return response.data;
    }

    getDbOrg(creds, idOrganization) {
        const { integration_id, integration_creds_id, admin_id } = creds;
        let filter = `
            integration_id = ${integration_id} AND
            integration_creds_id = ${integration_creds_id} AND
            ext_org_id = "${idOrganization}" AND
            admin_id = ${admin_id}
        `;

        return orgService.getOrganisation(filter);
    }

    getDbProject(creds, boardId, dbOrgId) {
        const { admin_id } = creds;
        let filter = `
            integration_org_id = ${dbOrgId} AND
            ext_project_id = "${boardId}" AND
            admin_id = ${admin_id}
        `;

        return orgService.getOrganisation(filter);
    }

    async getAndInsertOrg(creds, orgId) {
        const { key, access_token, integration_id, integration_creds_id, admin_id, manager_id } = creds;
        try {
            const org = await this.getOrg(key, access_token, orgId);

            const orgData = {
                name: org.displayName,
                integration_id,
                integration_creds_id,
                ext_org_id: org.id,
                admin_id: admin_id,
                manager_id: manager_id
            };
            const orgInsertResponse = await orgService.insertOrganisation(orgData);

            return new Promise((resolve, reject) => resolve(orgInsertResponse));
        } catch (err) {
            return new Promise((resolve, reject) => reject(err));
        }
    }

    insertBoard(creds, integration_org_id, data) {
        const boardData = {
            name: data.name,
            description: data.desc,
            admin_id: creds.admin_id,
            manager_id: creds.manager_id,
            ext_project_id: data.id,
            integration_org_id: integration_org_id,
            start_date: '0000-00-00 00:00:00',
            end_date: '0000-00-00 00:00:00',
            actual_start_date: '0000-00-00 00:00:00',
            actual_end_date: '0000-00-00 00:00:00',
            status: data.closed ? 0 : 1,
            progress: 0
        }

        return ProjectService.insertProject(boardData);
    }

    insertList(project_id, data) {
        const listData = {
            ext_list_id: data.id,
            name: data.name,
            project_id: project_id,
            board_id: data.idBoard,
            closed: data.closed,
            status: 1
        };

        return ListService.insertList(listData);
    }

    insertCard(project_id, project_list_id, data) {
        const progress = (data.badges.checkItemsChecked / data.badges.checkItems) * 100;
        const due = data.due ? moment(data.due).utc().format('YYYY:MM:DD HH:mm:SS') : "0000:00:00 00:00:00";
        const cardData = {
            ext_id: data.id,
            name: data.name,
            description: data.desc,
            project_id,
            project_list_id,
            list_id: data.idList,
            check_list_ids: data.idChecklists.toString(),
            check_items: data.badges.checkItems,
            check_items_checked: data.badges.checkItemsChecked,
            due_date: due,
            due_complete: data.dueComplete,
            start_date: "0000:00:00 00:00:00",
            end_date: "0000:00:00 00:00:00",
            status: data.closed ? 3 : 1,
            progress: progress
        }

        return TodoService.insertTodo(cardData);
    }

    insertCheckList(todo_id, data) {
        const checklistData = {
            ext_id: data.id,
            name: data.name,
            todo_id,
            board_id: data.idBoard,
            card_id: data.idCard,
            check_items: data.checkItems.length,
            status: 1
        }

        return CheckListService.insertCheckList(checklistData);
    }

    upsertOrg(creds, org) {
        const { integration_id, integration_creds_id, admin_id, manager_id } = creds;
        const orgData = {
            name: org.displayName,
            integration_id,
            integration_creds_id,
            ext_org_id: org.id,
            admin_id,
            manager_id
        };

        return orgService.upsertOrganisation(orgData);
    }

    upsertBoard(creds, integration_org_id, data) {
        const boardData = {
            name: data.name,
            description: data.desc,
            admin_id: creds.admin_id,
            manager_id: creds.manager_id,
            ext_project_id: data.id,
            integration_org_id: integration_org_id,
            start_date: '0000-00-00 00:00:00',
            end_date: '0000-00-00 00:00:00',
            actual_start_date: '0000-00-00 00:00:00',
            actual_end_date: '0000-00-00 00:00:00',
            status: data.closed ? 0 : 1,
            progress: 0
        }

        return ProjectService.upsertProject(boardData);
    }

    upsertList(project_id, data) {
        const listData = {
            ext_list_id: data.id,
            name: data.name,
            project_id: project_id,
            board_id: data.idBoard,
            closed: data.closed,
            status: 1
        };

        return ListService.upsertList(listData);
    }

    upsertCard(project_id, project_list_id, data) {
        const progress = (data.badges.checkItemsChecked / data.badges.checkItems) * 100;
        const due = data.due ? moment(data.due).utc().format('YYYY:MM:DD HH:mm:SS') : "0000:00:00 00:00:00";
        const cardData = {
            ext_id: data.id,
            name: data.name,
            description: data.desc,
            project_id,
            project_list_id,
            list_id: data.idList,
            check_list_ids: data.idChecklists.toString(),
            check_items: data.badges.checkItems,
            check_items_checked: data.badges.checkItemsChecked,
            due_date: due,
            due_complete: data.dueComplete,
            start_date: "0000:00:00 00:00:00",
            end_date: "0000:00:00 00:00:00",
            status: data.closed ? 3 : 1,
            progress: progress
        }

        return TodoService.upsertTodo(cardData);
    }

    upsertCheckList(todo_id, data) {
        const checklistData = {
            ext_id: data.id,
            name: data.name,
            todo_id,
            board_id: data.idBoard,
            card_id: data.idCard,
            check_items: data.checkItems.length,
            status: 1
        }

        return CheckListService.upsertCheckList(checklistData);
    }

    bulkUpsertCheckItems(checklistId, data) {
        const checkItemValues = data.map(
            e => `("${e.id}", "${e.name}", "${e.state}", ${checklistId}, "${e.idChecklist}", 1)`
        ).join(',');

        return CheckItemService.bulkUpsertCheckItem(checkItemValues);
    }

}

module.exports = new TrelloHelper;