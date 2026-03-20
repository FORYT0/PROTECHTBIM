import React, { useState, useEffect } from 'react';
import './WikiPage.css';

export interface WikiPageData {
  id: string;
  projectId: string;
  title: string;
  slug: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

interface WikiPageProps {
  projectId: string;
  slug?: string;
  onSave?: (page: WikiPageData) => Promise<void>;
  readOnly?: boolean;
}

export const WikiPage: React.FC<WikiPageProps> = ({
  projectId,
  slug = 'home',
  onSave,
  readOnly = false,
}) => {
  const [page, setPage] = useState<WikiPageData | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load page on mount
    loadPage();
  }, [slug]);

  const loadPage = async () => {
    // This would be replaced with actual API call
    setPage({
      id: '1',
      projectId,
      title: 'Wiki Home',
      slug: 'home',
      content: '# Welcome to Wiki\n\nStart documenting here...',
      author: 'Admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    });
  };

  const handleSave = async () => {
    if (!page) return;
    setSaving(true);
    try {
      const updated: WikiPageData = {
        ...page,
        title,
        content,
        updatedAt: new Date().toISOString(),
        version: page.version + 1,
      };
      await onSave?.(updated);
      setPage(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!page) return <div className="wiki-loading">Loading...</div>;

  if (editing && !readOnly) {
    return (
      <div className="wiki-editor">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="wiki-title-input"
          placeholder="Page title"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="wiki-content-input"
          placeholder="Page content (Markdown supported)"
        />
        <div className="editor-actions">
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={() => setEditing(false)} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wiki-page">
      <div className="wiki-header">
        <h1>{page.title}</h1>
        <div className="wiki-meta">
          <span>By {page.author}</span>
          <span>{new Date(page.updatedAt).toLocaleString()}</span>
          <span>v{page.version}</span>
        </div>
      </div>
      <div className="wiki-content">{page.content}</div>
      {!readOnly && (
        <button onClick={() => {
          setTitle(page.title);
          setContent(page.content);
          setEditing(true);
        }} className="btn btn-primary">
          Edit
        </button>
      )}
    </div>
  );
};
