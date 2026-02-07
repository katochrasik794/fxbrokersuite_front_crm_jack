import axios from 'axios'
import authService from './auth'

// Ensure API_URL includes /api if not already present
const baseUrl = import.meta.env.VITE_API_URL || 'https://fxbrokersuite-back-crm-jack.onrender.com/api'
const API_URL = baseUrl.endsWith('/api') ? `${baseUrl}/support` : `${baseUrl}/api/support`

// Debug: Log API URL in development
if (import.meta.env.DEV) {
    console.log('📧 Support Service API URL:', API_URL)
    console.log('📧 VITE_API_URL:', import.meta.env.VITE_API_URL)
}

const getHeaders = () => {
    const token = authService.getToken()
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }
}

const getAdminHeaders = () => {
    const token = localStorage.getItem('adminToken')
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }
}

const supportService = {
    // User Methods
    getTickets: async () => {
        const response = await axios.get(API_URL, getHeaders())
        return response.data
    },

    getTicket: async (id) => {
        const response = await axios.get(`${API_URL}/${id}`, getHeaders())
        return response.data
    },

    createTicket: async (ticketData) => {
        try {
            const response = await axios.post(API_URL, ticketData, getHeaders())
            return response.data
        } catch (error) {
            console.error('Create ticket error:', error)
            console.error('API URL:', API_URL)
            console.error('Request data:', ticketData)
            if (error.response) {
                console.error('Response status:', error.response.status)
                console.error('Response data:', error.response.data)
            }
            throw error
        }
    },

    replyToTicket: async (id, message) => {
        const response = await axios.post(`${API_URL}/${id}/reply`, { message }, getHeaders())
        return response.data
    },

    // Admin Methods
    getAllTickets: async (status) => {
        const url = `${API_URL}/admin/all${status ? `?status=${status}` : ''}`
        const response = await axios.get(url, getAdminHeaders())
        return response.data
    },

    getAdminTicket: async (id) => {
        const response = await axios.get(`${API_URL}/admin/${id}`, getAdminHeaders())
        return response.data
    },

    adminReply: async (id, message, status) => {
        const response = await axios.post(`${API_URL}/admin/${id}/reply`, { message, status }, getAdminHeaders())
        return response.data
    },

    updateStatus: async (id, status) => {
        const response = await axios.post(`${API_URL}/admin/${id}/status`, { status }, getAdminHeaders())
        return response.data
    },

    assignTicket: async (id, roleId) => {
        const response = await axios.post(`${API_URL}/admin/${id}/assign`, { roleId }, getAdminHeaders())
        return response.data
    }
}

export default supportService
