const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrganizationCategories = new Schema({
    name: { type: String, required: true },
    organization_id: { type: Number, required: true },
    status: { type: Number, default: 0 }, // 0-Neutral, 1-productive, 2-non productive
    is_new: { type: Boolean, default: true },
    department_rule: { type: Array, default: [] }, //[{department_id:1,status:0}]
    type: { type: Number, default: 1 },  // 1-Global, 2-Custom
    total_webs: { type: Number, default: 0 } //total number of domain under this category
}, { timestamps: true });
OrganizationCategories.index({ name: 1 });
OrganizationCategories.index({ organization_id: 1 });
OrganizationCategories.index({ status: 1 });
OrganizationCategories.index({ organization_id: 1, name: 1 }, { unique: true });

const OrganizationCategoriesModel = mongoose.model('organization_categories', OrganizationCategories)

module.exports = OrganizationCategoriesModel;

// Business

// Cloud Service
// Computer & Technology
// Eduction
// Entertainment
// News
// Shopping
// Social
// Sports
// Travel & Photography
// Web Search
// Beauty & Lifestyle
// Health & Fitness
// Games & Gambling
// Food
// Dating & Marriage
// Job Search
// Banking & Finance
// adult
// automotive
// astrology & horoscope
// appliances

// OrganizationCategoriesModel.insertMany([
//     { name: "Business", organization_id: 1 },
//     { name: "Cloud Service", organization_id: 1 },
//     { name: "Computer & Technology", organization_id: 1 },
//     { name: "Eduction", organization_id: 1 },
//     { name: "News", organization_id: 1 },
//     { name: "Shopping", organization_id: 1 },
//     { name: "Social", organization_id: 1 },
//     { name: "Sports", organization_id: 1 },
//     { name: "Travel & Photography", organization_id: 1 },
//     { name: "Web Search", organization_id: 1 },
//     { name: "Beauty & Lifestyle", organization_id: 1 },
//     { name: "Health & Fitness", organization_id: 1 },
//     { name: "Games & Gambling", organization_id: 1 },
//     { name: "Food", organization_id: 1 },
//     { name: "Dating & Marriage", organization_id: 1 },
//     { name: "Job Search", organization_id: 1 },
//     { name: "Banking & Finance", organization_id: 1 },
//     { name: "adult", organization_id: 1 },
//     { name: "astrology & horoscope", organization_id: 1 },
//     { name: "appliances", organization_id: 1 },
//     { name: "Uncategorized", organization_id: 1 },
// ])