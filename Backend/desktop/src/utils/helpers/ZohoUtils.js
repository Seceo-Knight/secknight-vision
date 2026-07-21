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

/**
 * ZohoUtils
 * @class
 */
class ZohoUtils {
    constructor() {
        this.tempName = 'Shared link template';
    }

    /**
     * initConnection
     * @description function to init the connection
     * @memberof ZohoUtils
     * 
     * @param {*} param0 
     * @returns String
     * @author Amit Verma <amitverma@globussoft.in>
     */
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

    /**
     * parseUrl
     * @description function to parse the public file url
     * @memberof ZohoUtils
     * 
     * @param {*} fileId 
     * @param {*} shareId 
     * @param {*} domain 
     * @returns String
     * @author Amit Verma <amitverma@globussoft.in>
     */
    parseUrl(fileId, shareId, domain) {
        return Api.parseDownloadUrlById(fileId, shareId, domain);
    }

    /**
     * uploadScreen
     * @description function to upload the screens
     * @memberof ZohoUtils
     * 
     * @param {*} param0 
     * @returns String
     */
    async uploadScreen({ parentId, filename, filePath, originalName, fileMimetype,  pool }) {
        try{
        const originalname = originalName;
        const name = filename;
        const contentType = fileMimetype;

        const ext = _.last(originalname.split('.'));
        const content = fs.createReadStream(filePath);
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
        }catch(e) {console.log("eee",e.response.data); throw (e)}
    }

    /**
     * getOrCreateWs
     * @description - function to get the Workspace or create WS if not present
     * @memberof ZohoUtils
     * 
     * @param {*} param0 
     * @returns String
     * @author Amit Verma <amitverma@globussoft.in>
     */
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
                description: 'EmpMonitor service for saving attachments',
            });
        }

        return mainFolder.id;
    }
}

module.exports = new ZohoUtils();
