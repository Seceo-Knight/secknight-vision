const _ = require('lodash');
const fs = require('fs');
const ZWDApi = require('zoho-wd-pools');

const Api = new ZWDApi();

const zObjPaths = {
    name: 'attributes.name',
    ws: '[0].relationships.workspaces.links.related',
    folders: 'relationships.folders.links.related',
    files: 'relationships.files.links.related',
    resourceId: '[0].attributes.resource_id',
    customData: '[0].attributes.custom_data',
    linkName: 'attributes.link_name',
};

class ZohoUtils {
    constructor() {
        this.tempName = 'Shared link template';
    }
    async initConection({
        team_id,
        zoho_client_id,
        zoho_client_secret,
        zoho_refresh_token,
        domain,
    }) {
        const haveConnect = Api.checkCreds(team_id);
        if (!haveConnect) {
            await Api.addConection(team_id, {
                clientId: zoho_client_id,
                clientSecret: zoho_client_secret,
                refreshToken: zoho_refresh_token,
                domain,
            });
        }

        return team_id;
    }

    async checkAccess({
        team_id,
        zoho_client_id,
        zoho_client_secret,
        zoho_refresh_token,
        domain,
    }) {
        const pool = `$${team_id}-${_.now()}`;
        await Api.addConection(pool, {
            clientId: zoho_client_id,
            clientSecret: zoho_client_secret,
            refreshToken: zoho_refresh_token,
            domain,
        });

        return Api.ws.all(pool, { teamId: team_id });
    }

    finderByName(data, name) {
        return data.find((file) => {
            const fileName = _.get(file, zObjPaths.name);

            return fileName === name;
        });
    }

    async getMainFolderId({ pool, mainFolderName }) {
        let mainFolderId = Api.getFromCashe({ pool, key: mainFolderName });
        if (!mainFolderId) {
            const wSpaces = await Api.ws.all(pool, { teamId: pool });
            const mainFolder = this.finderByName(wSpaces, mainFolderName);

            mainFolderId = _.get(mainFolder, 'id');
            Api.setToCashe({ pool, key: mainFolderName, data: mainFolderId });
        }

        return mainFolderId;
    }

    async getMailFolder({ pool, mainFolderId, email }) {
        const mailFolders = await Api.files.list(pool, { folderId: mainFolderId });
        const currentFolder = this.finderByName(mailFolders, email);

        return _.get(currentFolder, 'id');
    }

    async getShareId(pool, fileId) {
        const links = await Api.share.list(pool, {
            fileId,
        });

        let link = links.find((link) => {
            const linkName = _.get(link, zObjPaths.linkName);

            return linkName === fileId;
        });

        if (!link) {
            link = await Api.share.createDownLoad(pool, {
                resourceId: fileId,
                name: fileId,
                requestUserData: false,
            });
        }

        return link.id;
    }

    async getDayFolders({ pool, mailFolderId, dayFolders }) {
        let allDayFolders = await Api.files.list(pool, { folderId: mailFolderId });
        const foldersIdies = {};

        dayFolders.forEach((folderName) => {
            const currentFolder = this.finderByName(allDayFolders, folderName);
            if (currentFolder) {
                foldersIdies[folderName] = currentFolder.id;
            }
        });

        return foldersIdies;
    }

    async getHourFoldersIds({ pool, folderId, day, totalHour }) {
        const data = await Api.files.list(pool, {
            folderId,
        });
        const currentFolders = totalHour.reduce((acc, time) => {
            const hour = time.format('HH');
            const currentFolder = data.find(folder => {
                const { name } = folder.attributes;

                return name === hour;
            });
            if (currentFolder) {
                acc.push(currentFolder);
            }

            return acc;
        }, []);

        return { day, data: currentFolders }
    }

    async getScreensData({ pool, day, hour, folderId }) {
        const [data, shareId] = await Promise.all([
            this.getOneLimmitScreens({ pool, folderId, offset: 0 }),
            this.getShareId(pool, folderId)
        ]);

        return { day, hour, data, shareId };
    }

    parseUrl(fileId, shareId, domain) {
        return Api.parseDownloadUrlById(fileId, shareId, domain);
    }

    async getOneLimmitScreens({ pool, folderId, offset }) {
        let data = await Api.files.list(pool, {
            folderId,
            offset
        });
        if (data.length === 50) {
            const nextOffset = offset + 50;
            const nextData = await this.getOneLimmitScreens({ pool, folderId, offset: nextOffset });

            data = [...data, ...nextData];
        }

        return data;
    }

    async uploadScreen({ parentId, file, pool }) {
        const { originalname, filename: name, mimetype: contentType } = file;
        const ext = _.last(originalname.split('.'));
        const content = fs.createReadStream(`${publicFolder}/images/profilePic/${name}`);
        const data = await Api.files.upload(pool, {
            parentId,
            contentType,
            name: `${name}.${ext}`,
            overrideNameExist: true,
            readableStream: content
        });
        const resourceId = _.get(data, zObjPaths.resourceId);
        const share = await Api.share.createDownLoad(pool, {
            resourceId,
            name: resourceId,
            requestUserData: false,
        });
        const domain = Api.getDomain(pool);

        return this.parseUrl(resourceId, share.id, domain);
    }

    async getOrCreateWs({ pool, folderName }) {
        const wSpaces = await Api.ws.all(pool, {
            teamId: pool,
        });

        let mainFolder = wSpaces.find((folder) => {
            const name = _.get(folder, zObjPaths.name);

            return name === folderName;
        });
        if (!mainFolder) {
            mainFolder = await Api.ws.create(pool, {
                teamId: pool,
                name: folderName,
                isPublicTeam: true,
                description: 'EmpMonitor service for saving Employee avatars',
            });
        }

        return mainFolder.id;
    }

    async getTeamId({
        zoho_team,
        zoho_user_id,
        zoho_client_id,
        zoho_client_secret,
        zoho_refresh_token,
        domain,
    }) {
        await Api.addConection(zoho_client_id, {
            clientId: zoho_client_id,
            clientSecret: zoho_client_secret,
            refreshToken: zoho_refresh_token,
            domain,
        });

        const data = await Api.team.all(zoho_client_id, {
            zuid: zoho_user_id,
        });

        const empTeam = data.find((team) => {
            const name = _.get(team, zObjPaths.name);

            return name === zoho_team;
        });

        if (!empTeam) {
            throw new Error(`not exist team with name '${zoho_team}'`);
        }

        return { pool: zoho_client_id, team_id: empTeam.id };
    }

    async deleteFolder({ pool, mailFolderId }) {
        await Api.ws.delete(pool, { wsId: mailFolderId })
    }

    async uploadReport({ parentId, fileName: name, mimetype: contentType, path, pool }) {

        const content = fs.createReadStream(path + `/${name}`);
        const data = await Api.files.upload(pool, {
            parentId,
            contentType,
            name: `${name}`,
            overrideNameExist: true,
            readableStream: content
        });
        const resourceId = _.get(data, zObjPaths.resourceId);
        const share = await Api.share.createDownLoad(pool, {
            resourceId,
            name: resourceId,
            requestUserData: false,
        });
        const domain = Api.getDomain(pool);

        return this.parseUrl(resourceId, share.id, domain);
    }
}

module.exports = new ZohoUtils();
