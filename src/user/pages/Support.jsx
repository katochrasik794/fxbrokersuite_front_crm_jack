import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Plus, Send, X, Search, Filter } from 'lucide-react'
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
                    confirmButtonColor: '#2563eb'
                })
                setShowCreateModal(false)
                setFormData({ subject: '', category: 'General', priority: 'medium', message: '' })
                fetchTickets()
            } else {
                throw new Error(result.error || 'Failed to create ticket')
            }
        } catch (error) {
            console.error('Create ticket error:', error)
            
            let errorMessage = 'Failed to create ticket. Please try again.'
            if (error.response) {
                errorMessage = error.response.data?.error || error.response.data?.message || `Server error: ${error.response.status}`
            } else if (error.request) {
                errorMessage = 'No response from server. Please check your connection.'
            } else {
                errorMessage = error.message || 'Failed to create ticket. Please try again.'
            }
            
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage,
                confirmButtonColor: '#2563eb'
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
            case 'open': return 'bg-green-100 text-green-700 ring-1 ring-green-600/20'
            case 'answered': return 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/20'
            case 'closed': return 'bg-slate-100 text-slate-600 ring-1 ring-slate-600/20'
            default: return 'bg-slate-100 text-slate-600 ring-1 ring-slate-600/20'
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            {loading && !activeTicket && <AuthLoader message="Loading support..." />}

            <PageHeader
                icon={MessageCircle}
                title="Support Center"
                subtitle="Get help from our support team. Create a ticket or view existing tickets."
            >
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 flex items-center gap-2 transform active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    New Ticket
                </button>
            </PageHeader>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-280px)] min-h-[600px]">
                    {/* Ticket List */}
                    <div className={`lg:col-span-4 xl:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col ${activeTicket ? 'hidden lg:flex' : 'flex'}`}>
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 backdrop-blur-sm sticky top-0 z-10">
                            <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                <Filter className="w-4 h-4 text-slate-500" />
                                Your Tickets
                            </h2>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
                            {tickets.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center justify-center h-full text-slate-500">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <MessageCircle className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <p>No tickets found.</p>
                                    <button 
                                        onClick={() => setShowCreateModal(true)}
                                        className="mt-4 text-blue-600 font-medium hover:text-blue-700"
                                    >
                                        Create your first ticket
                                    </button>
                                </div>
                            ) : (
                                tickets.map(ticket => (
                                    <div
                                        key={ticket.id}
                                        onClick={() => handleViewTicket(ticket.id)}
                                        className={`p-4 rounded-xl cursor-pointer transition-all border ${
                                            activeTicket?.ticket?.id === ticket.id 
                                            ? 'bg-blue-50 border-blue-200 shadow-sm' 
                                            : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusColor(ticket.status)}`}>
                                                {ticket.status.toUpperCase()}
                                            </span>
                                            <span className="text-xs text-slate-400 font-medium">
                                                {new Date(ticket.updated_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className={`text-sm font-bold truncate mb-1 ${activeTicket?.ticket?.id === ticket.id ? 'text-blue-900' : 'text-slate-800'}`}>
                                            {ticket.subject}
                                        </h3>
                                        <div className="flex justify-between items-center text-xs text-slate-500">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded-md">{ticket.category}</span>
                                            <span className="font-mono">#{ticket.id}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Ticket Detail / Chat */}
                    <div className={`lg:col-span-8 xl:col-span-9 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col ${!activeTicket ? 'hidden lg:flex' : 'flex'}`}>
                        {!activeTicket ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 bg-slate-50/50">
                                <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
                                    <MessageCircle className="w-12 h-12 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-700 mb-2">Select a ticket</h3>
                                <p className="text-slate-500">Choose a ticket from the list to view the conversation</p>
                            </div>
                        ) : (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 sm:p-6 border-b border-slate-100 bg-white sticky top-0 z-10 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-start gap-3">
                                            <button onClick={() => setActiveTicket(null)} className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                                                <ArrowRight className="w-5 h-5 rotate-180" />
                                            </button>
                                            <div>
                                                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">{activeTicket.ticket.subject}</h2>
                                                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">#{activeTicket.ticket.id}</span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                        {activeTicket.ticket.category}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                        {new Date(activeTicket.ticket.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg text-sm font-bold ${getStatusColor(activeTicket.ticket.status)}`}>
                                            {activeTicket.ticket.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Chat Messages */}
                                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50 custom-scrollbar">
                                    {activeTicket.messages.map((msg) => (
                                        <div key={msg.id} className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm ${
                                                msg.sender_type === 'user' 
                                                ? 'bg-blue-600 text-white rounded-br-none' 
                                                : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                                            }`}>
                                                <div className="text-xs opacity-75 mb-2 flex justify-between gap-8 pb-2 border-b border-white/10">
                                                    <span className="font-bold">{msg.sender_type === 'user' ? 'You' : 'Support Team'}</span>
                                                    <span>{new Date(msg.created_at).toLocaleString()}</span>
                                                </div>
                                                <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{msg.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Reply Input */}
                                <div className="p-4 sm:p-6 bg-white border-t border-slate-100">
                                    {activeTicket.ticket.status === 'closed' ? (
                                        <div className="flex items-center justify-center gap-2 p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 italic">
                                            <X className="w-4 h-4" />
                                            This ticket is closed. Please create a new one if needed.
                                        </div>
                                    ) : (
                                        <form onSubmit={handleReply} className="flex gap-3">
                                            <input
                                                type="text"
                                                value={replyMessage}
                                                onChange={(e) => setReplyMessage(e.target.value)}
                                                placeholder="Type your reply..."
                                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!replyMessage.trim() || sendingReply}
                                                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                                            >
                                                {sendingReply ? (
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4" />
                                                        <span className="hidden sm:inline">Send</span>
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Ticket Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-100 transition-all">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-900">Create New Ticket</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTicket} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Brief description of the issue"
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                    >
                                        <option>General</option>
                                        <option>Technical Issue</option>
                                        <option>Billing / Deposit</option>
                                        <option>Verification</option>
                                        <option>Trading</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Priority</label>
                                    <select
                                        value={formData.priority}
                                        onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                                <textarea
                                    required
                                    rows="5"
                                    placeholder="Describe your issue in detail..."
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Creating...
                                        </>
                                    ) : (
                                        <>Create Ticket</>
                                    )}
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
