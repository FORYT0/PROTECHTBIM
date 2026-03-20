import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import notificationService from '../services/NotificationService';
import { useAuth } from '../contexts/AuthContext';

export const GlobalWebSocketListener: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) return;

        const handleMention = (payload: any) => {
            toast.custom(
                (t) => (
                    <div
                        className={`${t.visible ? 'animate-enter' : 'animate-leave'
                            } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 cursor-pointer`}
                        onClick={() => {
                            toast.dismiss(t.id);
                            if (payload.projectId) {
                                navigate(`/projects/${payload.projectId}`);
                            }
                        }}
                    >
                        <div className="flex-1 w-0 p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 pt-0.5">
                                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
                                        @
                                    </div>
                                </div>
                                <div className="ml-3 flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        You were mentioned
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        {payload.message || 'Someone mentioned you in a comment.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex border-l border-gray-200 dark:border-gray-700">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toast.dismiss(t.id);
                                }}
                                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                ),
                { duration: 5000 }
            );
        };

        // Listen for direct mentions across the app
        notificationService.on('comment:mentioned', handleMention);

        return () => {
            notificationService.off('comment:mentioned', handleMention);
        };
    }, [isAuthenticated, navigate]);

    return null; // This is a logic-only component
};
