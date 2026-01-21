import axios from 'axios';
import AuthService from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class WithdrawalService {
    // Helper to get headers with token
    getHeaders() {
        const token = AuthService.getToken();
        return {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };
    }

    /**
     * Get user's MT5 accounts for withdrawal selection
     */
    async getAccounts() {
        try {
            const response = await axios.get(`${API_BASE_URL}/accounts`, {
                headers: this.getHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching accounts:', error);
            throw error;
        }
    }

    /**
     * Get user's wallet for withdrawal selection
     */
    async getWallet() {
        try {
            const response = await axios.get(`${API_BASE_URL}/wallet`, {
                headers: this.getHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching wallet:', error);
            throw error;
        }
    }

    /**
     * Create a new withdrawal request
     * @param {Object} withdrawalData 
     */
    async createWithdrawal(withdrawalData) {
        try {
            const response = await axios.post(`${API_BASE_URL}/withdrawals`, withdrawalData, {
                headers: this.getHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error creating withdrawal:', error);
            throw error;
        }
    }

    /**
     * Get user's withdrawal history
     */
    async getMyWithdrawals() {
        try {
            const response = await axios.get(`${API_BASE_URL}/withdrawals/my`, {
                headers: this.getHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching withdrawals:', error);
            throw error;
        }
    }

    // --- Admin Endpoints ---

    /**
     * Get all withdrawals (Admin)
     * @param {string} status - Optional status filter
     */
    async getAllWithdrawals(status = 'all') {
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/withdrawals`, {
                headers: this.getHeaders(),
                params: { status }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching all withdrawals:', error);
            throw error;
        }
    }

    /**
     * Approve withdrawal (Admin)
     * @param {number} id - Withdrawal ID
     * @param {string} txId - Transaction ID
     */
    async approveWithdrawal(id, txId) {
        try {
            const response = await axios.post(`${API_BASE_URL}/admin/withdrawals/${id}/approve`,
                { externalTransactionId: txId },
                { headers: this.getHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Error approving withdrawal:', error);
            throw error;
        }
    }

    /**
     * Reject withdrawal (Admin)
     * @param {number} id - Withdrawal ID
     * @param {string} reason - Rejection reason
     */
    async rejectWithdrawal(id, reason) {
        try {
            const response = await axios.post(`${API_BASE_URL}/admin/withdrawals/${id}/reject`,
                { reason },
                { headers: this.getHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Error rejecting withdrawal:', error);
            throw error;
        }
    }
}

export default new WithdrawalService();
