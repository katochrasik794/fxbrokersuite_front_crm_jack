const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fxbrokersuite-back-crm-jack.onrender.com/api';

const getHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const ibAdminService = {
    async getWithdrawals() {
        const response = await fetch(`${API_BASE_URL}/admin/ib-withdrawals`, {
            headers: getHeaders()
        });
        return response.json();
    },

    async approveWithdrawal(id) {
        const response = await fetch(`${API_BASE_URL}/admin/ib-withdrawals/${id}/approve`, {
            method: 'PATCH',
            headers: getHeaders()
        });
        return response.json();
    },

    async rejectWithdrawal(id, reason) {
        const response = await fetch(`${API_BASE_URL}/admin/ib-withdrawals/${id}/reject`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ reason })
        });
        return response.json();
    },

    async distributeCommission(id, data) {
        const response = await fetch(`${API_BASE_URL}/ib-requests/commission-distribution/${id}/distribute`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return response.json();
    }
};

export default ibAdminService;
