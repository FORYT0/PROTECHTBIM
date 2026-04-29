import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { WikiPage, wikiService } from '../services/wikiService';
import { WikiTree } from '../components/WikiTree';
import { WikiEditor } from '../components/WikiEditor';
import { InteractiveCard } from '../components/InteractiveCard';
import { Plus, Edit, Trash2, Home, ChevronRight, FileText, BookOpen, Users, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export const WikiPageBoard: React.FC = () => {
    const { projectId, slug } = useParams<{ projectId: string; slug?: string }>();
    const navigate = useNavigate();

    const [tree, setTree] = useState<WikiPage[]>([]);
    const [currentPage, setCurrentPage] = useState<WikiPage | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

      // Wiki metrics
    const mockWikiMetrics = {
      totalPages: 0,
      contributors: 0,
      avgReadTime: 0,
      recentEdits: 0,
      recentUpdates: 5,
    };

    const loadWiki = useCallback(async () => {
        if (!projectId) return;
        try {
            const data = await wikiService.getWikiTree(projectId);
            setTree(data || []);

            // If no slug is specified and there are pages, redirect to the first root page
            if (!slug && data && data.length > 0) {
                navigate(`/projects/${projectId}/wiki/${data[0].slug}`);
            } else if (slug) {
                try {
                    const page = await wikiService.getPageBySlug(projectId, slug);
                    setCurrentPage(page);
                    // Expand parents of the current page
                    if (page.parentId) {
                        setExpandedIds(prev => new Set([...prev, page.parentId!]));
                    }
                } catch (pageError: any) {
                    // Only show error if it's not a 404 (page not found)
                    if (pageError?.response?.status !== 404) {
                        console.error('Failed to load wiki page:', pageError);
                        toast.error('Failed to load wiki page');
                    }
                    setCurrentPage(null);
                }
            } else {
                setCurrentPage(null);
            }
        } catch (error: any) {
            console.error('Failed to load wiki:', error);
            // Only show error toast if it's not a 404 or empty result
            if (error?.response?.status !== 404) {
                toast.error('Failed to load wiki pages');
            }
            setTree([]);
        } finally {
            setIsLoading(false);
        }
    }, [projectId, slug, navigate]);

    useEffect(() => {
        loadWiki();
    }, [loadWiki]);

    const toggleExpanded = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSave = async (title: string, content: string) => {
        if (!projectId) return;
        try {
            if (isEditing && currentPage) {
                const updated = await wikiService.updatePage(currentPage.id, { title, content });
                toast.success('Page updated');
                setIsEditing(false);
                navigate(`/projects/${projectId}/wiki/${updated.slug}`);
            } else if (isCreating) {
                const newPage = await wikiService.createPage(projectId, {
                    title,
                    content,
                    parentId: currentPage?.id || null
                });
                toast.success('Page created');
                setIsCreating(false);
                navigate(`/projects/${projectId}/wiki/${newPage.slug}`);
            }
            loadWiki();
        } catch (error) {
            toast.error('Failed to save page');
        }
    };

    const handleDelete = async () => {
        if (!currentPage || !window.confirm('Are you sure you want to delete this page and all its children?')) return;
        try {
            await wikiService.deletePage(currentPage.id);
            toast.success('Page deleted');
            navigate(`/projects/${projectId}/wiki`);
            loadWiki();
        } catch (error) {
            toast.error('Failed to delete page');
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <div className="relative">
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-800 border-t-blue-500"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                <p className="mt-4 text-gray-400">Loading wiki...</p>
            </div>
        );
    }

    return (
        <div className="min-w-0">
            {/* WIKI HEADER - Only show when not in full editor mode */}
            {!isEditing && !isCreating && (
                <div className="bg-[#0A0A0A] border-b border-gray-800 p-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-start justify-between">
                            {/* LEFT SIDE */}
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-white mb-3 flex items-center gap-3">
                                    <BookOpen className="w-8 h-8 text-blue-400" />
                                    Project Wiki
                                </h1>
                                
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">Total Pages:</span>
                                        <span className="text-white font-semibold">{mockWikiMetrics.totalPages}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">Recent Updates:</span>
                                        <span className="text-blue-400 font-semibold">{mockWikiMetrics.recentUpdates}</span>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT SIDE - METRICS */}
                            <div className="grid grid-cols-2 gap-4">
                                <InteractiveCard
                                    icon={Users}
                                    iconColor="text-cyan-400"
                                    title="Contributors"
                                    value={mockWikiMetrics.contributors}
                                    to="/resources"
                                    className="min-w-[140px]"
                                />

                                <InteractiveCard
                                    icon={Clock}
                                    iconColor="text-purple-400"
                                    title="Avg Read"
                                    value={`${mockWikiMetrics.avgReadTime}m`}
                                    to={`/projects/${projectId}/wiki/analytics`}
                                    className="min-w-[140px]"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex h-[calc(100vh-64px)] overflow-hidden">
                {/* Sidebar */}
                <div className="w-72 flex-none border-r border-gray-800 flex flex-col bg-[#0A0A0A]">
                    <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                        <h2 className="font-semibold text-white flex items-center">
                            <Home className="w-4 h-4 mr-2 text-gray-500" />
                            Pages
                        </h2>
                        <button
                            onClick={() => {
                                setCurrentPage(null);
                                setIsCreating(true);
                            }}
                            className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                            title="New Root Page"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3">
                        {tree.length === 0 ? (
                            <div className="text-center py-8">
                                <FileText className="w-12 h-12 mx-auto text-gray-700 mb-2" />
                                <p className="text-sm text-gray-500">No pages yet</p>
                            </div>
                        ) : (
                            <WikiTree
                                pages={tree}
                                activeSlug={slug}
                                onSelect={(s) => navigate(`/projects/${projectId}/wiki/${s}`)}
                                expandedIds={expandedIds}
                                toggleExpanded={toggleExpanded}
                            />
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#000000]">
                    <div className="flex-1 overflow-y-auto">
                        <div className="max-w-4xl mx-auto px-8 py-10">
                            {isEditing || isCreating ? (
                                <WikiEditor
                                    initialTitle={isEditing ? currentPage?.title : ''}
                                    initialContent={isEditing ? currentPage?.content : ''}
                                    onSave={handleSave}
                                    onCancel={() => {
                                        setIsEditing(false);
                                        setIsCreating(false);
                                    }}
                                />
                            ) : currentPage ? (
                                <article className="prose dark:prose-invert max-w-none">
                                    <header className="mb-8 border-b border-gray-800 pb-6">
                                        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-4 overflow-hidden">
                                            <span className="hover:text-blue-500 cursor-pointer flex-none" onClick={() => navigate(`/projects/${projectId}`)}>Project</span>
                                            <ChevronRight size={12} className="flex-none" />
                                            <span className="flex-none">Wiki</span>
                                            {currentPage.parentId && (
                                                <>
                                                    <ChevronRight size={12} className="flex-none" />
                                                    <span className="truncate">Parent</span>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex items-start justify-between">
                                            <h1 className="text-4xl font-bold text-white mb-0 !mt-0 leading-tight">
                                                {currentPage.title}
                                            </h1>
                                            <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setIsCreating(true)}
                                                    className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"
                                                    title="Add Subpage"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"
                                                    title="Edit Page"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={handleDelete}
                                                    className="p-2 hover:bg-red-900/30 rounded-lg text-gray-400 hover:text-red-400"
                                                    title="Delete Page"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center space-x-4 text-xs text-gray-500">
                                            <div className="flex items-center">
                                                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-2">
                                                    {currentPage.createdById.charAt(0).toUpperCase()}
                                                </div>
                                                Created on {new Date(currentPage.createdAt).toLocaleDateString()}
                                            </div>
                                            {currentPage.updatedAt !== currentPage.createdAt && (
                                                <span>Updated on {new Date(currentPage.updatedAt).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </header>

                                    <div className="markdown-content">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {currentPage.content || '*No content yet. Click edit to add some.*'}
                                        </ReactMarkdown>
                                    </div>
                                </article>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4">
                                        <FileText size={32} className="text-blue-400" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-white mb-2">Welcome to the Project Wiki</h2>
                                    <p className="text-gray-500 max-w-sm mb-6">
                                        Maintain documentation, project standards, and team knowledge bases here.
                                    </p>
                                    <button
                                        onClick={() => setIsCreating(true)}
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all flex items-center"
                                    >
                                        <Plus size={18} className="mr-2" />
                                        Create First Page
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
