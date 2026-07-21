const axios = require('axios');
const qs = require('qs');

const base_url = 'https://projectsapi.zoho.com/restapi'

class ZohoHelper {
    regenarateToken(refresh_token) {
        let url = `https://accounts.zoho.com/oauth/v2/token?refresh_token=${refresh_token}&client_id=${process.env.ZOHO_CLIENT_ID}&client_secret=${process.env.ZOHO_CLIENT_SECRET}&grant_type=refresh_token`;
        return axios.post(url)
            .then((response) => {
                return response.data.access_token
            })
            .catch((error) => {
                return null;
            })
    }

    getPortals(access_token) {
        let url = `${base_url}/portals/`
        return axios.get(url, {
                headers: {
                    Authorization: 'Bearer ' + access_token
                }
            })
            .then((response) => {
                // if (response.data.portals.length === 0) return sendResponse(res, 400, null, 'Portls Not Found.', null);
                return response.data.portals;
            })
            .catch((error) => {
                return null;
            })
    }

    getProjects(access_token, portal_id) {
        let url = `${base_url}/portal/${portal_id}/projects/`
        return axios.get(url, {
                headers: {
                    Authorization: 'Bearer ' + access_token
                }
            })
            .then((response) => {
                return response.data;
            })
            .catch((error) => {
                return null;
            })
    }

    getTasks(access_token, portal_id, project_id) {
        let url = `${base_url}/portal/${portal_id}/projects/${project_id}/tasks/`
        return axios.get(url, {
                headers: {
                    Authorization: 'Bearer ' + access_token
                },
                'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
            })
            .then((response) => {
                if (!response.data) {
                    return {
                        tasks: []
                    };
                } else {
                    return response.data;
                }
            })
            .catch((error) => {
                return null;
            })
    }

    getBugs(access_token, portal_id, project_id) {
        let url = `${base_url}/portal/${portal_id}/projects/${project_id}/bugs/`
        return axios.get(url, {
                headers: {
                    Authorization: 'Bearer ' + access_token
                }
            })
            .then((response) => {
                return response.data;
            })
            .catch((error) => {
                return null;
            })
    }

    getUsersByPortal(portal_id, access_token) {
        let url = `${base_url}/portal/${portal_id}/users/`
        return axios.get(url, {
                headers: {
                    Authorization: 'Bearer ' + access_token
                }
            })
            .then((response) => {
                return response.data.users;
            })
            .catch((error) => {

                return null;
                // return error.response.data.error;
            })
    }

    getUsersByProject(portal_id, access_token, project_id) {
        let url = `${base_url}/portal/${portal_id}/projects/${project_id}/users/`
        return axios.get(url, {
                headers: {
                    Authorization: 'Bearer ' + access_token
                }
            })
            .then((response) => {
                return response.data.users;
            })
            .catch((error) => {
                return null;
            })
    }

    createProject(access_token, data, portal_id) {
        let url = `${base_url}/portal/${portal_id}/projects/`
        return axios.post(url, qs.stringify(data), {
                headers: {
                    Authorization: 'Bearer ' + access_token
                },
                'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
            })
            .then((response) => {
                return response.data.projects;
            })
            .catch((error) => {
                return error.response.data.error;
            })
    }

    deleteProject(portal_id, access_token, project_id) {
        let url = `${base_url}/portal/${portal_id}/projects/${project_id}/`
        return axios.delete(url, {
                headers: {
                    Authorization: 'Bearer ' + access_token
                }
            })
            .then((response) => {
                return response.data;
            })
            .catch((error) => {
                return null;
            })
    }

    createTaskList(portal_id, access_token, project_id, data) {
        let url = `${base_url}/portal/${portal_id}/projects/${project_id}/tasklists/`
        return axios.post(url, qs.stringify(data), {
                headers: {
                    Authorization: 'Bearer ' + access_token
                }
            })
            .then((response) => {
                return response.data;
            })
            .catch((error) => {
                return error.response.data.error;
            })
    }

    deleteProjectList(portal_id, access_token, project_id, task_list_id) {
        let url = `${base_url}/portal/${portal_id}/projects/${project_id}/tasklists/${task_list_id}/`
        return axios.delete(url, {
                headers: {
                    Authorization: 'Bearer ' + access_token
                }
            })
            .then((response) => {
                return response.data;
            })
            .catch((error) => {
                return null;
            })
    }

    createTask(portal_id, access_token, project_id, data) {
        let url = `${base_url}/portal/${portal_id}/projects/${project_id}/tasks/`
        return axios.post(url, qs.stringify(data), {
                headers: {
                    Authorization: 'Bearer ' + access_token
                }
            })
            .then((response) => {
                return response.data;
            })
            .catch((error) => {
                return error.response.data.error;
            })
    }

    updateTask(portal_id, access_token, project_id, task_id, data) {
        let url = `${base_url}/portal/${portal_id}/projects/${project_id}/tasks/${task_id}/`
        return axios.post(url, qs.stringify(data), {
                headers: {
                    Authorization: 'Bearer ' + access_token
                }
            })
            .then((response) => {
                return response.data;
            })
            .catch((error) => {
                return error.response.data.error;
            })
    }

    deleteTask(portal_id, access_token, project_id, task_id) {
        let url = `${base_url}/portal/${portal_id}/projects/${project_id}/tasks/${task_id}/`
        return axios.delete(url, {
                headers: {
                    Authorization: 'Bearer ' + access_token
                }
            })
            .then((response) => {
                return response.data;
            })
            .catch((error) => {
                return null;
            })
    }

    createBug(portal_id, access_token, project_id, data) {
        let url = `${base_url}/portal/${portal_id}/projects/${project_id}/bugs/`
        return axios.post(url, qs.stringify(data), {
                headers: {
                    Authorization: 'Bearer ' + access_token
                }
            })
            .then((response) => {
                return response.data;
            })
            .catch((error) => {
                return error.response.data.error;
            })
    }

    deleteBug(portal_id, access_token, project_id, bug_id) {
        let url = `${base_url}/portal/${portal_id}/projects/${project_id}/bugs/${bug_id}/`
        return axios.delete(url, {
                headers: {
                    Authorization: 'Bearer ' + access_token
                }
            })
            .then((response) => {
                return response.data;
            })
            .catch((error) => {
                return null;
            })
    }

    taskLayout(portal_id, access_token, project_id) {
        const url = `${base_url}/portal/${portal_id}/projects/${project_id}/tasklayouts`
        return axios.get(url, {
                headers: {
                    Authorization: 'Bearer ' + access_token
                }
            })
            .then((response) => {
                return response.data;
            })
            .catch((error) => {
                return null;
            })
    }

    addUserToProject(portal_id, access_token, project_id, data) {
        let url = `${base_url}/portal/${portal_id}/projects/${project_id}/users/`
        return axios.post(url, qs.stringify(data), {
                headers: {
                    Authorization: 'Bearer ' + access_token
                }
            })
            .then((response) => {
                return {
                    status: 1,
                    data: response.data.users
                };
            })
            .catch((error) => {
                return {
                    status: 0,
                    error: error.response.data
                };
            });
    }

    removeUserFromProject(portal_id, project_id, access_token, user_id) {
        let url = `${base_url}/portal/${portal_id}/projects/${project_id}/users/${user_id}/`
        return axios.delete(url, {
                headers: {
                    Authorization: 'Bearer ' + access_token
                }
            })
            .then((response) => {
                return response.data;
            })
            .catch((error) => {
                return null;
            });
    }
}

module.exports = new ZohoHelper
// let access_token = '1000.3aacf7dbd1c328654c17d476b6cde837.21993f2d060bd587d9439e0442a51b51';

// const data = {
//     email: 'sumitsinsgh@globussoft.in',
//     role: 'employee'
// }
// let url = `${base_url}/portal/708528408/projects/1557478000000038025/users/711465485/`
// return axios.delete(url, {
//         headers: {
//             Authorization: 'Bearer ' + access_token
//         }
//     })
//     .then((response) => {
//         console.log('==========================', response.data);
//         return response;
//     })
//     .catch((error) => {
//         console.log('==========================', error.response.data);
//         return null;
//     });


// getUsersByProject(portal_id, access_token, project_id) {
// let url = `https://projectsapi.zoho.com/restapi/portal/708528408/projects/1557478000000048077/`
// return axios.delete(url, { headers: { Authorization: 'Bearer ' + access_token } })
//     .then((response) => {
//         console.log('==========', response.data);
//     })
//     .catch((error) => {
//         console.log('===============', error.response);
//     })
// }



// ALTER TABLE `project_to_users`
//     ADD CONSTRAINT `UC_project_user` UNIQUE (user_idintegration_creds, project_id, project_list_id, list_id),


// 1557478000000016068
// 288365000010912039