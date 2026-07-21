const swaggerHelpers = require('./swagger-helpers');

module.exports = {
    "/": {
        "get": {
            "tags": ["Open"],
            "description": "Get root request's response from the api - basically server status",
            "responses": {
                "200": { "description": "Healthy! server status and API status." },
                "500": swaggerHelpers.responseObject['500']
            }
        }
    },
    "/server-time": {
        "get": {
            "tags": ["Test"],
            "description": "Get Server Time",
            "responses": {
                "200": swaggerHelpers.responseObject['200'],
                "500": swaggerHelpers.responseObject['500']
            }
        }
    },
    "/languages": {
        "get": {
            "tags": ["Test"],
            "description": "Get Chingari Languages",
            "responses": {
                "200": swaggerHelpers.responseObject['200'],
                "500": swaggerHelpers.responseObject['500']
            }
        }
    },


    "/post/createPost": {
        "post": {
            "tags": ["Posts"],
            "description": "Create a Post",
            "consumes": ["multipart/form-data"],
            "produces": ["application/json"],
            "deprecated": true,
            "parameters": [
                {
                    in: "formData",
                    name: "userMedia",
                    type: "file",
                    required: true,
                    description: "The file to upload."
                },
                {
                    in: "formData",
                    name: "userId",
                    type: "string",
                    required: true,
                },
                {
                    in: "formData",
                    name: "mediaType",
                    type: "string",
                    required: true,
                },
                {
                    in: "formData",
                    name: "language",
                    type: "string",
                    required: true,
                },
                {
                    in: "formData",
                    name: "hashTagData",
                    type: "string",
                    required: true,
                },
                {
                    in: "formData",
                    name: "caption",
                    type: "string",
                    required: true,
                },
                {
                    in: "formData",
                    name: "share",
                    type: "string",
                    required: true,
                },
                {
                    in: "formData",
                    name: "comment",
                    type: "string",
                    required: true,
                },
            ],
            "responses": {
                "200": swaggerHelpers.responseObject['200'],
                "500": swaggerHelpers.responseObject['500']
            }
        }
    },
    "/post/deletePost": {
        post: {
            tags: ["Posts"],
            description: "To delete a post",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                // name: "Data",
                // description: "User Data for autheticating a user",
                // required: true,
                schema: {
                    type: "object",
                    required: ["userId", "postId"],
                    properties: {
                        userId: { type: "string", example: "5c0251181835c34d347e23fc" },
                        postId: { type: "string", example: "5c02511xxxxxxxxd347e23fc" }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/post/post_details/{postId}": {
        get: {
            tags: ["Posts"],
            description: "Get Post Data By PostId",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "path",
                name: "postId",
                required: true,
                type: "string"
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400'],
                "404": swaggerHelpers.responseObject['404']
            }
        }
    },
    "/post/comments": {
        post: {
            tags: ["Posts"],
            description: "Api to Fetch Comments.",
            consumes: ["application/json"],
            produces: ["application/json"],
            deprecated: true,
            parameters: [{
                in: "body",
                name: 'Data',
                required: true,
                schema: {
                    type: 'object',
                    required: ['userId', 'postId'],
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        postId: { type: 'string', example: '5c42ba3770d69734992b3ffb' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400'],
                "404": swaggerHelpers.responseObject['404']
            }
        }
    },
    "/post/getComments": {
        post: {
            tags: ["Posts"],
            description: "New Api to Fetch Comments.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: 'Data',
                required: true,
                schema: {
                    type: 'object',
                    required: ['postId'],
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                        postId: { type: 'string', example: '5d243ec9c57c0a6204b0a41c' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400'],
                "404": swaggerHelpers.responseObject['404']
            }
        }
    },
    "/post/comments-new": {
        post: {
            tags: ["Posts"],
            description: "New api for fetching comments.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: 'object',
                    required: ['userId', 'postId'],
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                        postId: { type: 'string', example: '5c42ba3770d69734992b3ffb' },
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        ownerId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400'],
                "404": swaggerHelpers.responseObject['404']
            }
        }
    },
    "/post/add_comment": {
        post: {
            tags: ["Posts"],
            description: "To add comment on user Posts.",
            consumes: ["application/json"],
            produces: ["application/json"],
            deprecated: true,
            parameters: [{
                in: 'body',
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        postId: { type: 'string', example: '5c42ba3770d69734992b3ffb' },
                        ownerId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        comment: { type: 'string', example: 'Testing...' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/post/add-comment": {
        post: {
            tags: ["Posts"],
            description: "New Api To add comment on user Posts.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: 'body',
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        userId: { type: 'string', example: '5d0374c66d47152fdad7e56c' },
                        postId: { type: 'string', example: '5d243ec9c57c0a6204b0a41c' },
                        comment: { type: 'string', example: 'Testing...' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/post/delete_comment": {
        post: {
            tags: ["Posts"],
            description: "To delete a comment.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        postId: { type: 'string', example: '5c42ba3770d69734992b3ffb' },
                        commentId: { type: 'string', example: '5c42ba3770xxxxxxxxxx3ffb' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/post/addPrimiumPosts": {
        post: {
            tags: ["Posts"],
            description: "To add postId in premium posts(posts visible in trending feeds).",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: 'body',
                name: "postId",
                type: "string",
                required: true,
                description: "premium postId."
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/post/share-image/{postId}": {
        get: {
            tags: ["Posts"],
            description: "",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "path",
                name: "postId",
                required: true,
                type: "string"
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/post/sharePost": {
        post: {
            tags: ["Posts"],
            description: "To share the post in any socila media.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        ownerId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        postId: { type: 'string', example: '5c42ba3770d69734992b3ffb' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400'],
            }
        }
    },
    "/post/showShareDetails": {
        post: {
            tags: ["Posts"],
            description: "Find all the usersDetails(like user profilepic,user status,username) who have shared that post at the time of sharing the post.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                        postId: { type: 'string', example: '5c42ba3770d69734992b3ffb' },
                        ownerId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400'],
                "404": swaggerHelpers.responseObject['404']
            }
        }
    },
    "/post/topProfiles_old": {
        post: {
            tags: ["Posts"],
            description: "Get top profile users.",
            consumes: ["application/json"],
            produces: ["application/json"],
            deprecated: true,
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        categoryId: { type: 'string', example: '' },
                        subCategoryId: { type: 'string', example: '' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400'],
                "404": swaggerHelpers.responseObject['404']
            }
        }
    },
    "/post/topProfiles": {
        post: {
            tags: ["Posts"],
            description: "Get top profile users.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400'],
                "404": swaggerHelpers.responseObject['404']
            }
        }
    },
    "/post/likeUnlikePost": {
        post: {
            tags: ["Posts"],
            description: "To Like/Unlike User Posts.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        postId: { type: 'string', example: '5c42ba3770d69734992b3ffb' },
                        ownerId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/post/showLikeUnlikeDetails": {
        post: {
            tags: ["Posts"],
            description: "To Like/Unlike User Posts.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                        postId: { type: 'string', example: '5c42ba3770d69734992b3ffb' },
                        ownerId: { type: 'string', example: '5c0251181835c34d347e23fc' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/post/trending-video-update": {
        post: {
            tags: ["Posts"],
            description: "Get Trending Feeds",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/getCategories": {
        post: {
            tags: ["Posts"],
            description: "Get Categories",
            consumes: ["application/json"],
            produces: ["application/json"],
            deprecated: true,
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/getSubcategories": {
        post: {
            tags: ["Posts"],
            description: "Get Subcategories",
            consumes: ["application/json"],
            produces: ["application/json"],
            deprecated: true,
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        categoryId: { type: 'string', example: '5a0ad6798345c0965c283ed0' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/savePosts": {
        post: {
            tags: ["Posts"],
            description: "savePosts",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        postId: { type: 'string', example: '5c42ba3770d69734992b3ffb' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/visitPost": {
        post: {
            tags: ["Posts"],
            description: "visitPost",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        postId: { type: 'string', example: '5c42ba3770d69734992b3ffb' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/visitPost1": {
        post: {
            tags: ["Posts"],
            description: "visitPost1",
            consumes: ["application/json"],
            produces: ["application/json"],
            deprecated: true,
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        postId: { type: 'string', example: '5c42ba3770d69734992b3ffb' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/showMyPosts-old": {
        post: {
            tags: ["Posts"],
            description: "showMyPosts-old",
            consumes: ["application/json"],
            produces: ["application/json"],
            deprecated: true,
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                        language: { type: 'string', example: 'hindi' },
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/showMyPosts": {
        post: {
            tags: ["Posts"],
            description: "showMyPosts",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                        language: { type: 'string', example: 'hindi' },
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/notificationFeed": {
        post: {
            tags: ["Posts"],
            description: "notificationFeed",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/report": {
        post: {
            tags: ["Posts"],
            description: "Report Post",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        postId: { type: 'string', example: '5c42ba3770d69734992b3ffb' },
                        reason: { type: 'string', example: 'some valid reason' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/addHashtag": {
        post: {
            tags: ["Posts"],
            description: "Add Hashtag",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        hashtag: { type: 'string', example: 'chingari' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/searchHashtag": {
        post: {
            tags: ["Posts"],
            description: "Search Hashtag",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        hashtag: { type: 'string', example: 'chingari' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/getPostsByHashtag": {
        post: {
            tags: ["Posts"],
            description: "getPostsByHashtag",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                        hashtag: { type: 'string', example: 'chingari' },
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/search-hashtag": {
        post: {
            tags: ["Posts"],
            description: "search-hashtag",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        q: { type: 'string', example: 'ching' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/search-hashtag1": {
        post: {
            tags: ["Posts"],
            description: "search-hashtag",
            consumes: ["application/json"],
            produces: ["application/json"],
            deprecated: true,
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        q: { type: 'string', example: 'ching' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/getHashtag": {
        post: {
            tags: ["Posts"],
            description: "getHashtag",
            produces: ["application/json"],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/hashtagPostData": {
        post: {
            tags: ["Posts"],
            description: "hashtagPostData",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                        hashtagId: { type: 'string', example: '5da409dcf18bc841d8c6fa97' },
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/postForSearhPage": {
        post: {
            tags: ["Posts"],
            description: "postForSearhPage",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/getHashtagWithPost": {
        post: {
            tags: ["Posts"],
            description: "getHashtagWithPost",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/getHashtagPosts": {
        post: {
            tags: ["Posts"],
            description: "getHashtagPosts",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                        hashTag: { type: 'string', example: 'chingari' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/createpost-duete-video": {
        post: {
            tags: ["Posts"],
            description: "Create Duet Post",
            consumes: ["application/json"],
            produces: ["application/json"],
            "parameters": [
                {
                    in: "formData",
                    name: "filetoupload",
                    type: "file",
                    required: true,
                    description: "The file to upload."
                },
                {
                    in: "formData",
                    name: "userId",
                    type: "string",
                    required: true,
                },
                {
                    in: "formData",
                    name: "mediaType",
                    type: "string",
                    required: true,
                },
                {
                    in: "formData",
                    name: "language",
                    type: "string",
                    required: true,
                },
                {
                    in: "formData",
                    name: "hashTagData",
                    type: "string",
                    required: true,
                },
                {
                    in: "formData",
                    name: "filePath",
                    type: "string",
                    required: true,
                },
                {
                    in: "formData",
                    name: "caption",
                    type: "string",
                    required: true,
                },
                {
                    in: "formData",
                    name: "share",
                    type: "string",
                    required: true,
                },
                {
                    in: "formData",
                    name: "comment",
                    type: "string",
                    required: true,
                },
            ],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/adding_music": {
        post: {
            tags: ["Posts"],
            description: "Add Music",
            consumes: ["application/json"],
            produces: ["application/json"],
            "parameters": [
                {
                    in: "formData",
                    name: "userMedia",
                    type: "file",
                    required: true,
                    description: "The file to upload."
                },
                {
                    in: "formData",
                    name: "mediaType",
                    type: "string",
                    required: true,
                },
                {
                    in: "formData",
                    name: "name",
                    type: "string",
                    required: true,
                },
                {
                    in: "formData",
                    name: "categoryId",
                    type: "string",
                    required: true,
                },
                {
                    in: "formData",
                    name: "audioLength",
                    type: "string",
                    required: true,
                },
                {
                    in: "formData",
                    name: "uploader",
                    type: "string",
                    required: true,
                }
            ],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/get_audio_category": {
        post: {
            tags: ["Posts"],
            description: "Get Audio Category",
            consumes: ["application/json"],
            produces: ["application/json"],
            deprecated: true,
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/get_audio_clip": {
        post: {
            tags: ["Posts"],
            description: "Get Audio Clip",
            consumes: ["application/json"],
            produces: ["application/json"],
            deprecated: true,
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                        categoryId: { type: 'string', example: '5ce4ebeb1f53ab0ce0dc96e9' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/get_song_category": {
        post: {
            tags: ["Posts"],
            description: "Get Song Category",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/get_song_clip": {
        post: {
            tags: ["Posts"],
            description: "Get Song Clip",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                        duration: { type: 'string', example: '10' },
                        categoryName: { type: 'string', example: 'Chingari Rising' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/songSearch": {
        post: {
            tags: ["Posts"],
            description: "Search Song",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                        duration: { type: 'string', example: '1' },
                        title: { type: 'string', example: 'Bappa Morya' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/post/latestVideo": {
        post: {
            tags: ["Posts"],
            description: "Latest Video",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                        language: { type: 'string', example: 'hindi' },
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },


    "/users/register": {
        post: {
            tags: ["User"],
            description: "For User Registration.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        firebaseId: { type: 'string', example: '1234568798' },
                        deviceId: { type: 'string', example: 'fsgjfasfuasfiufuasgfuga' },
                        contact: { type: 'string', example: '+919876543210' },
                        language: { type: 'string', example: 'hindi' },
                        name: { type: 'string', example: 'abcd xyz' },
                        gender: { type: 'string', example: 'true' },
                        isAdult: { type: 'string', example: '1' },
                        platform: { type: 'string', example: 'android' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/users/register-new": {
        post: {
            tags: ["User"],
            description: "For User Registration.",
            consumes: ["application/json"],
            produces: ["application/json"],
            deprecated: true,
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        firebaseId: { type: 'string', example: '1234568798' },
                        deviceId: { type: 'string', example: 'fsgjfasfuasfiufuasgfuga' },
                        contact: { type: 'string', example: '+919876543210' },
                        language: { type: 'string', example: 'hindi' },
                        name: { type: 'string', example: 'abcd xyz' },
                        gender: { type: 'string', example: 'true' },
                        isAdult: { type: 'string', example: '1' },
                        platform: { type: 'string', example: 'android' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/users/register-saisanath": {
        post: {
            tags: ["User"],
            description: "For User Registration.",
            consumes: ["application/json"],
            produces: ["application/json"],
            deprecated: true,
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        firebaseId: { type: 'string', example: '1234568798' },
                        deviceId: { type: 'string', example: 'fsgjfasfuasfiufuasgfuga' },
                        contact: { type: 'string', example: '+919876543210' },
                        language: { type: 'string', example: 'hindi' },
                        name: { type: 'string', example: 'abcd xyz' },
                        gender: { type: 'string', example: 'true' },
                        isAdult: { type: 'string', example: '1' },
                        platform: { type: 'string', example: 'android' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/users/checkuser-number": {
        post: {
            tags: ["User"],
            description: "To Check user by Contact.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        contact: { type: 'string', example: '+919876543210' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/users/deactivateAccount": {
        post: {
            tags: ["User"],
            description: "To Deactivate the user account.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        userId: { type: 'string', example: '5c0251181835c34d347e65sa' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/users/check-username": {
        post: {
            tags: ["User"],
            description: "Check if Username is Available or taken.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        q: { type: 'string', example: 'sumit' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/users/check-user": {
        post: {
            tags: ["User"],
            description: "Check User before Registration and update if exists.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        contact: { type: 'string', example: '+919876543210' },
                        deviceId: { type: 'string', example: 'asdjfhadsdsdbgb' },
                        firebaseId: { type: 'string', example: 'haifhaifhiodgoisghoih' },
                        isAdult: { type: 'string', example: '1' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/users/update-device-id": {
        post: {
            tags: ["User"],
            description: "To update deviceId of User.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        userId: { type: 'string', example: '5c0251181835c34d347e65sa' },
                        deviceId: { type: 'string', example: 'asdjfhadsdsdbgb' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/users/getProfile": {
        post: {
            tags: ["User"],
            description: "Get Profile Data including followers, following and Posts count.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        userId: { type: 'string', example: '5d0374c66d47152fdad7e56c' },
                        ownerId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/users/getPosts": {
        post: {
            tags: ["User"],
            description: "Get Posts Data.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                        userId: { type: 'string', example: '5d0374c66d47152fdad7e56c' },
                        ownerId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },

    /* ====  OLD  ==== */
    "/news/getNewsCategory": {
        get: {
            tags: ["News-OLD"],
            description: "Get news category",
            consumes: ["application/json"],
            produces: ["application/json"],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/news/newsFeed": {
        post: {
            tags: ["News-OLD"],
            description: "Get news feeds.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        categoryId: { type: 'string', example: '5d11f4885175cc2374510c49' },
                        language: { type: 'string', example: 'english' },
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/news/newsFeedWithLike": {
        post: {
            tags: ["News-OLD"],
            description: "Get news feeds with like.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        categoryId: { type: 'string', example: '5d11f4885175cc2374510c49' },
                        language: { type: 'string', example: 'english' },
                        userId: { type: 'string', example: '5bfe42bcc4b1001e15297881' },
                        deviceId: { type: 'string', example: 'ndjkfhjh43757y473877ehdy8383' },
                        tokenId: { type: 'string', example: '5bfe42bckff' },
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                    }
                }
            }],
            responses: {
                "400": swaggerHelpers.responseObject['400'],
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/news/newsLikeUnlike": {
        post: {
            tags: ["News-OLD"],
            description: "News like and unlike.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        newsId: { type: 'string', example: '5d15b9892caa831458b66f45' },
                        userId: { type: 'string', example: '5bfe42bcc4b1001e15297881' },
                        tokenId: { type: 'string', example: '5bfe42bckff' },
                        deviceId: { type: 'string', example: 'ndjkfhjh43757y473877ehdy8383' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/news/addnewsUserStat": {
        post: {
            tags: ["News-OLD"],
            description: "Add user stat.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        categoryId: { type: 'string', example: '5d11f4885175cc2374510c49' },
                        newsurlId: { type: 'string', example: '5d15b9892caa831458b66f45' },
                        userId: { type: 'string', example: '5bfe42bcc4b1001e15297881' },
                        deviceId: { type: 'string', example: 'ndjkfhjh43757y473877ehdy8383' },
                        tokenId: { type: 'string', example: '5bfe42bckff' },
                        newsId: { type: 'string', example: '5d984ffc5db2102310dc8a63' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/news/addNewsComment": {
        post: {
            tags: ["News-OLD"],
            description: "Add comment.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        newsId: { type: 'string', example: '5d984ffc5db2102310dc8a63' },
                        userId: { type: 'string', example: '5bfe42bcc4b1001e15297881' },
                        comment: { type: 'string', example: 'hello' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/news/deleteNewsComment": {
        post: {
            tags: ["News-OLD"],
            description: "Delete comment.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        newsId: { type: 'string', example: '5d984ffc5db2102310dc8a63' },
                        userId: { type: 'string', example: '5bfe42bcc4b1001e15297881' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/news/newsComment": {
        post: {
            tags: ["News-OLD"],
            description: "Comment list.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        newsId: { type: 'string', example: '5d984ffc5db2102310dc8a63' },
                        userId: { type: 'string', example: '5bfe42bcc4b1001e15297881' },
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200']
            }
        }
    },
    "/news/updateTempUserToChingari": {
        post: {
            tags: ["News-OLD"],
            description: "Update temp user to chingari.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        userId: { type: 'string', example: '5bfe42bcc4b1001e15297881' },
                        tokenId: { type: 'string', example: '5bfe42bckff' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },

    /* ====  NEW  ==== */
    "/news/welcome-check": {
        post: {
            tags: ["News"],
            description: "Check if User Has Already Followed Welcome Categories.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        tokenId: { type: 'string', example: '12345564344' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/news/welcome-follow": {
        post: {
            tags: ["News"],
            description: "Follow News Categories on Users First Visit.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        newsCategoryIds: { type: 'string', example: '5db3ee02703ac615fca3166c,5db3edec03a52d14241ca21a' },
                        tokenId: { type: 'string', example: '12345564344' },
                        deviceId: { type: 'string', example: 'csHiFA2Bg9w:APA91bGBT1_u39AMYEtcN6x6CbripTTv8sjr2SPTQY5SV7FoDvURsSomAxLwwZDJhV9zT--V9UkRG6FOH6H6_J0egLgPAobEYjrLkUUOZufSQaNXQulR6MsJe9K6ibnzgIB2ry21b2Nx' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/news/categories": {
        get: {
            tags: ["News"],
            description: "Get news category",
            consumes: ["application/json"],
            produces: ["application/json"],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/news/news-feeds": {
        post: {
            tags: ["News"],
            description: "News Feeds with liked and channel data.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        categoryId: { type: 'string', example: '5db3ee02703ac615fca3166c' },
                        language: { type: 'string', example: 'english' },
                        deviceId: { type: 'string', example: 'csHiFA2Bg9w:APA91bGBT1_u39AMYEtcN6x6CbripTTv8sjr2SPTQY5SV7FoDvURsSomAxLwwZDJhV9zT--V9UkRG6FOH6H6_J0egLgPAobEYjrLkUUOZufSQaNXQulR6MsJe9K6ibnzgIB2ry21b2Nx' },
                        tokenId: { type: 'string', example: '12345564344' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/news/following-feeds": {
        post: {
            tags: ["News"],
            description: "Following channel News Feeds with liked and channel data.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        language: { type: 'string', example: 'english' },
                        deviceId: { type: 'string', example: 'csHiFA2Bg9w:APA91bGBT1_u39AMYEtcN6x6CbripTTv8sjr2SPTQY5SV7FoDvURsSomAxLwwZDJhV9zT--V9UkRG6FOH6H6_J0egLgPAobEYjrLkUUOZufSQaNXQulR6MsJe9K6ibnzgIB2ry21b2Nx' },
                        tokenId: { type: 'string', example: '12345564344' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/news/category-feeds": {
        post: {
            tags: ["News"],
            description: "Followed Category News Feeds with liked and channel data.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        language: { type: 'string', example: 'english' },
                        deviceId: { type: 'string', example: 'csHiFA2Bg9w:APA91bGBT1_u39AMYEtcN6x6CbripTTv8sjr2SPTQY5SV7FoDvURsSomAxLwwZDJhV9zT--V9UkRG6FOH6H6_J0egLgPAobEYjrLkUUOZufSQaNXQulR6MsJe9K6ibnzgIB2ry21b2Nx' },
                        tokenId: { type: 'string', example: '12345564344' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/news/like-unlike": {
        post: {
            tags: ["News"],
            description: "Follow and unfollow new Channel.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        newsId: { type: 'string', example: '5db96864c9de6f295026ca5d' },
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        deviceId: { type: 'string', example: 'csHiFA2Bg9w:APA91bGBT1_u39AMYEtcN6x6CbripTTv8sjr2SPTQY5SV7FoDvURsSomAxLwwZDJhV9zT--V9UkRG6FOH6H6_J0egLgPAobEYjrLkUUOZufSQaNXQulR6MsJe9K6ibnzgIB2ry21b2Nx' },
                        tokenId: { type: 'string', example: '12345564344' },
                        age: { type: 'string', example: '24' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/news/follow-unfollow": {
        post: {
            tags: ["News"],
            description: "Follow and unfollow new Channel.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        newsChannelId: { type: 'string', example: '5db3fc6d329c51236c55cf6b' },
                        deviceId: { type: 'string', example: 'csHiFA2Bg9w:APA91bGBT1_u39AMYEtcN6x6CbripTTv8sjr2SPTQY5SV7FoDvURsSomAxLwwZDJhV9zT--V9UkRG6FOH6H6_J0egLgPAobEYjrLkUUOZufSQaNXQulR6MsJe9K6ibnzgIB2ry21b2Nx' },
                        tokenId: { type: 'string', example: '12345564344' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/news/follow-unfollow-category": {
        post: {
            tags: ["News"],
            description: "Follow and unfollow news Categories.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        newsCategoryId: { type: 'string', example: '5db3eddabd50001094d5af9e' },
                        deviceId: { type: 'string', example: 'csHiFA2Bg9w:APA91bGBT1_u39AMYEtcN6x6CbripTTv8sjr2SPTQY5SV7FoDvURsSomAxLwwZDJhV9zT--V9UkRG6FOH6H6_J0egLgPAobEYjrLkUUOZufSQaNXQulR6MsJe9K6ibnzgIB2ry21b2Nx' },
                        tokenId: { type: 'string', example: '12345564344' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/news/block-unblock": {
        post: {
            tags: ["News"],
            description: "Follow and unfollow new Channel.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        newsChannelId: { type: 'string', example: '5db3fc6d329c51236c55cf6b' },
                        deviceId: { type: 'string', example: 'csHiFA2Bg9w:APA91bGBT1_u39AMYEtcN6x6CbripTTv8sjr2SPTQY5SV7FoDvURsSomAxLwwZDJhV9zT--V9UkRG6FOH6H6_J0egLgPAobEYjrLkUUOZufSQaNXQulR6MsJe9K6ibnzgIB2ry21b2Nx' },
                        tokenId: { type: 'string', example: '12345564344' },
                        age: { type: 'string', example: '24' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/news/comments": {
        post: {
            tags: ["News"],
            description: "Get news Comments",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '10' },
                        newsId: { type: 'string', example: '5daaadd09c295134de59c990' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/news/add-comment": {
        post: {
            tags: ["News"],
            description: "Add news Comment",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        newsId: { type: 'string', example: '5daaadd09c295134de59c990' },
                        comment: { type: 'string', example: 'test' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/news/delete-comment": {
        post: {
            tags: ["News"],
            description: "Delete news Comment.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        commentId: { type: 'string', example: '5daaadd09c295134de59c990' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/news/search-title": {
        post: {
            tags: ["News"],
            description: "Elastic Search News Feeds By Title.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '5' },
                        query: { type: 'string', example: 'kash' },
                        language: { type: 'string', example: 'english' },
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/news/add-user-stat": {
        post: {
            tags: ["News"],
            description: "Add User Stats For News.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        newsId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        categoryId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        newsChannelId: { type: 'string', example: '5db3fc6d329c51236c55cf6b' },
                        deviceId: { type: 'string', example: 'csHiFA2Bg9w:APA91bGBT1_u39AMYEtcN6x6CbripTTv8sjr2SPTQY5SV7FoDvURsSomAxLwwZDJhV9zT--V9UkRG6FOH6H6_J0egLgPAobEYjrLkUUOZufSQaNXQulR6MsJe9K6ibnzgIB2ry21b2Nx' },
                        tokenId: { type: 'string', example: '12345564344' },
                        time: { type: 'string', example: '10' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
    "/news/migrate-temp-user": {
        post: {
            tags: ["News"],
            description: "Migrate temporary User Data After Signin.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        userId: { type: 'string', example: '5c0251181835c34d347e23fc' },
                        tokenId: { type: 'string', example: '12345564344' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },


    "/gamepix/games": {
        post: {
            tags: ["GamePix"],
            description: "Get GamePix Games Data.",
            consumes: ["application/json"],
            produces: ["application/json"],
            parameters: [{
                in: "body",
                name: "Data",
                required: true,
                schema: {
                    type: "object",
                    properties: {
                        skip: { type: 'string', example: '0' },
                        limit: { type: 'string', example: '5' }
                    }
                }
            }],
            responses: {
                "200": swaggerHelpers.responseObject['200'],
                "400": swaggerHelpers.responseObject['400']
            }
        }
    },
};