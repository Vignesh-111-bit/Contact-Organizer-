import React from 'react';
import { Star, Mail, Phone, Building2, MapPin, ChevronRight, Copy } from 'lucide-react';
import { ClientContact } from '../types/contact.js';
import { getInitials } from '../utils/formatters.js';

interface ClientCardProps {
  client: ClientContact;
  onSelect: (client: ClientContact) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onCopy: (text: string, label: string, e: React.MouseEvent) => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onSelect,
  onToggleFavorite,
  onCopy,
}) => {
  const statusConfig = {
    active: {
      label: 'Active Client',
      badge: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/40 border border-emerald-200/50',
    },
    prospect: {
      label: 'Lead / Prospect',
      badge: 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-800/40 border border-indigo-200/50',
    },
    onboarding: {
      label: 'Onboarding',
      badge: 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/40 border border-amber-200/50',
    },
    inactive: {
      label: 'Inactive',
      badge: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 border border-slate-200/50',
    },
  }[client.status] || {
    label: 'Active',
    badge: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400',
  };

  return (
    <div
      onClick={() => onSelect(client)}
      className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-5 shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Header: Avatar, Name, Company, and Star */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-xs ring-1 ring-black/5 dark:ring-white/10"
              style={{ backgroundColor: client.avatarColor || '#4f46e5' }}
            >
              {getInitials(client.name)}
            </div>

            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {client.name}
              </h3>
              {client.company ? (
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span>{client.company}</span>
                  {client.role && <span className="text-slate-400 dark:text-slate-500">· {client.role}</span>}
                </p>
              ) : client.role ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{client.role}</p>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => onToggleFavorite(client.id, e)}
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${
              client.isFavorite
                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/60'
                : 'text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title={client.isFavorite ? 'Priority Client' : 'Mark as Priority'}
          >
            <Star className={`w-4 h-4 ${client.isFavorite ? 'fill-amber-500' : ''}`} />
          </button>
        </div>

        {/* Clean metadata: category & status */}
        <div className="flex items-center gap-2 text-xs mb-3 flex-wrap">
          <span className="font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
            {client.department}
          </span>
          <span className={`px-2.5 py-0.5 rounded-md font-medium text-[11px] ${statusConfig.badge}`}>
            {statusConfig.label}
          </span>
          {client.location && (
            <span className="text-slate-400 dark:text-slate-500 text-xs flex items-center gap-1 ml-auto truncate">
              <MapPin className="w-3 h-3 inline" />
              {client.location}
            </span>
          )}
        </div>

        {/* Direct contact channels */}
        <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          {client.email && (
            <div className="flex items-center justify-between group/row text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">
              <a
                href={`mailto:${client.email}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 truncate hover:underline"
              >
                <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="truncate">{client.email}</span>
              </a>
              <button
                type="button"
                onClick={(e) => onCopy(client.email, 'Email', e)}
                className="opacity-0 group-hover/row:opacity-100 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                title="Copy email"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          )}

          {client.phone && (
            <div className="flex items-center justify-between group/row text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">
              <a
                href={`tel:${client.phone.replace(/[^\d+]/g, '')}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 truncate font-mono tabular-nums hover:underline"
              >
                <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                <span>{client.phone}</span>
              </a>
              <button
                type="button"
                onClick={(e) => onCopy(client.phone, 'Phone', e)}
                className="opacity-0 group-hover/row:opacity-100 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                title="Copy phone"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          {client.notes?.length ? `${client.notes.length} notes logged` : 'No notes'}
        </span>
        <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
          View Details <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
