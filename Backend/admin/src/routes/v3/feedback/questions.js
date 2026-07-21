// module.exports = question = [
//     { id: 1, question: "Did we met your expectation?", type: "radio", options: [{ option_id: 1, value: "Yes" }, { option_id: 2, value: "No" }] },
//     {
//         id: 2, question: "Rate your experience on the quality of service we provided you.", type: "radio",
//         options: [
//             { option_id: 1, value: "Very satisfied" },
//             { option_id: 2, value: "Satisfied" },
//             { option_id: 3, value: "Somewhat satisfied" },
//             { option_id: 4, value: "Neither satisfied nor dissatisfied" },
//             { option_id: 5, value: "Somewhat dissatisfied" },
//             { option_id: 6, value: "Dissatisfied" },
//             { option_id: 7, value: "Very dissatisfied" },

//         ]
//     },
//     { id: 3, question: "Were you query or concern was addressed properly?", type: "radio", options: [{ option_id: 1, value: "Yes" }, { option_id: 2, value: "No" }] },
//     { id: 5, question: "Would you recommend us to others?", type: "radio", options: [{ option_id: 1, value: "Yes" }, { option_id: 2, value: "No" }] },
//     {
//         id: 4, question: "How satisfied are you with the account setup experience of EmpMonitor?",
//         type: "stars", options: [
//             { option_id: 1, value: 1 },
//             { option_id: 2, value: 2 },
//             { option_id: 3, value: 3 },
//             { option_id: 4, value: 4 },
//             { option_id: 5, value: 5 }
//         ]
//     },
// ];
const { feedbackMessage } = require("../../../utils/helpers/LanguageTranslate");

const question = async (language) => {
    let feedback = [
        { id: 1, question: feedbackMessage[2][language] || feedbackMessage[2]["en"], type: "radio", options: [{ option_id: 1, value: feedbackMessage[7][language] || feedbackMessage[7]["en"] }, { option_id: 2, value: feedbackMessage[8][language] || feedbackMessage[8]["en"] }] },
        {
            id: 2, question: feedbackMessage[3][language] || feedbackMessage[3]["en"], type: "radio",
            options: [
                { option_id: 1, value: feedbackMessage[9][language] || feedbackMessage[9]["en"] },
                { option_id: 2, value: feedbackMessage[10][language] || feedbackMessage[10]["en"] },
                { option_id: 3, value: feedbackMessage[11][language] || feedbackMessage[11]["en"] },
                { option_id: 4, value: feedbackMessage[12][language] || feedbackMessage[13]["en"] },
                { option_id: 5, value: feedbackMessage[13][language] || feedbackMessage[13]["en"] },
                { option_id: 6, value: feedbackMessage[14][language] || feedbackMessage[14]["en"] },
                { option_id: 7, value: feedbackMessage[15][language] || feedbackMessage[15]["en"] },
            ]
        },
        { id: 3, question: feedbackMessage[4][language] || feedbackMessage[4]["en"], type: "radio", options: [{ option_id: 1, value: feedbackMessage[7][language] || feedbackMessage[7]["en"] }, { option_id: 2, value: feedbackMessage[8][language] || feedbackMessage[8]["en"] }] },
        { id: 5, question: feedbackMessage[5][language] || feedbackMessage[5]["en"], type: "radio", options: [{ option_id: 1, value: feedbackMessage[7][language] || feedbackMessage[7]["en"] }, { option_id: 2, value: feedbackMessage[8][language] || feedbackMessage[8]["en"] }] },
        {
            id: 4, question: feedbackMessage[6][language] || feedbackMessage[6]["en"],
            type: "stars", options: [
                { option_id: 1, value: 1 },
                { option_id: 2, value: 2 },
                { option_id: 3, value: 3 },
                { option_id: 4, value: 4 },
                { option_id: 5, value: 5 }
            ]
        },
    ];

    return await feedback
}

module.exports = question;