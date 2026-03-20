import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';

interface DecodedToken {
    userId: string;
    email: string;
    role: string;
}

class SocketManager {
    private io: Server | null = null;
    private userSockets: Map<string, string[]> = new Map();

    public initialize(server: HttpServer): void {
        const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || ['http://localhost:3001', 'http://localhost:8081'];
        
        this.io = new Server(server, {
            cors: {
                origin: allowedOrigins,
                methods: ['GET', 'POST'],
                credentials: true,
            },
            transports: ['websocket', 'polling'],
        });

        // Authentication middleware
        this.io.use((socket: Socket, next) => {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                return next(new Error('Authentication error: Token missing'));
            }

            try {
                const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
                // Attach user info to socket
                (socket as any).user = decoded;
                next();
            } catch (err) {
                return next(new Error('Authentication error: Invalid or expired token'));
            }
        });

        this.io.on('connection', (socket: Socket) => {
            const user = (socket as any).user as DecodedToken;
            console.log(`Socket connected: User ${user.userId} (${socket.id})`);

            // Track the user's connected sockets (they might have multiple tabs open)
            const sockets = this.userSockets.get(user.userId) || [];
            sockets.push(socket.id);
            this.userSockets.set(user.userId, sockets);

            // Join the user's personal room for direct notifications
            socket.join(`user:${user.userId}`);

            socket.on('join_project', (projectId: string) => {
                socket.join(`project:${projectId}`);
                console.log(`User ${user.userId} joined project room: ${projectId}`);
            });

            socket.on('leave_project', (projectId: string) => {
                socket.leave(`project:${projectId}`);
                console.log(`User ${user.userId} left project room: ${projectId}`);
            });

            socket.on('disconnect', () => {
                console.log(`Socket disconnected: User ${user.userId} (${socket.id})`);
                const userSocks = this.userSockets.get(user.userId) || [];
                this.userSockets.set(user.userId, userSocks.filter(id => id !== socket.id));
                if (this.userSockets.get(user.userId)?.length === 0) {
                    this.userSockets.delete(user.userId);
                }
            });
        });
    }

    public getIO(): Server {
        if (!this.io) {
            throw new Error('Socket.io has not been initialized. Call initialize(server) first.');
        }
        return this.io;
    }

    public notifyProject(projectId: string, event: string, payload: any): void {
        if (this.io) {
            this.io.to(`project:${projectId}`).emit(event, payload);
        }
    }

    public notifyUser(userId: string, event: string, payload: any): void {
        if (this.io) {
            this.io.to(`user:${userId}`).emit(event, payload);
        }
    }
}

// Export as a singleton
export const socketManager = new SocketManager();
