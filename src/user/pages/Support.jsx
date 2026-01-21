import { useState, useEffect, useRef } from 'react'
import { MessageCircle } from 'lucide-react'
import supportService from '../../services/support.service'
import Swal from 'sweetalert2'
import AuthLoader from '../../components/AuthLoader'
import PageHeader from '../components/PageHeader.jsx'

function Support() {
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTicket, setActiveTicket] = useState(null)
    const [showCreateModal, setShowCreateModal] = useState(false)

    // Create Form State
    const [formData, setFormData] = useState({
        subject: '',
        category: 'General',
        priority: 'medium',
        message: ''
    })

    // Reply State
    const [replyMessage, setReplyMessage] = useState('')
    const [sendingReply, setSendingReply] = useState(false)

    const messagesEndRef = useRef(null)

    useEffect(() => {
        fetchTickets()
        // Poll for updates every 3 seconds for real-time experience
        const interval = setInterval(() => {
            if (activeTicket) {
                refreshActiveTicket()
            } else {
                fetchTickets(false) // silent update
            }
        }, 3000) // Poll every 3 seconds
        return () => clearInterval(interval)
    }, [activeTicket])

    // Scroll to bottom of chat
    useEffect(() => {
        if (activeTicket) {
            scrollToBottom()
        }
    }, [activeTicket?.messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const fetchTickets = async (showLoader = true) => {
        if (showLoader) setLoading(true)
        try {
            const data = await supportService.getTickets()
            if (data.success) {
                setTickets(data.data)
            }
        } catch (error) {
            console.error('Error fetching tickets:', error)
        } finally {
            if (showLoader) setLoading(false)
        }
    }

    const refreshActiveTicket = async () => {
        if (!activeTicket) return
        try {
            const data = await supportService.getTicket(activeTicket.ticket.id)
            if (data.success) {
                setActiveTicket(data.data)
            }
        } catch (error) {
            console.error('Error refreshing active ticket')
        }
    }

    const handleCreateTicket = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const result = await supportService.createTicket(formData)
            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Ticket Created',
                    text: 'Your support ticket has been created successfully.',
                    confirmButtonColor: '#d4b000'
                })
                setShowCreateModal(false)
                setFormData({ subject: '', category: 'General', priority: 'medium', message: '' })
                fetchTickets()
            } else {
                throw new Error(result.error || 'Failed to create ticket')
            }
        } catch (error) {
            console.error('Create ticket error:', error)
            console.error('Error response:', error.response)
            console.error('Error request URL:', error.config?.url)
            console.error('Error request method:', error.config?.method)
            
            let errorMessage = 'Failed to create ticket. Please try again.'
            if (error.response) {
                // Server responded with error
                errorMessage = error.response.data?.error || error.response.data?.message || `Server error: ${error.response.status}`
            } else if (error.request) {
                // Request was made but no response received
                errorMessage = 'No response from server. Please check your connection.'
            } else {
                // Error in request setup
                errorMessage = error.message || 'Failed to create ticket. Please try again.'
            }
            
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage,
                confirmButtonColor: '#d4b000',
                footer: error.config?.url ? `URL: ${error.config.url}` : ''
            })
        } finally {
            setLoading(false)
        }
    }

    const handleViewTicket = async (id) => {
        setLoading(true)
        try {
            const data = await supportService.getTicket(id)
            if (data.success) {
                setActiveTicket(data.data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleReply = async (e) => {
        e.preventDefault()
        if (!replyMessage.trim()) return

        setSendingReply(true)
        try {
            const result = await supportService.replyToTicket(activeTicket.ticket.id, replyMessage)
            if (result.success) {
                setReplyMessage('')
                refreshActiveTicket()
            }
        } catch (error) {
            console.error('Reply error:', error)
            Swal.fire({
                icon: 'error',
                title: 'Failed to send',
                text: 'Message could not be sent',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            })
        } finally {
            setSendingReply(false)
        }
    }

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'open': return 'bg-green-100 text-green-800'
            case 'answered': return 'bg-blue-100 text-blue-800'
            case 'closed': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6" style={{ fontFamily: 'Roboto, sans-serif' }}>
            {loading && !activeTicket && <AuthLoader message="Loading support..." />}

            <div className="flex justify-between items-start mb-6">
                <PageHeader
                  icon={MessageCircle}
                  title="Support Center"
                  subtitle="Get help from our support team. Create a ticket or view existing tickets."
                />
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-[#d4b000] hover:bg-[#c2a000] text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Ticket
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ticket List */}
                <div className={`lg:col-span-1 bg-white rounded-lg shadow-lg overflow-hidden ${activeTicket ? 'hidden lg:block' : 'block'}`}>
                    <div className="p-4 border-b">
                        <h2 className="font-semibold text-gray-700">Your Tickets</h2>
                    </div>
                    <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
                        {tickets.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No tickets found.
                            </div>
                        ) : (
                            tickets.map(ticket => (
                                <div
                                    key={ticket.id}
                                    onClick={() => handleViewTicket(ticket.id)}
                                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${activeTicket?.ticket?.id === ticket.id ? 'bg-[#d4b000] bg-opacity-10 border-l-4 border-l-[#d4b000]' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                                            {ticket.status.toUpperCase()}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(ticket.updated_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">{ticket.subject}</h3>
                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                        <span>{ticket.category}</span>
                                        <span>Ticket No: #{ticket.id}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Date: {new Date(ticket.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Ticket Detail / Chat */}
                <div className={`lg:col-span-2 bg-white rounded-lg shadow-lg flex flex-col h-[calc(100vh-150px)] ${!activeTicket ? 'hidden lg:flex items-center justify-center text-gray-400' : 'block'}`}>
                    {!activeTicket ? (
                        <div className="text-center p-8">
                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p>Select a ticket to view conversation</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setActiveTicket(null)} className="lg:hidden text-gray-500 hover:text-gray-700">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                        </button>
                                        <h2 className="font-bold text-gray-900">{activeTicket.ticket.subject}</h2>
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1 flex gap-4">
                                        <span>ID: #{activeTicket.ticket.id}</span>
                                        <span>Category: {activeTicket.ticket.category}</span>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(activeTicket.ticket.status)}`}>
                                    {activeTicket.ticket.status}
                                </span>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {activeTicket.messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] rounded-lg p-3 shadow-sm ${msg.sender_type === 'user' ? 'bg-[#d4b000] text-gray-900' : 'bg-white text-gray-800'}`}>
                                            <div className="text-xs opacity-75 mb-1 flex justify-between gap-4">
                                                <span className="font-semibold">{msg.sender_type === 'user' ? 'You' : 'Support Team'}</span>
                                                <span>{new Date(msg.created_at).toLocaleString()}</span>
                                            </div>
                                            <p className="whitespace-pre-wrap">{msg.message}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply Input */}
                            <div className="p-4 bg-white border-t">
                                {activeTicket.ticket.status === 'closed' ? (
                                    <div className="text-center text-gray-500 italic py-2">
                                        This ticket is closed. create a new one if needed.
                                    </div>
                                ) : (
                                    <form onSubmit={handleReply} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            placeholder="Type your reply..."
                                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#d4b000] focus:border-transparent"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!replyMessage.trim() || sendingReply}
                                            className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                                        >
                                            {sendingReply ? '...' : 'Send'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Create Ticket Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Create New Ticket</h2>
                        <form onSubmit={handleCreateTicket} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-[#d4b000] focus:border-[#d4b000]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-[#d4b000] focus:border-[#d4b000]"
                                    >
                                        <option>General</option>
                                        <option>Technical Issue</option>
                                        <option>Billing / Deposit</option>
                                        <option>Verification</option>
                                        <option>Trading</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                    <select
                                        value={formData.priority}
                                        onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-[#d4b000] focus:border-[#d4b000]"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea
                                    required
                                    rows="4"
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-[#d4b000] focus:border-[#d4b000]"
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-[#d4b000] text-gray-900 font-medium rounded-lg hover:bg-[#c2a000]"
                                >
                                    {loading ? 'Creating...' : 'Create Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Support
