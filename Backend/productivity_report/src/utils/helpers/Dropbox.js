// var fetch = require("isomorphic-fetch");
// var dropbox = require("dropbox").Dropbox;
const axios = require("axios");
const fs = require('fs');
const dropboxV2Api = require('dropbox-v2-api');

class Dropbox {
    /**
     * Get screenshot from dropbox.
     *
     * @function getScreenshots
     * @memberof Dropbox
     * @param {*} path
     * @param {*} token
     * @returns {Object} - Screenshot data or Error.
     */
    async getScreenshots(path, token, callback) {
        console.log(path)
        var postData = {
            "path": path,
            "recursive": false,
            "include_media_info": false,
            "include_deleted": false,
            "include_has_explicit_shared_members": false,
            "include_mounted_folders": true,
            "include_non_downloadable_files": true,
        }

        let axiosConfig = {
            headers: {
                "Content-Type": "application/json;charset=UTF-8",
                Authorization: `Bearer ${token}`
            }
        };

        axios
            .post(
                "https://api.dropboxapi.com/2/files/list_folder",
                postData,
                axiosConfig
            )
            .then(res => {
                callback(null, res.data);
            })
            .catch(err => {
                callback(err, null);
            });
    }


    async UploadProfilePic(name, token, cb) {
        const dropbox = dropboxV2Api.authenticate({
            token: token
        });

        dropbox({

            resource: 'files/upload',
            parameters: {
                path: `/EmpMonitorProfilePic/` + name + ".jpeg",
            },

            readStream: fs.createReadStream(`${__dirname.split('src')[0]}/public/images/profilePic/${name}`)
        }, (err, result, response) => {
            if (err) {
                cb(err, null)
            } else {

                var postData = {
                    "path": `/EmpMonitorProfilePic/${name}.jpeg`,
                    "settings": {
                        "requested_visibility": "public",
                        "audience": "public",
                        "access": "viewer"
                    }
                }
                let axiosConfig = {
                    headers: {
                        "Content-Type": "application/json;charset=UTF-8",
                        Authorization: `Bearer ${token}`
                    }
                };

                axios
                    .post(
                        " https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings",
                        postData,
                        axiosConfig
                    )
                    .then(res => {

                        let url = res.data.url.replace('dl=0', 'raw=1')
                        cb(null, url)
                    })
                    .catch(err => {
                        cb(err, null)
                    });

            }
        });

    }

    async getScreenshots_old(path, token, callback) {

        var fetch = require('isomorphic-fetch'); // or another library of choice.
        var dropbox = require('dropbox').Dropbox;
        var dbx = new dropbox({
            accessToken: process.env.DROPBOX_ACCESS_TOKEN || 'YOUR_DROPBOX_ACCESS_TOKEN',
            fetch: fetch
        });
        dbx.filesListFolder({
                path: path
            })
            .then(function (response) {
                console.log(response);
                callback(null, response);
            })
            .catch(function (error) {
                console.log(error);
                callback(null, []);
            });
    }

}

module.exports = new Dropbox;

