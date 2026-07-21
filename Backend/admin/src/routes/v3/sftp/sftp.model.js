'use strict';

// Example of using the uploadDir() method to upload a directory
// to a remote SFTP server

const path = require('path');
const fs = require('fs');
const SftpClient = require('ssh2-sftp-client');


let sftpConnections = {};

class SFTPModel {

    static async initConnection(connectionData, organization_id) {
        if (Object.keys(sftpConnections).includes(`Storage_${organization_id}`)) {
            this.client = sftpConnections[`Storage_${organization_id}`]
            this.clientPath = connectionData.ftp_path;
            return this.client;
        }
        const sftp = new SftpClient();

        let tempConnectionData = {
            host: connectionData.host,
            port: connectionData.port,
            username: connectionData.username,
        };

        if(connectionData.pemPath) tempConnectionData.privateKey = Buffer.from(connectionData.pemPath.replace(/\\n/g, '\n'), 'utf-8');
        else tempConnectionData.password = connectionData.password;

        await sftp.connect(tempConnectionData);
        sftpConnections[`Storage_${organization_id}`] = sftp;
        this.client = sftp;
        this.clientPath = connectionData.ftp_path;
        return this.client;
    }

    static async download(req, res, path) {
        const fileStream = await this.client.createReadStream(path);

        // Set the appropriate headers for the response
        // res.setHeader('Content-disposition', 'attachment; filename=file_name.ext');
        // res.setHeader('Content-type', 'application/octet-stream');
        res.setHeader("content-type", "image/png");

        // Stream the file to the user
        fileStream.pipe(res);

        fileStream.on('end', () => {
            console.log('File streamed successfully.');
            // sftp.end(); // Close the SFTP connection
        });

        fileStream.on('error', (err) => {
            console.error('Error streaming file:', err);
            // sftp.end(); // Close the SFTP connection
        });

    }

    static deleteCreds(organization_id) {
        if(Object.keys(sftpConnections).includes(`Storage_${organization_id}`)) {
            delete sftpConnections[`Storage_${organization_id}`];
        }
    }
}

module.exports = SFTPModel;