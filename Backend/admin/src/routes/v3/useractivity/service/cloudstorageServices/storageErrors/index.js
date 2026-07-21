const {get} = require('lodash');

const CommonError = require('./CommonError');
const { translate } = require('../../../../../../utils/messageTranslation');
const { storageResponeErrorMsg } = require('../../../../../../utils/helpers/LanguageTranslate');

const responseArray = {
    invalid_client: 'Sorry, Error while connecting to Storage, due to either invalid Client Id or Client Secret.',
    invalid_grant: 'Sorry, Refresh Token is error while connecting to Storage.',
    limit_exceed: 'Sorry, Due to high Requests, Limit is exceeded. Please, try again after some time.',
    //  s3 errors
    SignatureDoesNotMatch: 'Sorry The request signature we calculated does not match the signature you provided. Please, check your credentials.',
    InvalidAccessKeyId: 'The AWS Access Key Id you provided does not exist in our records, Please, check your credentials.',
    AccessDenied: 'The Bucket is not matching or extisting in your AWS account, Please check your credentials.',
    UnknownEndpoint: 'The Regions is not matching or invalid, Please, check your credentials.',
    //  ond-drive errors
    od_unauthorized_client: 'Sorry, Client Id is wrong, Please, check your credentials.',
    od_invalid_client: 'Sorry, Invalid client secret is provided. Please, check your credentials.',
    od_invalid_grant: 'Sorry, Invalid Refresh token is provided. Please, check your credentials.',
    // zoho errors
    invalid_domain: 'Sorry, Invalid domain. Please, check your credentials.',
    R008: 'Sorry, Invalid Team id. Please, check your credentials.',
    F7003: 'Sorry, Invalid Client id, Client secret or Refresh token. Please, check your credentials.',
    //ftp errors
    DEPTH_ZERO_SELF_SIGNED_CERT: 'Sorry, Problems with AUTH. Please check your ftp server characteristics.',
    530: 'Sorry, Invalid Username or Password. Please, check your credentials.',
    426: 'Sorry, Due to high Requests, Limit for your ftp is exceeded. Please, try again after some time or change your ftp server characteristics.',
    timeout: 'Sorry, your ftp not send response. Please check port or ftp server characteristics.',
    ENOTFOUND: 'Sorry, Invalid Host. Please, check your credentials.',
    //dropbox errors
    invalid_access_token: 'Sorry, Invalid access token. Please, check your credentials.',
    expired_access_token: 'Sorry, Access token has expired. Please, check your credentials.',
    insufficient_scope: 'Sorry, Insufficient scope permissions. Please, check your app permissions.',
    path_not_found: 'Sorry, The specified path was not found. Please, check your folder structure.',
    too_many_requests: 'Sorry, Too many requests. Please, try again after some time.',
    //  common error message
    common_error: 'Some error occurred while fetching the Screnshots please try again or check your credentials...'
};

const parseErrorCred = (name, message) => ({ name, message });
const ErrorCredDefault = (language) => parseErrorCred("Some_Thing_wrong", translate(storageResponeErrorMsg, "common_error", language));

const getErrorCreds = {
    GD: (error, language='en') => {
        if (!responseArray[error.message]) return ErrorCredDefault(language);
        return parseErrorCred(error.message, translate(storageResponeErrorMsg, error.message, language));
    },
    S3: (error, language='en') => {
        if (!responseArray[error.code]) return ErrorCredDefault(language);
        return parseErrorCred(error.code, translate(storageResponeErrorMsg, error.code, language));
    },
    MO: (error, language='en') => {
        const title = get(error, 'response.data.error');
        if (!responseArray[`od_${title}`]) return ErrorCredDefault(language);
        return parseErrorCred(title, translate(storageResponeErrorMsg, `od_${title}`, language));
    },
    ZH: (error, language='en') => {
        if(error.message && error.message.includes('Invalid domain')) {
            return parseErrorCred(error.message, translate(storageResponeErrorMsg,  "invalid_domain", language));
        }
        const title = get(error, 'response.data.errors[0].id');
        if(!responseArray[title]) return ErrorCredDefault(language);
     
        return parseErrorCred(title, translate(storageResponeErrorMsg, title, language));
    },
    FTP: (error, language='en') => {
        if(error.code) {
            if(responseArray[error.code]) {
                return parseErrorCred(error.code, translate(storageResponeErrorMsg, error.code, language));
            }
            
            return parseErrorCred(error.code, translate(storageResponeErrorMsg, "common_error", language));
        }
        if(error.message === 'Timeout (control socket)') {
            return parseErrorCred(error.message, translate(storageResponeErrorMsg, "timeout", language));
        } 
        if(responseArray[error.errno]) {
            return parseErrorCred(error.message, translate(storageResponeErrorMsg, error.errno, language));
        }
   
        return ErrorCredDefault(language);
    },
    SFTP: (error, language='en') => {
        if(error.code) {
            if(responseArray[error.code]) {
                return parseErrorCred(error.code, translate(storageResponeErrorMsg, error.code, language));
            }
            
            return parseErrorCred(error.code, translate(storageResponeErrorMsg, "common_error", language));
        }
        if(error.message === 'Timeout (control socket)') {
            return parseErrorCred(error.message, translate(storageResponeErrorMsg, "timeout", language));
        } 
        if(responseArray[error.errno]) {
            return parseErrorCred(error.message, translate(storageResponeErrorMsg, error.errno, language));
        }
   
        return ErrorCredDefault(language);
    },
    DB: (error, language='en') => {
        // Handle Dropbox specific errors
        if(error.response && error.response.data) {
            const errorData = error.response.data;
            if(errorData.error) {
                const errorType = errorData.error['.tag'] || errorData.error;
                if(responseArray[errorType]) {
                    return parseErrorCred(errorType, translate(storageResponeErrorMsg, errorType, language));
                }
            }
        }
        
        // Handle common HTTP errors
        if(error.response && error.response.status) {
            const status = error.response.status;
            if(status === 401) {
                return parseErrorCred('invalid_access_token', translate(storageResponeErrorMsg, 'invalid_access_token', language));
            }
            if(status === 429) {
                return parseErrorCred('too_many_requests', translate(storageResponeErrorMsg, 'too_many_requests', language));
            }
        }
        return ErrorCredDefault(language);
    },
}

module.exports = (error, type, language = 'en') => {
    if (error.name === 'RATE_LIMIT_EXCEEDED') return new CommonError({ name: error.name, message: translate(storageResponeErrorMsg, error.name, language) });

    const ErrorCred = getErrorCreds[type] ? getErrorCreds[type](error, language) : ErrorCredDefault(language);

    return new CommonError(ErrorCred);
}
