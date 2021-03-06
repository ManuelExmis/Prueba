//  OpenShift sample Node application
var express = require('express');
var app = express();
var morgan = require('morgan');
var server = require('http').Server(app);
var io = require('socket.io')(server);

Object.assign = require('object-assign');

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'));
app.use(express.static('public'));

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8888,
    ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

app.get('/', function(req, res) {
    // try to initialize the db on every request if it's not already
    // initialized.
    res.render('index.html');
});

// error handling
app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something bad happened!');
});

server.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

var usuarios_conectados = [];

io.on('connection', function(socket) {
    socket.on('disconnect', function() {
        console.log('Se desconectó un usuario.\n');
    });

    socket.on('mensaje', function(datos) {
        socket.to(datos.nombre_sala).emit('mensaje', datos);
    });

    //Verificar si existe la sala indicada por el usuario
    socket.on('crear_unir_sala', function(datos) {
        var usuarios_en_la_sala = io.sockets.adapter.rooms[datos.nombre_sala];
        var numero_usuarios = usuarios_en_la_sala ? Object.keys(usuarios_en_la_sala.sockets).length : 0;

        if (numero_usuarios == 0) {
            socket.join(datos.nombre_sala); //Crear la sala
            socket.emit('sala_creada'); //Avisar al usuario que ha creado la sala
            usuarios_conectados.push(datos.nombre_sala);
            usuarios_conectados[datos.nombre_sala] = [datos.nombre_usuario];
        } else if (numero_usuarios < 4) {
            if (!usuarios_conectados[datos.nombre_sala].includes(datos.nombre_usuario)) {
                socket.join(datos.nombre_sala);
                io.sockets.in(datos.nombre_sala).emit('usuario_agregado', usuarios_conectados[datos.nombre_sala]);
                socket.emit('agregado_a_sala');
                usuarios_conectados[datos.nombre_sala].push(datos.nombre_usuario);
                
            } else {
                socket.emit('usuario_existe');
            }
        } else {
            socket.emit('sala_llena');
        }
    });

    socket.on('candidato', function(datos) {
        console.log('Reenviando candidato');
        socket.to(datos.nombre_sala).emit('candidato', datos);
    });

    socket.on('descripcion', function(datos) {
        console.log('Reenviando descripcion');
        socket.to(datos.nombre_sala).emit('descripcion', datos);
    });
});

module.exports = app;