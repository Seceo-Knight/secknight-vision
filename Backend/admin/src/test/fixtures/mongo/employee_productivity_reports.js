const {ObjectID: ObjectId} = require('mongodb');

module.exports = [
    {
        "employee_id": 1,
        "department_id": 1,
        "location_id": 1,
        "organization_id": 1,
        "productive_duration": 230,
        "non_productive_duration": 340,
        "neutral_duration": 25509,
        "idle_duration": 2795,
        "break_duration": 450,
        "applications": [
            {
                "pro": 120,
                "non": 230,
                "neu": 4008,
                "total": 4008,
                "application_type": 1,
                "tasks": [
                    {
                        "pro": 430,
                        "non": 430,
                        "neu": 4008,
                        "total": 4008,
                        "task_id": 0
                    }
                ],
                "application_id": ObjectId("5ed5efbcbc38f0682ce3549d")
            },
            {
                "pro": 450,
                "non": 560,
                "neu": 128,
                "total": 128,
                "application_type": 2,
                "application_id": ObjectId("5ed5efbcbc38f0682ce3549d"),
                "tasks": [
                    {
                        "pro": 0,
                        "non": 0,
                        "neu": 128,
                        "total": 128,
                        "task_id": 0
                    }
                ]
            }
        ],
        "tasks": [
            {
                "pro": 760,
                "non": 760,
                "neu": 25509,
                "total": 25509,
                "task_id": 0,
                "applications": [
                    {
                        "pro": 670,
                        "non": 560,
                        "neu": 4008,
                        "total": 4008,
                        "application_type": 2,
                        "application_id": ObjectId("5ed5efbcbc38f0682ce3549d")
                    },
                    {
                        "pro": 560,
                        "non": 870,
                        "neu": 3499,
                        "total": 3499,
                        "application_type": 2,
                        "application_id": ObjectId("5ed5efbcbc38f0682ce3549d")
                    },
                ]
            }
        ],
        "year": 2030,
        "month": 8,
        "day": 1,
        "yyyymmdd": 20300801,
        "date": "2030-08-01",
        "createdAt": "2030-08-01T05:02:53.818Z",
        "updatedAt": "2030-08-01T14:15:21.739Z",
        "__v": 43,
    },
    {
        "employee_id": 1,
        "department_id": 1,
        "location_id": 1,
        "organization_id": 1,
        "productive_duration": 1234,
        "non_productive_duration": 560,
        "neutral_duration": 25509,
        "idle_duration": 2795,
        "break_duration": 450,
        "applications": [
            {
                "pro": 450,
                "non": 650,
                "neu": 4008,
                "total": 4008,
                "application_type": 1,
                "tasks": [
                    {
                        "pro": 760,
                        "non": 670,
                        "neu": 4008,
                        "total": 4008,
                        "task_id": 0
                    }
                ],
                "application_id": ObjectId("5ed5efbcbc38f0682ce3549d")
            },
            {
                "pro": 450,
                "non": 670,
                "neu": 128,
                "total": 128,
                "application_type": 2,
                "application_id": ObjectId("5ed5efbcbc38f0682ce3549d"),
                "tasks": [
                    {
                        "pro": 450,
                        "non": 340,
                        "neu": 128,
                        "total": 128,
                        "task_id": 0
                    }
                ]
            }
        ],
        "tasks": [
            {
                "pro": 6780,
                "non": 4540,
                "neu": 25509,
                "total": 25509,
                "task_id": 0,
                "applications": [
                    {
                        "pro": 560,
                        "non": 670,
                        "neu": 4008,
                        "total": 4008,
                        "application_type": 2,
                        "application_id": ObjectId("5ed5efbcbc38f0682ce3549d")
                    },
                    {
                        "pro": 670,
                        "non": 780,
                        "neu": 3499,
                        "total": 3499,
                        "application_type": 2,
                        "application_id": ObjectId("5ed5efbcbc38f0682ce3549d")
                    },
                ]
            }
        ],
        "year": 2030,
        "month": 8,
        "day": 1,
        "yyyymmdd": 20300701,
        "date": "2030-07-01",
        "createdAt": "2030-07-01T05:02:53.818Z",
        "updatedAt": "2030-07-01T14:15:21.739Z",
        "__v": 43,
    }
];