const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const invoiceSchema = new Schema({
    organization_id: { type: Number, required: true },
    invoice_number: { type: String, required: true },
    template_name: { type: String, required: true },
    issued_date: { type: String, required: true },
    due_date: { type: String, default: null },
    from_logo: { type: String, default: null },
    from_business_name: { type: String, required: true },
    from_details: { type: String, default: null },
    to_business_name: { type: String, required: true },
    to_details: { type: String, default: null },
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    is_template: { type: Boolean, default: false },
    is_contactlist: { type: Boolean, default: false },
    tax: { type: Number, default: 0 },
    tax_type: { type: String, default: 'VAT' },
    currency_type: { type: String, default: null },
    projects: [{
        project_id: { type: Number, default: 0 },
        task_ids: { type: [Number], default: [] },
        total: { type: Number, default: 0 },
        price: { type: Number, default: 0 },
        quantity: { type: Number, default: 0 },
    }],
    comments: { type: String, default: null },
    status: { type: Number, default: 1 },//1-created, 2-cancelled, 3-paid , 4-sent, 5-unpaid
    created_by: { type: Number, required: true },
    sent_date: { type: Date, default: null }
}, { timestamps: true });

invoiceSchema.index({ organization_id: 1 });
invoiceSchema.index({ created_by: 1 });
invoiceSchema.index({ organization_id: 1, template_name: 1 });
invoiceSchema.index({ invoice_number: 1, organization_id: 1 }, { unique: true });

module.exports.InvoiceModel = mongoose.model('invoices', invoiceSchema);