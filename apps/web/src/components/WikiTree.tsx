import React from 'react';
import { WikiPage } from '../services/wikiService';
import { ChevronRight, ChevronDown, FileText, Folder } from 'lucide-react';

interface WikiTreeProps {
    pages: WikiPage[];
    activeSlug?: string;
    onSelect: (slug: string) => void;
    expandedIds: Set<string>;
    toggleExpanded: (id: string) => void;
}

const WikiTreeNode: React.FC<{
    page: WikiPage;
    depth: number;
    activeSlug?: string;
    onSelect: (slug: string) => void;
    expandedIds: Set<string>;
    toggleExpanded: (id: string) => void;
}> = ({ page, depth, activeSlug, onSelect, expandedIds, toggleExpanded }) => {
    const hasChildren = page.children && page.children.length > 0;
    const isExpanded = expandedIds.has(page.id);
    const isActive = activeSlug === page.slug;

    return (
        <div className="select-none">
            <div
                className={`flex items-center py-1.5 px-2 rounded-md cursor-pointer transition-colors duration-200 ${isActive
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                onClick={() => onSelect(page.slug)}
            >
                <span
                    className="mr-1 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    onClick={(e) => {
                        if (hasChildren) {
                            e.stopPropagation();
                            toggleExpanded(page.id);
                        }
                    }}
                >
                    {hasChildren ? (
                        isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                    ) : (
                        <div className="w-3.5" />
                    )}
                </span>
                {hasChildren ? (
                    <Folder size={16} className="mr-2 opacity-70" />
                ) : (
                    <FileText size={16} className="mr-2 opacity-70" />
                )}
                <span className="text-sm font-medium truncate">{page.title}</span>
            </div>

            {hasChildren && isExpanded && (
                <div className="mt-0.5">
                    {page.children!.map((child) => (
                        <WikiTreeNode
                            key={child.id}
                            page={child}
                            depth={depth + 1}
                            activeSlug={activeSlug}
                            onSelect={onSelect}
                            expandedIds={expandedIds}
                            toggleExpanded={toggleExpanded}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const WikiTree: React.FC<WikiTreeProps> = ({
    pages,
    activeSlug,
    onSelect,
    expandedIds,
    toggleExpanded
}) => {
    return (
        <div className="space-y-1">
            {pages.map((page) => (
                <WikiTreeNode
                    key={page.id}
                    page={page}
                    depth={0}
                    activeSlug={activeSlug}
                    onSelect={onSelect}
                    expandedIds={expandedIds}
                    toggleExpanded={toggleExpanded}
                />
            ))}
        </div>
    );
};
