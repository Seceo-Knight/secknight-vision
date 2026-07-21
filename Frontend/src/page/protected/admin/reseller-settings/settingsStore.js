import { create } from "zustand";
import { getResellerSettings, saveResellerSettings } from "../reseller-dashboard/service";

const fileToDataUrl = (file) =>
    new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
    });

const DEFAULT_FORM = {
    facebook: "", instagram: "", twitter: "",
    brand_name: "", copyright_name: "", copyright_year: "",
    support_text: "", support_mail: "", skype_email: "",
    help_link: "", admin_email: "", logo: "",
};

export const useResellerSettingsStore = create((set, get) => ({
    form: { ...DEFAULT_FORM },
    logoFile: null,
    faviconFile: null,
    loading: false,
    saving: false,
    error: null,
    successMsg: null,
    fieldErrors: {},

    clearMessages: () => set({ error: null, successMsg: null, fieldErrors: {} }),

    setField: (key, value) => {
        set((state) => ({ form: { ...state.form, [key]: value }, fieldErrors: { ...state.fieldErrors, [key]: null } }));
    },

    setLogoFile: (file) => set({ logoFile: file }),
    setFaviconFile: (file) => set({ faviconFile: file }),

    loadSettings: async () => {
        try {
            set({ loading: true });
            const data = await getResellerSettings();
            set({
                form: {
                    facebook: data.facebook || "",
                    instagram: data.instagram || "",
                    twitter: data.twitter || "",
                    brand_name: data.brand_name || "",
                    copyright_name: data.copyright_name || "",
                    copyright_year: data.copyright_year || "",
                    support_text: data.support_text || "",
                    support_mail: data.support_mail || "",
                    skype_email: data.skype_email || "",
                    help_link: data.help_link || "",
                    admin_email: data.admin_email || "",
                    logo: data.logo || "",
                },
                loading: false,
            });
        } catch {
            set({ loading: false, error: "Failed to load settings" });
        }
    },

    saveSettings: async () => {
        const { form, logoFile, faviconFile } = get();

        if (!form.brand_name.trim()) {
            set({ error: "Brand name is required" });
            return false;
        }

        set({ saving: true, fieldErrors: {} });

        // Backend expects logo as a URL string, not a File.
        // Convert file to base64 data URL if a new file was selected,
        // otherwise send the existing logo URL from settings.
        const payload = { ...form };
        payload.domain = window.location.origin;

        if (logoFile) {
            payload.logo = await fileToDataUrl(logoFile);
        }
        // Don't send logo key if it's empty — let backend keep existing
        if (!payload.logo) delete payload.logo;

        const result = await saveResellerSettings(payload);
        set({ saving: false });

        if (result.success) {
            set({ successMsg: result.message || "Settings saved successfully" });
            return true;
        }

        // Handle field-level validation errors
        if (result.errors && Array.isArray(result.errors)) {
            const errs = {};
            const ERROR_FIELD_MAP = [
                { patterns: ["Facebook"],                          field: "facebook" },
                { patterns: ["Instagram"],                         field: "instagram" },
                { patterns: ["Twitter"],                           field: "twitter" },
                { patterns: ["Brand", "brand_name"],               field: "brand_name" },
                { patterns: ["copyright_name", "alphabets and spaces"], field: "copyright_name" },
                { patterns: ["date formate", "copyright_year"],    field: "copyright_year" },
                { patterns: ["support_text", "Only alphabets"],    field: "support_text" },
                { patterns: ["Support Email", "support_email"],    field: "support_mail" },
                { patterns: ["skype"],                             field: "skype_email" },
                { patterns: ["admin email"],                       field: "admin_email" },
            ];
            result.errors.forEach((msg) => {
                const lower = msg.toLowerCase();
                const match = ERROR_FIELD_MAP.find((e) => e.patterns.some((p) => lower.includes(p.toLowerCase())));
                if (match) errs[match.field] = msg;
            });
            set({ fieldErrors: errs });
        } else {
            set({ error: result.message });
        }
        return false;
    },
}));
