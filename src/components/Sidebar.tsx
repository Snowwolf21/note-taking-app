'use client';

import React from 'react';
import {
  FileText,
  Archive,
  Tag as TagIcon,
  Settings,
  Plus,
  User,
  LogOut,
  PenTool,
  Key,
  FolderOpen,
} from 'lucide-react';

interface SidebarProps {
  activeView: 'all' | 'archived';
  onSelectView: (view: 'all' | 'archived') => void;
  tags: string[];
  activeTag: string | null;
  onSelectTag: (tag: string | null) => void;
  onNewNote: () => void;
  onOpenSettings: () => void;
  user: any;
  onOpenAuth: (view?: 'login' | 'register' | 'changePassword') => void;
  onLogout: () => void;
  noteCounts: { all: number; archived: number; tagsMap: Record<string, number> };
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeView,
  onSelectView,
  tags,
  activeTag,
  onSelectTag,
  onNewNote,
  onOpenSettings,
  user,
  onOpenAuth,
  onLogout,
  noteCounts,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-40 w-64 bg-(--bg-surface) border-r border-(--border-color) flex flex-col justify-between p-4 transition-transform duration-200 ease-in-out shrink-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Main Navigation Sidebar"
      >
        <div className="space-y-6 overflow-y-auto">
          {/* Logo Brand Header */}
          <div className="flex items-center justify-between px-2 pt-2">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-(--primary) text-(--primary-contrast) rounded-xl shadow-md">
                <PenTool className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-(--text-main)">
                  Inkwell
                </h1>
                <p className="text-[10px] text-(--text-muted) font-medium">Smart Notes Workspace</p>
              </div>
            </div>
          </div>

          {/* New Note CTA */}
          <button
            onClick={() => {
              onNewNote();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-(--primary) text-(--primary-contrast) font-bold text-sm rounded-xl hover:opacity-90 transition-all duration-150 shadow-md focus-ring"
            aria-label="Create New Note (Keyboard shortcut Command N)"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Note</span>
          </button>

          {/* Primary View Filters */}
          <nav className="space-y-1" aria-label="Main Views">
            <button
              onClick={() => {
                onSelectView('all');
                onSelectTag(null);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors focus-ring ${
                activeView === 'all' && activeTag === null
                  ? 'bg-(--primary)/15 text-(--primary) border border-(--primary)/30'
                  : 'text-(--text-muted) hover:text-(--text-main) hover:bg-(--bg-surface-hover)'
              }`}
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-4 h-4" />
                <span>All Notes</span>
              </div>
              <span className="px-2 py-0.5 text-xs rounded-full bg-(--bg-card) border border-(--border-color)">
                {noteCounts.all}
              </span>
            </button>

            <button
              onClick={() => {
                onSelectView('archived');
                onSelectTag(null);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors focus-ring ${
                activeView === 'archived' && activeTag === null
                  ? 'bg-(--primary)/15 text-(--primary) border border-(--primary)/30'
                  : 'text-(--text-muted) hover:text-(--text-main) hover:bg-(--bg-surface-hover)'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Archive className="w-4 h-4" />
                <span>Archived Notes</span>
              </div>
              <span className="px-2 py-0.5 text-xs rounded-full bg-(--bg-card) border border-(--border-color)">
                {noteCounts.archived}
              </span>
            </button>
          </nav>
              
          {/* Tags Navigation */}
          <div className="space-y-2 pt-2 border-t border-(--border-color)">
            <div className="px-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-(--text-muted)">
              <span className="flex items-center space-x-1.5">
                <TagIcon className="w-3.5 h-3.5 text-(--primary)" />
                <span>Tags</span>
              </span>
              <span>{tags.length}</span>
            </div>

            {tags.length === 0 ? (
              <p className="px-3 text-xs text-(--text-muted) italic">No tags added yet.</p>
            ) : (
              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                {tags.map((tag) => {
                  const isSelected = activeTag === tag;
                  const count = noteCounts.tagsMap[tag] || 0;
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        onSelectTag(tag);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors focus-ring ${
                        isSelected
                          ? 'bg-(--primary)/20 text-(--primary) font-bold'
                          : 'text-(--text-muted) hover:text-(--text-main) hover:bg-(--bg-surface-hover)'
                      }`}
                    >
                      <span className="truncate">#{tag}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-(--bg-card) border border-(--border-color)">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Settings & Account */}
        <div className="pt-4 border-t border-(--border-color) space-y-2">
          {/* Appearance Settings CTA */}
          <button
            onClick={() => {
              onOpenSettings();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-(--text-muted) hover:text-(--text-main) hover:bg-(--bg-surface-hover) transition-colors focus-ring"
          >
            <div className="flex items-center space-x-3">
              <Settings className="w-4 h-4 text-(--primary)" />
              <span>Settings & Themes</span>
            </div>
          </button>

          {/* User Auth Section */}
          <div className="p-3 bg-(--bg-card) border border-(--border-color) rounded-xl space-y-2">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-(--primary)/20 text-(--primary) rounded-full">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-(--text-main) truncate">
                      {user.name || 'Signed In User'}
                    </p>
                    <p className="text-[11px] text-(--text-muted) truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 pt-1 border-t border-(--border-color)">
                  <button
                    onClick={() => onOpenAuth('changePassword')}
                    className="flex-1 px-2 py-1 text-[11px] font-semibold text-(--text-muted) hover:text-(--text-main) hover:bg-(--bg-surface-hover) rounded border border-(--border-color) flex items-center justify-center space-x-1 focus-ring"
                  >
                    <Key className="w-3 h-3" />
                    <span>Password</span>
                  </button>
                  <button
                    onClick={onLogout}
                    className="px-2 py-1 text-[11px] font-semibold text-red-400 hover:bg-red-500/10 rounded border border-red-500/30 flex items-center space-x-1 focus-ring"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="text-xs text-(--text-muted)">Cloud sync disabled (Guest mode)</p>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="w-full py-1.5 px-3 bg-(--bg-surface-hover) hover:bg-(--primary) hover:text-(--primary-contrast) font-semibold text-xs rounded-lg transition-colors focus-ring border border-(--border-color) flex items-center justify-center space-x-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In / Create Account</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
