
import http from 'http'

export const socketServer = (app) => {
    const server = new http.Server(app);
    const io = require('socket.io')(server, { cors: true })
    ioEvents(io);
    Io = io
    return server;
}

export let Io;
const ioEvents = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected');

        socket.on('joinRoom', ({ userId }) => {
            console.log(userId, "roomId");
            socket.join(userId);
            console.log(`User joined room: ${userId}`);
        });

        socket.on('joinAll', () => {
            socket.join('all');
            console.log('User joined room: all');
        });

        socket.on('disconnect', () => {
            console.log('A user disconnected');
        });
    });
}

export const send_real_time_update = async (roomIds, payload) => {
    let { eventType, data } = payload
    try {
        for (let roomId of roomIds) {
            await Io.to(roomId).emit(eventType, { data: data });
            console.log(`${eventType} - fired to id ${roomId}`);
        }
    } catch (error) {
        console.log(error);
    }
}