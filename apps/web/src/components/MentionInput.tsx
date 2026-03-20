import React, { useState, useEffect, useRef } from 'react';
import { commentService } from '../services/CommentService';

interface MentionInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export const MentionInput: React.FC<MentionInputProps> = ({ value, onChange, placeholder, className }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [query, setQuery] = useState('');
    const [cursorPos, setCursorPos] = useState(0);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (query.length >= 2) {
            const fetchUsers = async () => {
                try {
                    const users = await commentService.searchUsers(query);
                    setSuggestions(users);
                    setShowSuggestions(users.length > 0);
                } catch (error) {
                    console.error('Mention error:', error);
                }
            };
            fetchUsers();
        } else {
            setShowSuggestions(false);
        }
    }, [query]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newVal = e.target.value;
        const pos = e.target.selectionStart;
        setCursorPos(pos);
        onChange(newVal);

        // Detect @ trigger
        const textBeforeCursor = newVal.substring(0, pos);
        const lastAtIdx = textBeforeCursor.lastIndexOf('@');

        if (lastAtIdx !== -1 && (lastAtIdx === 0 || textBeforeCursor[lastAtIdx - 1] === ' ')) {
            const currentQuery = textBeforeCursor.substring(lastAtIdx + 1);
            if (!currentQuery.includes(' ')) {
                setQuery(currentQuery);
                return;
            }
        }
        setShowSuggestions(false);
    };

    const handleSelect = (user: any) => {
        const textBeforeAt = value.substring(0, cursorPos).lastIndexOf('@');
        const beforeAt = value.substring(0, textBeforeAt);
        const afterCursor = value.substring(cursorPos);

        // We use @[uuid] format for the backend, but maybe we show @Name in UI?
        // For now, let's insert the mention as @[uuid] directly or a placeholder
        const mention = `@[${user.id}] `;
        onChange(beforeAt + mention + afterCursor);
        setShowSuggestions(false);
        setSelectedIndex(0);

        // Focus back to textarea
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newPos = beforeAt.length + mention.length;
                textareaRef.current.setSelectionRange(newPos, newPos);
            }
        }, 10);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showSuggestions) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % suggestions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleSelect(suggestions[selectedIndex]);
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
            }
        }
    };

    return (
        <div className="relative w-full">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={className}
            />

            {showSuggestions && (
                <div className="absolute z-50 bottom-full left-0 w-64 bg-surface-elevated border border-surface-light rounded-lg shadow-xl mb-1 overflow-hidden">
                    <div className="py-1">
                        {suggestions.map((user, idx) => (
                            <div
                                key={user.id}
                                onClick={() => handleSelect(user)}
                                className={`flex items-center space-x-3 px-3 py-2 cursor-pointer transition-colors ${idx === selectedIndex ? 'bg-primary-500/20 text-white' : 'text-secondary hover:bg-surface-light'
                                    }`}
                            >
                                <div className="h-6 w-6 rounded-full bg-primary-500 flex items-center justify-center text-[10px] font-bold">
                                    {user.name.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium">{user.name}</span>
                                    <span className="text-[10px] text-hint">{user.email}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
