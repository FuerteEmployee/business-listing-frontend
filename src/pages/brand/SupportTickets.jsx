import { useState, useEffect } from 'react';
import { 
    Plus, Search, Filter, MessageSquare, Clock, CheckCircle2, 
    AlertCircle, ChevronRight, Loader2, Send, Paperclip, X
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function SupportTickets() {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRaisingTicket, setIsRaisingTicket] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [messages, setMessages] = useState([]);

    // Form State
    const [newTicket, setNewTicket] = useState({
        subject: '',
        category: 'other',
        description: ''
    });

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/tickets/my-tickets`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setTickets(data);
        } catch (err) {
            console.error('Error fetching tickets:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTicketDetails = async (ticketId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSelectedTicket(data.ticket);
            setMessages(data.messages);
        } catch (err) {
            console.error('Error fetching ticket details:', err);
        }
    };

    const handleRaiseTicket = async (e) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/tickets`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(newTicket)
            });
            if (res.ok) {
                setIsRaisingTicket(false);
                setNewTicket({ subject: '', category: 'other', description: '' });
                fetchTickets();
            }
        } catch (err) {
            console.error('Error raising ticket:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyMessage.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/tickets/${selectedTicket._id}/reply`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ message: replyMessage })
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, data]);
                setReplyMessage('');
            }
        } catch (err) {
            console.error('Error replying to ticket:', err);
        }
    };

    if (isLoading && tickets.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                        Support <span className="text-indigo-600">Tickets</span>
                    </h1>
                    <p className="text-slate-500 text-sm italic">Need help? We're here for you 24/7.</p>
                </div>
                <button 
                    onClick={() => setIsRaisingTicket(true)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    New Ticket
                </button>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden">
                {/* Tickets List */}
                <div className="lg:col-span-1 bg-white border border-slate-100 shadow-xl shadow-slate-200/50 rounded-3xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search tickets..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {tickets.map((ticket) => (
                            <button 
                                key={ticket._id}
                                onClick={() => fetchTicketDetails(ticket._id)}
                                className={`w-full p-4 rounded-2xl border transition-all text-left group ${
                                    selectedTicket?._id === ticket._id 
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                                    : 'bg-white border-slate-100 hover:border-indigo-200 shadow-sm'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                        selectedTicket?._id === ticket._id ? 'bg-white/10' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {ticket.ticketId}
                                    </span>
                                    <span className={`text-[9px] font-black uppercase tracking-tighter ${
                                        ticket.status === 'open' ? 'text-indigo-500' : 'text-emerald-500'
                                    }`}>
                                        {ticket.status}
                                    </span>
                                </div>
                                <h3 className={`text-sm font-bold truncate mb-1 ${
                                    selectedTicket?._id === ticket._id ? 'text-white' : 'text-slate-900'
                                }`}>
                                    {ticket.subject}
                                </h3>
                                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold">
                                    <div className="flex items-center gap-1 uppercase tracking-tighter">
                                        <Clock className="w-3 h-3" />
                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1 uppercase tracking-tighter">
                                        <MessageSquare className="w-3 h-3" />
                                        {ticket.category.replace('_', ' ')}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Ticket Conversation */}
                <div className="lg:col-span-2 bg-white border border-slate-100 shadow-xl shadow-slate-200/50 rounded-3xl flex flex-col overflow-hidden min-h-[500px]">
                    {selectedTicket ? (
                        <>
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                                        <MessageSquare className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-900 leading-tight">{selectedTicket.subject}</h2>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedTicket.ticketId}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                            <span className="text-xs font-black text-indigo-600 uppercase italic">{selectedTicket.category.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[radial-gradient(#f1f5f9_1px,transparent_1px)] [background-size:20px_20px]">
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.senderId?.role === 'Super Admin' ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                                            msg.senderId?.role === 'Super Admin'
                                            ? 'bg-white border border-slate-100 rounded-tl-none'
                                            : 'bg-indigo-600 text-white rounded-tr-none'
                                        }`}>
                                            <div className={`text-[10px] font-black uppercase tracking-widest mb-1 opacity-70 ${
                                                msg.senderId?.role === 'Super Admin' ? 'text-indigo-600' : 'text-white'
                                            }`}>
                                                {msg.senderId?.role === 'Super Admin' ? 'Customer Support' : 'You'}
                                            </div>
                                            <p className="text-sm font-medium leading-relaxed">{msg.message}</p>
                                            <div className="text-[9px] mt-2 font-bold opacity-50 uppercase text-right">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleReply} className="p-4 bg-white border-t border-slate-100">
                                <div className="relative group">
                                    <textarea 
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        placeholder="Type your message here..."
                                        className="w-full p-4 pr-16 bg-slate-50 border-none rounded-2xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-100 resize-none min-h-[60px]"
                                    ></textarea>
                                    <button 
                                        type="submit"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                                        disabled={!replyMessage.trim()}
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <MessageSquare className="w-10 h-10 opacity-20" />
                            </div>
                            <h3 className="text-xl font-black uppercase text-slate-300">Select a ticket</h3>
                            <p className="max-w-xs mx-auto text-sm mt-2">Choose a ticket from the left to view the conversation history.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Raise Ticket Modal */}
            {isRaisingTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsRaisingTicket(false)}></div>
                    <div className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-black text-slate-900 uppercase">Raise <span className="text-indigo-600">New Ticket</span></h2>
                            <button onClick={() => setIsRaisingTicket(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={handleRaiseTicket} className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                                <select 
                                    className="w-full mt-1.5 p-3.5 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100"
                                    value={newTicket.category}
                                    onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                                >
                                    <option value="listing_issue">Business Listing Issue</option>
                                    <option value="payment">Billing & Payments</option>
                                    <option value="account">Account Access</option>
                                    <option value="review">Review Disputes</option>
                                    <option value="other">Other Inquiry</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                                <input 
                                    type="text"
                                    required
                                    className="w-full mt-1.5 p-3.5 bg-slate-50 border-none rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-100"
                                    placeholder="Brief summary of the issue"
                                    value={newTicket.subject}
                                    onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                                <textarea 
                                    required
                                    rows="4"
                                    className="w-full mt-1.5 p-3.5 bg-slate-50 border-none rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-100 resize-none"
                                    placeholder="Please provide as much detail as possible..."
                                    value={newTicket.description}
                                    onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                                ></textarea>
                            </div>
                            <button 
                                type="submit"
                                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm uppercase hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-100"
                            >
                                Submit Ticket
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
