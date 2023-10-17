import express, { Application } from 'express';
import cors from 'cors';
import { Socket, Server } from 'socket.io';

//* Custom classes
import IController from '@/utils/interfaces/controller.interface';
import ISocketInterface from '@/utils/interfaces/socket.interface';

class App {
    public express: Application;
    public port: number;

    constructor(controllers: IController[], port: number) {
        this.express = express();
        this.port = port;
        this.initiateMiddleware();
        this.initializeControllers(controllers);
    }

    public initiateMiddleware(): void {
        this.express.use(cors());
        this.express.use(express.urlencoded({ extended: false }));
        this.express.use(express.json());
    }

    public initializeControllers(controllers: IController[]): void {
        controllers.forEach((controller: IController) => {
            this.express.use('/api', controller.router);
        });
    }

    public listen(): void {
        const server = this.express.listen(this.port, () => {
            console.log(`The server is listening on port: ${this.port}`);
        });

        //* socket io setup
        const io: Server = new Server(server, {
            cors: {
                origin: '*',
            },
        });

        //* creating a map to store the room creator.
        const roomCreator = new Map<string, string>();

        io.on('connection', (socket: ISocketInterface) => {
            console.log(`Socket connection on: ${socket.id}`);

            //* event for creating a new room
            socket.on('createRoom', (data) => {
                const roomId = Math.random().toString(36).substring(2, 7);
                socket.join(roomId);

                const totalRoomUsers = io.sockets.adapter.rooms.get(roomId);

                socket.emit('roomCreated', {
                    roomId,
                    position: data.position,
                    totalConnectedUsers: Array.from(totalRoomUsers || []),
                });
                roomCreator.set(roomId, socket.id);
                socket.roomId = roomId;
            });

            //* Joining a Room
            socket.on('joinRoom', (data: { roomId: string }) => {
                const roomExists = io.sockets.adapter.rooms.has(data.roomId);
                if (roomExists) {
                    socket.join(data.roomId);
                    socket.roomId = data.roomId;

                    //* Notify room creator of a new user
                    const room_creator_socket_id = roomCreator.get(data.roomId);
                    if (room_creator_socket_id) {
                        const room_creator_object = io.sockets.sockets.get(
                            room_creator_socket_id,
                        );
                        if (room_creator_object) {
                            const totalRoomUsers = io.sockets.adapter.rooms.get(
                                data.roomId,
                            );
                            socket.emit('userJoinedRoom', {
                                user_id: socket.id,
                                total_connected_users: Array.from(
                                    totalRoomUsers || [],
                                ),
                            });
                        }
                    }
                    //* Message to the person who joined the room
                    io.to(`${socket.id}`).emit('roomJoined', {
                        status: 'OK',
                    });
                } else {
                    io.to(`${socket.id}`).emit('roomJoined', {
                        status: 'ERROR',
                    });
                }
            });

            //* Updating the user location
            socket.on('updateLocation', (data) => {
                io.emit('updateLocationObject', data);
            });

            //* disconnect socket
            socket.on('disconnect', () => {
                console.log(`User disconnected: ${socket.id}`);

                const roomId = socket.roomId;
                if (roomId) {
                    //* if the user who has disconnected is the creator of the room, destroy the room
                    if (roomCreator.get(roomId) === socket.id) {
                        const room_users = io.sockets.adapter.rooms.get(roomId);
                        if (room_users) {
                            for (const socket_id of room_users) {
                                io.to(`${socket_id}`).emit('roomDestroyed', {
                                    status: 'OK',
                                });
                            }
                        }
                        io.sockets.adapter.rooms.delete(roomId);
                        roomCreator.delete(roomId);
                    } else {
                        socket.leave(roomId);
                        const creatorSocketId = roomCreator.get(roomId);
                        if (creatorSocketId) {
                            const creator_socket_object =
                                io.sockets.sockets.get(creatorSocketId);
                            if (creator_socket_object) {
                                creator_socket_object.emit('userLeftRoom', {
                                    user_id: socket.id,
                                    total_connected_users: Array.from(
                                        io.sockets.adapter.rooms.get(roomId) ||
                                            [],
                                    ),
                                });
                            }
                        }
                    }
                }
            });
        });
    }
}

export default App;
