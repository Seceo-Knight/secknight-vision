const JOI = require('joi');

class Zoho {
    tokenValidation(data) {
        const schema = {
            code: JOI.string().required(),
            name: JOI.string().required(),
            integration_id: JOI.number().required()
        }
        return JOI.validate(data, schema);
    }

    portalIdValidation(data) {
        const schema = {
            integration_org_id: JOI.number().required()
        };
        return JOI.validate(data, schema);
    }
    projectIdOnlyValidation(data) {
        const schema = {
            project_id: JOI.number().allow("")
        };
        return JOI.validate(data, schema);
    }

    projectIdValidation(data) {
        const schema = {
            access_token: JOI.string().required(),
            portal_id: JOI.string().required(),
            project_id: JOI.string().required()
        };
        return JOI.validate(data, schema);
    }

    projectValidation(data) {
        const schema = {
            access_token: JOI.string().required(),
            portal_id: JOI.string().required(),
            project_id: JOI.string().required(),
            project_name: JOI.string().required(),
            status: JOI.string().required()
        };
        return JOI.validate(data, schema);
    }

    projectIdValidation(data) {
        const schema = {
            project_id: JOI.number().required()
        };
        return JOI.validate(data, schema);
    }

    tasksValidation(data) {
        const schema = {
            project_id: JOI.number().allow(""),
            project_list_id: JOI.number().allow(""),
            status: JOI.number().allow("")
        }
        return JOI.validate(data, schema);
    }

    createProjectValidation(data) {
        const schema = {
            ext_org_id: JOI.string().required(),
            project_name: JOI.string().required(),
            integration_org_id: JOI.number().required(),
            description: JOI.string().allow(""),
            start_date: JOI.string().required().allow(""),
            end_date: JOI.string().required().allow("")
        };
        return JOI.validate(data, schema);
    }
    deleteProject(data) {
        const schema = {
            ext_org_id: JOI.string().required(),
            ext_project_id: JOI.string().required(),
            project_id: JOI.number().required()
        };
        return JOI.validate(data, schema);
    }

    createTasklistValidation(data) {
        const schema = {
            ext_org_id: JOI.string().required(),
            ext_project_id: JOI.string().required(),
            project_id: JOI.number().required(),
            name: JOI.string().required()
        };
        return JOI.validate(data, schema);
    }

    deleteProjectlistValidation(data) {
        const schema = {
            ext_org_id: JOI.string().required(),
            ext_project_id: JOI.string().required(),
            project_id: JOI.number().required(),
            task_list_id: JOI.number().required(),
            ext_list_id: JOI.string().required()
        };
        return JOI.validate(data, schema);
    }

    createTaskValidation(data) {
        const schema = {
            ext_org_id: JOI.string().required(),
            ext_project_id: JOI.string().required(),
            project_id: JOI.number().required(),
            name: JOI.string().required(),
            ext_user_id: JOI.string().allow("").allow(null).optional(),
            ext_list_id: JOI.string().allow("").allow(null).optional(),
            start_date: JOI.string().allow("").allow(null).optional(),
            end_date: JOI.string().allow("").allow(null).optional(),
            duration: JOI.number().allow("").allow(null).optional(),
            duration_type: JOI.string().allow("").allow(null).optional(),
            description: JOI.string().allow("").allow(null).optional(),
            user_id: JOI.number().allow("").allow(null).optional(),
            project_list_id: JOI.string().allow("").allow(null).optional()
        };
        return JOI.validate(data, schema);
    }

    updateTaskValidation(data) {
        const schema = {
            ext_org_id: JOI.string().required(),
            ext_project_id: JOI.string().required(),
            project_id: JOI.number().required(),
            ext_project_todo_id: JOI.string().required(),
            name: JOI.string().allow("").allow(null).optional(),
            ext_user_id: JOI.string().allow("").allow(null).optional(),
            start_date: JOI.string().allow("").allow(null).optional(),
            end_date: JOI.string().allow("").allow(null).optional(),
            duration: JOI.number().allow("").allow(null).optional(),
            duration_type: JOI.string().allow("").allow(null).optional(),
            description: JOI.string().allow("").allow(null).optional(),
            user_id: JOI.number().allow("").allow(null).optional()
        };
        return JOI.validate(data, schema);
    }

    deletetaskValidation(data) {
        const schema = {
            ext_org_id: JOI.string().required(),
            ext_project_id: JOI.string().required(),
            project_id: JOI.number().required(),
            task_id: JOI.number().required(),
            ext_task_id: JOI.string().required()
        };
        return JOI.validate(data, schema);
    }

    createBugValidation(data) {
        const schema = {
            ext_org_id: JOI.string().required(),
            ext_project_id: JOI.string().required(),
            project_id: JOI.number().required(),
            name: JOI.string().required(),
            ext_assignee_id: JOI.string().allow("").allow(null).optional(),
            due_date: JOI.string().allow("").allow(null).optional(),
            description: JOI.string().allow("").allow(null).optional(),
            assignee_user_id: JOI.number().allow("").allow(null).optional(),
        };
        return JOI.validate(data, schema);
    }
    updateIssueValidation(data) {
        const schema = {
            ext_org_id: JOI.string().required(),
            ext_project_id: JOI.string().required(),
            project_id: JOI.number().required(),
            ext_issue_id: JOI.string().required(),
            title: JOI.string().allow("").allow(null).optional(),
            status: JOI.number().allow("").allow(null).optional(),
            ext_user_id: JOI.string().allow("").allow(null).optional(),
            due_date: JOI.string().allow("").allow(null).optional(),
            description: JOI.string().allow("").allow(null).optional(),
            user_id: JOI.number().allow("").allow(null).optional()
        };
        return JOI.validate(data, schema);
    }

    dueTaskAndBudValidation(data) {
        const schema = {
            integration_org_id: JOI.number().required(),
            project_id: JOI.number().allow("").allow(null).optional(),
        };
        return JOI.validate(data, schema);
    }

    deleteBugValidation(data) {
        const schema = {
            ext_org_id: JOI.string().required(),
            ext_project_id: JOI.string().required(),
            project_id: JOI.number().required(),
            issue_id: JOI.number().required(),
            ext_issue_id: JOI.string().required()
        };
        return JOI.validate(data, schema);
    }

    addUserToProjectValidation(data) {
        const schema = {
            ext_org_id: JOI.string().required(),
            ext_project_id: JOI.string().required(),
            project_id: JOI.number().required(),
            email: JOI.string().email().required(),
            role: JOI.string().required(),
            user_id: JOI.number().required()
        };
        return JOI.validate(data, schema);
    }

    removeUserToProjectValidation(data) {
        const schema = {
            ext_org_id: JOI.string().required(),
            ext_project_id: JOI.string().required(),
            project_id: JOI.number().required(),
            user_id: JOI.number().required(),
            ext_user_id: JOI.string().required()
        };
        return JOI.validate(data, schema);
    }


}

module.exports = new Zoho