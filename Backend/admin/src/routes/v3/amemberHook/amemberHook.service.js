const axios = require("axios");
const EventEmitter = require("events");

const amBaseUrl = process.env.APP_AMEMBER_URL;
const amKey = process.env.APP_AMEMBER_KEY;

// Create an instance of EventEmitter
const eventEmitter = new EventEmitter();

class AmemberHookService {
    async getPlanExpiryDate(user_id, login) {
        try {
            await sleep(1000 * 5); // Sleep for 5 Seconds
            // Fetch subscription details
            const subscriptionResult = await axios.get(`${amBaseUrl}check-access/by-login`, {
                params: { _key: amKey, login },
            });

            if (!subscriptionResult.data.ok || !subscriptionResult.data.subscriptions) {
                throw new Error("Invalid subscription details.");
            }

            const activePlanKey = checkPlans(subscriptionResult.data.subscriptions);
            if (!activePlanKey) {
                throw new Error("No active plans found.");
            }

            const activeSubscriptionDate = subscriptionResult.data.subscriptions[activePlanKey];

            // Fetch invoice details
            const invoiceResult = await axios.get(`${amBaseUrl}invoices`, {
                params: { _key: amKey, "_filter[user_id]": user_id },
            });

            if (invoiceResult.data._total === 0) {
                throw new Error("No invoices found.");
            }

            const activeInvoiceIndex = checkActiveInvoice(invoiceResult.data, activePlanKey);
            if(activeInvoiceIndex === -1 && subscriptionResult.data.subscriptions) {
                return subscriptionResult.data.subscriptions[Object.keys(subscriptionResult.data.subscriptions).sort((a,b) => b - a)[0]];
            }
            
            if (activeInvoiceIndex === -1) {
                return null;
            }

            const currentPlan = invoiceResult.data[activeInvoiceIndex].nested["invoice-items"];
            let keyAccess = 0;

            invoiceResult.data[activeInvoiceIndex].nested.access.forEach((accessItem, index) => {
                if (new Date(accessItem.expire_date) > new Date()) {
                    keyAccess = index;
                }
            });

            return (
                activeSubscriptionDate ||
                invoiceResult.data[activeInvoiceIndex].nested.access[keyAccess]?.expire_date ||
                "2000-01-01"
            );
        } catch (error) {
            console.error("Error in getPlanExpiryDate:", error.message);
            throw error;
        }
    }
}


// Helper Functions
function checkActiveInvoice(invoiceData, planKey) {
    for (let i = Object.keys(invoiceData).length - 1; i >= 0; i--) {
        const invoice = invoiceData[i];
        if(!invoice) continue;
        if(!invoice?.nested["access"]) continue;
        const statusValid = [1, 2, 3, 4, 5].includes(invoice?.status);
        const itemMatches = invoice?.nested["access"][0].product_id == planKey;

        if (statusValid && itemMatches) {
            return i;
        }
    }
    return -1;
}


function checkPlans(plans) {
    const currentDate = new Date();
    let activePlan = {};
    let maxDate = null;
    let maxDateKey = null;

    for (const [planId, planDate] of Object.entries(plans)) {
        activePlan[planId] = planDate;
    }

    if (!Object.keys(activePlan).length) return null;

    for (const [key, planDate] of Object.entries(activePlan)) {
        const planDateObj = new Date(planDate);
        if (planDateObj >= currentDate && (!maxDate || planDateObj > maxDate)) {
            maxDate = planDateObj;
            maxDateKey = key;
        }
    }

    return maxDateKey;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = new AmemberHookService();
