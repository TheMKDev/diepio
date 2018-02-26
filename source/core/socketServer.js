const io = require('socket.io');
const socketEventManager = require('./socketEventManager.js');
const log = message => {
    console.log('[SocketServer] '+message)
};

module.exports = class socketServer {
    constructor(config, serv) {
        this.config = config;
        this.server = io();
        this.serv = serv;

        this.lobby = [];
    }

    init() {
        this.server.listen(this.config.port)
        this.listen();
        this.updates = setInterval(() => {
            this.server.emit('get players', this.serv.entityServer.getEntities().get('tank'));
        }, 1000/60)
    }

    listen() {
        this.server.on('connection', socket => {
            socketEventManager.newuser(socket, this.serv, this, this.config);
            socketEventManager.updateNewUser(this.serv, this, this.config);

            /*socket.join('lobby', () => {
                this.lobby.push(socket);
                this.broadcastTo('lobby', 'message', 'hello');
            });*/

            socket.on('disconnect', data => {
                this.lobby.splice(this.lobby.indexOf(socket), 1);
            });

            socket.on('message', data => {
                log(data)
            });

            socket.on('join game', (data, callback) => {
                if(socket.user.playing) return
                var tanks = this.serv.entityServer.getEntities().get('tank');
                tanks[tanks.indexOf(socket.user)].nick = data;
                tanks[tanks.indexOf(socket.user)].x = ~~(Math.random() * (this.config.w - 199) + 100);
                tanks[tanks.indexOf(socket.user)].y = ~~(Math.random() * (this.config.h - 199) + 100);
                tanks[tanks.indexOf(socket.user)].playing = true;
                this.serv.entityServer.getEntities().set('tank', tanks);
                this.server.emit('get players', this.serv.entityServer.getEntities().get('tank'));
            });

            socket.on('user update', (r, km) => {
                if(!socket.user.playing) return
                var tanks = this.serv.entityServer.getEntities().get('tank');
                tanks[tanks.indexOf(socket.user)].r = r;
                tanks[tanks.indexOf(socket.user)].keyMap = km;
                this.serv.entityServer.getEntities().set('tank', tanks);
            });
        })
    }

    broadcastTo(room, event, data) {
        this.server.to(room).emit(event, data);
    }
}
