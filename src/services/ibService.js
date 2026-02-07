const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fxbrokersuite-back-crm-jack.onrender.com/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const ibService = {
    async getStatus() {
        const response = await fetch(`${API_BASE_URL}/ib/status`, {
            headers: getHeaders()
        });
        return response.json();
    },

    async getDashboardStats() {
        const response = await fetch(`${API_BASE_URL}/ib/dashboard`, {
            headers: getHeaders()
        });
        return response.json();
    },

    async getClients(params = {}) {
        const { page = 1, limit = 10, search = '' } = params;
        const query = new URLSearchParams({ page, limit, search }).toString();
        const response = await fetch(`${API_BASE_URL}/ib/clients?${query}`, {
            headers: getHeaders()
        });
        return response.json();
    },

    async getTree() {
        const response = await fetch(`${API_BASE_URL}/ib/tree`, {
            headers: getHeaders()
        });
        return response.json();
    },

    async getProfile() {
        const response = await fetch(`${API_BASE_URL}/ib/profile`, {
            headers: getHeaders()
        });
        return response.json();
    },

    async getWithdrawals() {
        // We can use the existing withdrawals endpoint
        const response = await fetch(`${API_BASE_URL}/withdrawals/my`, {
            headers: getHeaders()
        });
        return response.json();
    },

    async getCommissionSummary(params = {}) {
        const { startDate, endDate, granularity } = params;
        const query = new URLSearchParams();
        if (startDate) query.append('start_date', startDate);
        if (endDate) query.append('end_date', endDate);
        if (granularity) query.append('granularity', granularity);

        const response = await fetch(`${API_BASE_URL}/ib/commission/summary?${query.toString()}`, {
            headers: getHeaders()
        });
        return response.json();
    },

    async getCommissionHistory(page = 1, limit = 10) {
        const response = await fetch(`${API_BASE_URL}/ib/commission/history?page=${page}&limit=${limit}`, {
            headers: getHeaders()
        });
        return response.json();
    },

    async getReferralReport() {
        const response = await fetch(`${API_BASE_URL}/ib/referral-report`, {
            headers: getHeaders()
        });
        return response.json();
    },

    async getWithdrawalPaymentMethods() {
        const response = await fetch(`${API_BASE_URL}/ib-withdrawals/payment-methods`, {
            headers: getHeaders()
        });
        return response.json();
    },

    async requestWithdrawal(amount, paymentDetailId) {
        const response = await fetch(`${API_BASE_URL}/ib-withdrawals`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ amount, paymentDetailId })
        });
        return response.json();
    },

    async getIBWithdrawals() {
        const response = await fetch(`${API_BASE_URL}/ib-withdrawals/my`, {
            headers: getHeaders()
        });
        return response.json();
    },

    async getIBPlans() {
        const response = await fetch(`${API_BASE_URL}/ib-requests/plans`, {
            headers: getHeaders()
        });
        return response.json();
    },

    async saveIBPlan(data) {
        const response = await fetch(`${API_BASE_URL}/ib-requests/plans`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return response.json();
    },

    async selectPlan(planType) {
        const response = await fetch(`${API_BASE_URL}/ib/select-plan`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ plan_type: planType })
        });
        return response.json();
    }
};

export default ibService;
