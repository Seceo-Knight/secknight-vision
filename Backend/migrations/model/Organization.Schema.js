const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrganizationCategories = new Schema({
    name: { type: String, required: true },
    organization_id: { type: Number, required: true },
    status: { type: Number, default: 0 }, // 0-Neutral, 1-productive, 2-non productive
    is_new: { type: Boolean, default: true },
    department_rule: { type: Array, default: [] }, //[{department_id:1,status:0}]
    type: { type: Number, default: 1 },  // 1-Global, 2-Custom
    total_webs: { type: Number, default: 0 },//total number of domain under this category
    pre_request: { type: Number, default: 0 },// pre-request time in seconds
}, { timestamps: true });
OrganizationCategories.index({ name: 1 });
OrganizationCategories.index({ organization_id: 1 });
OrganizationCategories.index({ status: 1 });
OrganizationCategories.index({ organization_id: 1, name: 1 }, { unique: true });

const OrganizationCategoriesModel = mongoose.model('organization_categories', OrganizationCategories)

module.exports = OrganizationCategoriesModel;

OrganizationCategories.pre('save', async function(next) {
    const existingDoc = await this.constructor.findOne({
        name: this.name,
        organization_id: this.organization_id,
    });

    if (existingDoc) {
        const err = new Error('Document with the same combination already exists');
        next(err);
    } else {
        next();
    }
});


const OrganizationCategoriesDatas = [
    'Technology',
    'Fashion',
    'Travel',
    'Food & Drink',
    'Health & Fitness',
    'Finance',
    'Education',
    'Entertainment',
    'Sports',
    'Automotive',
    'Home & Garden',
    'Music',
    'Books & Literature',
    'Art & Design',
    'Pets',
    'Photography',
    'Business',
    'News',
    'Gaming',
    'Science',
    'History',
    'Fitness',
    'Movies',
    'TV Shows',
    'DIY & Crafts',
    'Parenting',
    'Fashion Accessories',
    'Electronics',
    'Cooking',
    'Yoga',
    'Investing',
    'Online Learning',
    'Concerts',
    'Magazines',
    'Gardening',
    'Travel Guides',
    'Healthy Eating',
    'Banking',
    'Online Shopping',
    'Social Media',
    'Outdoor Activities',
    'Car Maintenance',
    'Interior Design',
    'Musical Instruments',
    'Pet Care',
    'Wedding Planning',
    'Fashion Trends',
    'Computer Programming',
    'Art History',
    'Dog Training',
    'Nature Photography',
    'Small Business Tips',
    'Political News',
    'Video Games',
    'Space Exploration',
    'Ancient Civilizations',
    'CrossFit',
    'Indie Music',
    'Cookbook Reviews',
    'DIY Home Decor',
    'Pregnancy & Childbirth',
    'Cloud Service',
    'Computer & Technology',
    'Eduction',
    'Shopping',
    'Social',
    'Travel & Photography',
    'Web Search',
    'Beauty & Lifestyle',
    'Games & Gambling',
    'Food',
    'Dating & Marriage',
    'Job Search',
    'Banking & Finance',
    'adult',
    'astrology & horoscope',
    'appliances',
    'Uncategorized'
];


const insertData = async () => {

    for (const OrganizationCategoriesData of OrganizationCategoriesDatas) {
        try {
            await new OrganizationCategoriesModel({ name: OrganizationCategoriesData, organization_id: 0 }).save();
        } catch (error) {}
    }
    
}

module.exports.insertData = insertData;

