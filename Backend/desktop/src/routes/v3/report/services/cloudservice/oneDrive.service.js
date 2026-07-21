const fs = require('fs');
const ODApi = require('onedrive-api');
const qs = require('querystring');
const axios = require('axios');
const _ = require('underscore');
const path = require('path');

const baseUrl = 'https://graph.microsoft.com/v1.0/me/drive/items/';

class OneDrive {
    /**upload to OneDrive*/
    async uploadAttachments(folderName, name, creds, filePath, orginalName) {
        const accessToken = await this.initConection(creds);
        const parentId = await this.getOrCreateFolder({ accessToken, folderName, parentId: 'root' });

        const ext = path.extname(orginalName);
        const { webUrl } = await ODApi.items.uploadSimple({
            accessToken,
            filename: `${name}${ext}`,
            parentId,
            readableStream: fs.createReadStream(filePath),
        });
        return webUrl;
    }
    /**Get acces token for one drive*/
    async initConection(creds) {
        const body = {
            client_id: creds.onedrive_client_id,
            redirect_uri: creds.onedrive_redirect_url,
            client_secret: creds.onedrive_client_secret,
            refresh_token: creds.onedrive_refresh_token,
            grant_type: 'refresh_token',
        };

        const fetchParams = {
            method: 'POST',
            url: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: qs.stringify(body),
        };
        const { data } = await axios(fetchParams);
        return data.access_token;
    }

    /**Get one drive folder id and if folder absent create it*/
    async getOrCreateFolder({ accessToken, folderName, parentId }) {
        const folderId = await this.getFolderId({ accessToken, folderName, parentId });
        if (folderId) return folderId;

        return ODApi.items.createFolder({
            accessToken,
            rootItemId: parentId,
            name: folderName,
        });
    }

    async getIdWithDate(creds) {
        const folderId = await this.getFolderId(creds);
        return { id: folderId, name: creds.folderName }
    }

    /**Get one drive folder id */
    async getFolderId({ accessToken, folderName, parentId }) {
        const queryParams = `$select=id&$filter=name eq '${folderName}'`;
        const data = await this.getFolderChildrens({ accessToken, parentId, queryParams });
        const [id] = _.pluck(data.value, 'id');

        return id;
    }

    /**Get one drive data by parent id and query params */
    async getFolderChildrens({ accessToken, parentId, queryParams }) {
        const query = queryParams ? `?${queryParams}` : '';

        const fetchParams = {
            method: 'GET',
            url: `${baseUrl}${parentId}/children${query}`,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`
            },
        };
        let { data } = await axios(fetchParams);

        if (data.value.length === 0 && data['@odata.nextLink']) {
            data = await this.getDataByLink(accessToken, data['@odata.nextLink']);
        }

        return data;
    }
}

module.exports = new OneDrive;

(async () => {
    const queryParams = `$filter=startswith(name, a61ecf0885e37e3f49b0d55ce42fe792)`
    const query = queryParams ? `?${queryParams}` : '';

    const fetchParams = {
        method: 'GET',
        url: `${baseUrl}B4B606E6B62BE469!21673/children${query}`,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer EwBgA8l6BAAUO9chh8cJscQLmU+LSWpbnr0vmwwAAQN3Er+2++8OivBS+9XRILy/EOAGeX9PrQ+fPHtly4C4HuNy5QpgRdeV+g737dp8e5sBO1eLZgEWdnWFvcVVqEzjyIPfTkeo9RR71/NH1v4nJCiEsdY5h4ntnp6sPFeRmDtlsKbi3TRu73MObdaDHwcYgkcSBpo8sTUk5yFU/cu4Nw4bmVBw295wIe9UNWzsZWvbtw2Ygm3eD7c/AbGn0iFz4kqhErPN0jX46/Z047VCPJAYqCd5FSloIeIYyZT0WBkdlrVdnNVxFMkqKHEtWkLzc4jwXy7yqs9AhdmhneYO4ZwjNepwB6frbI9U/owBRL2frm3TtUYXSEkBWXraJmgDZgAACG0/V2NGPbVYMAK74Y+3hGC5VdPPX0k4FQHAELQrbY6QZyxGGte7Njd4IVg/LRCzXospHt5IWPGwL+V0xpdjFIN1es2EgK7gC/GoaXGakYX1YfVFQVS4vogpD7FGkvWUhxdwu2ZdpqVywQmqvwGsjqhNGgvEHwZiB1MKlEkQP/5uKdjbkDkKgmdwnWN1RTeVfQKuYWZYjlICtelmsJ7t8b2Ru61CpQ4YZNCc+bKl11m+s3m3Ij1Ukr0ufV6QL09NqIG5MfsoRJchC4D7VODod8VKvVaKXia6jj0S+U5iE+PDKtoD5fLeTGAZyfOHPK2ykj535e/CyPEovOKXXE+B8Cd4shvOt4y3yTlJUv4mSDKsdkDSxfIEb5BH2LWZhVuFrVf6BoA5LP+oO5ctCO9uEJB1pHkU6jbHeeU6dTRdTn1rklPdoeQCw94XyfDjdmPieKj/wyMKBJs6VofXc3b3yI50JM3VlcA8EPcmJhpN6SJaax+GLYZdED4CvR1AMvPA3sYeL57mdKdNmL7nAdObf56WxSVUQvJ0bYcqruOvravmFGwpF/RMGcBvkR8oz8HvAR1Z3ux+LMAw3AqHV9vGPlOWg91SNv1crXCKglkPqKbQXEHtT59flr1kCE3PkSJE72CGwkD4/W2pcwZlOSRSJRc5MEwICz0GfF4+9OLTo8j0KyPJlXWrcR/INZqYKFKdrRxdd3kgCd1LFJ7zYtz61sVh2lGqCrB5ffSGGRAZJYysXrbvmJeaXd50YngC`
        },
    };
    let { data } = await axios(fetchParams);
    const url = data['@odata.context']
    console.log('-----------', data, '--------------');
    // const fetchParams1 = {
    //     method: 'GET',
    //     url,
    //     headers: {
    //         "Content-Type": "application/json",
    //         Authorization: `Bearer EwBgA8l6BAAUO9chh8cJscQLmU+LSWpbnr0vmwwAAQN3Er+2++8OivBS+9XRILy/EOAGeX9PrQ+fPHtly4C4HuNy5QpgRdeV+g737dp8e5sBO1eLZgEWdnWFvcVVqEzjyIPfTkeo9RR71/NH1v4nJCiEsdY5h4ntnp6sPFeRmDtlsKbi3TRu73MObdaDHwcYgkcSBpo8sTUk5yFU/cu4Nw4bmVBw295wIe9UNWzsZWvbtw2Ygm3eD7c/AbGn0iFz4kqhErPN0jX46/Z047VCPJAYqCd5FSloIeIYyZT0WBkdlrVdnNVxFMkqKHEtWkLzc4jwXy7yqs9AhdmhneYO4ZwjNepwB6frbI9U/owBRL2frm3TtUYXSEkBWXraJmgDZgAACG0/V2NGPbVYMAK74Y+3hGC5VdPPX0k4FQHAELQrbY6QZyxGGte7Njd4IVg/LRCzXospHt5IWPGwL+V0xpdjFIN1es2EgK7gC/GoaXGakYX1YfVFQVS4vogpD7FGkvWUhxdwu2ZdpqVywQmqvwGsjqhNGgvEHwZiB1MKlEkQP/5uKdjbkDkKgmdwnWN1RTeVfQKuYWZYjlICtelmsJ7t8b2Ru61CpQ4YZNCc+bKl11m+s3m3Ij1Ukr0ufV6QL09NqIG5MfsoRJchC4D7VODod8VKvVaKXia6jj0S+U5iE+PDKtoD5fLeTGAZyfOHPK2ykj535e/CyPEovOKXXE+B8Cd4shvOt4y3yTlJUv4mSDKsdkDSxfIEb5BH2LWZhVuFrVf6BoA5LP+oO5ctCO9uEJB1pHkU6jbHeeU6dTRdTn1rklPdoeQCw94XyfDjdmPieKj/wyMKBJs6VofXc3b3yI50JM3VlcA8EPcmJhpN6SJaax+GLYZdED4CvR1AMvPA3sYeL57mdKdNmL7nAdObf56WxSVUQvJ0bYcqruOvravmFGwpF/RMGcBvkR8oz8HvAR1Z3ux+LMAw3AqHV9vGPlOWg91SNv1crXCKglkPqKbQXEHtT59flr1kCE3PkSJE72CGwkD4/W2pcwZlOSRSJRc5MEwICz0GfF4+9OLTo8j0KyPJlXWrcR/INZqYKFKdrRxdd3kgCd1LFJ7zYtz61sVh2lGqCrB5ffSGGRAZJYysXrbvmJeaXd50YngC`
    //     },
    // };
    // let data1 = await axios(fetchParams1);
    // console.log('==========', data1);
})
