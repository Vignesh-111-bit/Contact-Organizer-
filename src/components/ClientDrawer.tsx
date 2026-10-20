import React, { useState } from 'react';
import { X, Star, Mail, Phone, Building2, MapPin, Edit2, Trash2, Send, Copy } from 'lucide-react';
import { ClientContact } from '../types/contact.js';
import { getInitials, formatDate, formatDateTime } from '../utils/formatters.js';

interface ClientDrawerProps {
  client: ClientContact | null;
  onClose: () => void;
  onEdit: (client: ClientContact) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onAddNote: (id: string, text: string) => Promise<void>;
  onDeleteNote: (id: string, noteId: string) => Promise<void>;
  onCopy: (text: string, label: string) => void;
}

export const ClientDrawer: React.FC<ClientDrawerProps> = ({
  client,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
  onAddNote,
  onDeleteNote,
  onCopy,
}) => {
  const [noteText, setNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!client) return null;

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || isAddingNote) return;

    try {
      setIsAddingNote(true);
      await onAddNote(client.id, noteText.trim());
      setNoteText('');
    } finally {
      setIsAddingNote(false);
    }
  };

  const statusLabel = {
    active: 'Active Client',
    prospect: 'Lead / Prospect',
    onboarding: 'Onboarding',
    inactive: 'Inactive',
  }[client.status] || 'Active';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top action bar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(client.id)}
              className={`p-1.5 rounded-lg border transition-colors ${
                client.isFavorite
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/60 text-amber-500'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title={client.isFavorite ? 'Priority Client' : 'Mark as Priority'}
            >
              <Star className={`w-4 h-4 ${client.isFavorite ? 'fill-amber-500' : ''}`} />
            </button>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {client.department}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {confirmDelete ? (
              <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-lg border border-rose-200 dark:border-rose-800">
                <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300 px-1">Delete?</span>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(client.id);
                    setConfirmDelete(false);
                  }}
                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded text-[11px] font-medium transition-colors cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => onEdit(client)}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors text-xs flex items-center gap-1 font-medium px-2.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors text-xs flex items-center gap-1 font-medium px-2.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Client Header Info */}
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-xl shrink-0 shadow-xs ring-1 ring-black/5 dark:ring-white/10"
              style={{ backgroundColor: client.avatarColor || '#4f46e5' }}
            >
              {getInitials(client.name)}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{client.name}</h2>
              {client.company && (
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span>{client.company}</span>
                </p>
              )}
              {client.role && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{client.role}</p>}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  Status: {statusLabel}
                </span>
                {client.location && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{client.location}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Call & Email actions */}
          <div className="grid grid-cols-2 gap-3">
            {client.email ? (
              <a
                href={`mailto:${client.email}`}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
              >
                <Mail className="w-4 h-4" />
                <span>Email Client</span>
              </a>
            ) : (
              <div className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg text-xs font-medium text-center">
                No email
              </div>
            )}

            {client.phone ? (
              <a
                href={`tel:${client.phone.replace(/[^\d+]/g, '')}`}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>Call Client</span>
              </a>
            ) : (
              <div className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg text-xs font-medium text-center">
                No phone
              </div>
            )}
          </div>

          {/* Contact Details summary */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <h4 className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Contact Details
            </h4>

            {client.email && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-slate-900 dark:text-white">{client.email}</span>
                  <button
                    type="button"
                    onClick={() => onCopy(client.email, 'Email')}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title="Copy"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {client.phone && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Phone
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-slate-900 dark:text-white">{client.phone}</span>
                  <button
                    type="button"
                    onClick={() => onCopy(client.phone, 'Phone')}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title="Copy"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {client.company && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Company</span>
                <span className="font-medium text-slate-900 dark:text-white">{client.company}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Category / Department</span>
              <span className="font-medium text-slate-900 dark:text-white">{client.department}</span>
            </div>
          </div>

          {/* Client Notes & Interactions */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Client Interaction Log & Notes ({client.notes?.length || 0})
            </h4>

            <form onSubmit={handleNoteSubmit} className="space-y-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Log a client interaction, meeting takeaway, or contract note..."
                className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 outline-hidden resize-none h-20"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!noteText.trim() || isAddingNote}
                  className="px-3 py-1.5 bg-indigo-600 disabled:opacity-50 text-white rounded-md text-xs font-semibold flex items-center gap-1 hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  <Send className="w-3 h-3" />
                  <span>{isAddingNote ? 'Saving...' : 'Add Note'}</span>
                </button>
              </div>
            </form>

            <div className="space-y-2 mt-3">
              {client.notes && client.notes.length > 0 ? (
                client.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs space-y-1 group"
                  >
                    <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 text-[11px]">
                      <span>{formatDateTime(note.createdAt)}</span>
                      <button
                        type="button"
                        onClick={() => onDeleteNote(client.id, note.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity"
                        title="Delete note"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{note.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic py-2">
                  No notes logged yet. Log the first client conversation above.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
