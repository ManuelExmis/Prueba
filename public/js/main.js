'use strict';

(function() {
    //Variables globales
    var glob_nombre_sala = '';
    var glob_nombre_usuario = '';
    var pcConfig = {
        'iceServers': [{
            'urls': 'stun:stun.l.google.com:19302'
        }],
        mandatory: {
            OfferToReceiveAudio: true
        }
    };
    var sdpConstraints = {
        //offerToReceiveAudio: true,
        offerToReceiveVideo: true
    };
    var local_stream, iniciador = false,n_usuarios=1;
    var PC=new Array();
    //Iniciar los sockets
    var socket = io();

    //Poner el foco al nombre de la sala
    $('#txt-nombre-sala').focus();

    //Click en botón conectar
    $('#btn-conectar').click(function() {
        //Ocultar los mensajes de error
        $('#msj-error-conectar').addClass('hide');
        //Obtener nombre de sala y de usuario
        glob_nombre_sala = $('#txt-nombre-sala').val();
        glob_nombre_usuario = $('#txt-nombre-usuario').val();
        //Si el nombre de sala es vacío, mostrar error
        if (glob_nombre_sala == '') {
            $('#msj-error-conectar').html('Debe escribir el nombre de la sala...').removeClass('hide');
            return;
        }
        //Si el nombre de usuario es vacío, mostrar error
        if (glob_nombre_usuario == '') {
            $('#msj-error-conectar').html('Debe escribir el nombre de usuario...').removeClass('hide');
            return;
        }
        //Establecer nombre de sala y usuario en la barra superior
        $('#li-nombre-sala').html(glob_nombre_sala);
        $('#li-nombre-usuario').html(glob_nombre_usuario);
        //Unirse o crear(si no existe) la sala
        socket.emit('crear_unir_sala', { nombre_sala: glob_nombre_sala, nombre_usuario: glob_nombre_usuario });
    });

    //Cuando el servidor indica que se creó la sala, pasamos a la siguiente vista
    socket.on('sala_creada', function() {
        $('#inicio').toggleClass('hide');
        $('#principal').toggleClass('hide');
        iniciador = true;
        iniciar_WebRTC();
    });

    //Cuando el servidor indica que se nos agregó a la sala, pasamos a la siguiente vista
    socket.on('agregado_a_sala', function() {
        $('#inicio').toggleClass('hide');
        $('#principal').toggleClass('hide');
        iniciar_WebRTC();
    });

    //Cuando la sala está llena, se le indica al usuario
    socket.on('sala_llena', function() {
        $('#msj-error-conectar').html('Lo sentimos, la sala está llena. . .').removeClass('hide');
    });

    //Verificar el nombre de usuario
    socket.on('usuario_existe', function() {
        $('#msj-error-conectar').html('Lo sentimos, ya existe otro usuario con el mismo nombre en la sala. . .').removeClass('hide');
    });

    //Enviar chat escrito
    $('#btn-enviar').click(function() {
        //Obtener el texto escrito
        var _mensaje = $('#txt-mensaje-enviar').val();
        //Si el texto es diferente de vacío enviar mensaje
        if (_mensaje != '') {
            //Pegar mi mj en la lista de mensajes
            $('#lista-mensajes').append('<li><strong>' + glob_nombre_usuario + ':</strong> ' + _mensaje + '</li>');
            //Objeto a enviar, se envía el usuario para que el remitente sepa de quién es el mensaje
            var obj_msg = {
                nombre_sala: glob_nombre_sala,
                nombre_usuario: glob_nombre_usuario,
                mensaje: _mensaje
            };
            socket.emit('mensaje', obj_msg);
            //Se limpia la caja de texto
            $('#txt-mensaje-enviar').val('');
        }
    });

    //Pegar mensajes recibidos de otros usuarios en la lista de mensajes
    socket.on('mensaje', function(datos) {
        $('#lista-mensajes').append('<li><strong>' + datos.nombre_usuario + ':</strong> ' + datos.mensaje + '</li>');
    });

    //Agregar nuevos usuarios conectados
    socket.on('usuario_agregado', function(usuarios_conectados) {
        $('#lista-usuarios-conectados').html('');
        $.each(usuarios_conectados, function(index, item) {
            if (item != glob_nombre_usuario)
                $('#lista-usuarios-conectados').append('<li usuario='+item+'>' + item + '</li>');
        });
        n_usuarios=$('#lista-usuarios-conectados').children('li').size()+1;
        // PC[(n_usuarios-2)]=new Array(new RTCPeerConnection(pcConfig),"");
        // PC[(n_usuarios-2)][0].onicecandidate = enviar_candidato;
        // PC[(n_usuarios-2)][0].onnegotiationneeded = function() {
        //     console.log('Negociación --> '+(n_usuarios-2));
        //     if (!iniciador) {
        //         console.log('Mandando oferta --> '+(n_usuarios-2));
        //         PC[(n_usuarios-2)][0].createOffer().then(function(offer) {
        //                 return PC[(n_usuarios-2)][0].setLocalDescription(offer);
        //             })
        //             .then(function() {
        //                 // send the offer to the other peer
        //                 enviar_descripcion((n_usuarios-2));
        //             })
        //             .catch(mostrar_error);
        //     }
        // };
        // PC[(n_usuarios-2)][0].ontrack = function(evt) {
        //     // don't set srcObject again if it is already set.
        //     //if (!remoteView.srcObject)
        //     var video_remoto = document.getElementById('video-remoto-'+(n_usuarios-1));
        //     video_remoto.srcObject = evt.streams[0];
        // };
        // navigator.mediaDevices.getUserMedia({ video: true })
        //     .then(function(stream) {
        //         //var video_local = document.getElementById('video-local');
        //         //video_local.srcObject = stream;
        //         PC[(n_usuarios-2)][0].addTrack(stream.getTracks()[0], stream);
        //         //pc.addTrack(stream.getAudioTracks()[0], stream);
        //         // PC[0].addTrack(stream.getVideoTracks()[0], stream);
        //     })
        //     .catch(mostrar_error);
        //iniciador=false;
    });

    //Mostrar lista de usuarios conectados
    $('#lbl-usuarios-conectados').click(function() {
        if ($('#lista-usuarios-conectados').html() != '')
            $('#lista-usuarios-conectados').toggleClass('visible');
    });


    function iniciar_WebRTC() {
        alert(n_usuarios);
        // send any ice candidates to the other peer
        for (let index = 0; index < ((iniciador) ? 1 : parseInt(n_usuarios-1)); index++) {
            PC[index]=new Array(new RTCPeerConnection(pcConfig),"");
            PC[index][0].onicecandidate = enviar_candidato;
            console.log("for 1 ... index="+index+"... < "+(n_usuarios-1));
        }
        // PC[0] = new RTCPeerConnection(pcConfig);
        // PC[1] = new RTCPeerConnection(pcConfig);
        // PC[0].onicecandidate = enviar_candidato;
        // PC[1].onicecandidate = enviar_candidato;

        // let the "negotiationneeded" event trigger offer generation
        for (let index = 0; index < ((iniciador) ? 1 : (n_usuarios-1)); index++) {
            PC[index][0].onnegotiationneeded = function() {
                console.log('Negociación --> '+(index+1));
                if (!iniciador) {
                    console.log('Mandando oferta --> '+(index+1));
                    PC[index][0].createOffer().then(function(offer) {
                            return PC[index][0].setLocalDescription(offer);
                        })
                        .then(function() {
                            // send the offer to the other peer
                            console.log("for 2  --> index="+index);
                            enviar_descripcion(index);
                            
                        })
                        .catch(mostrar_error);
                }
            };   
        }

        // once remote track arrives, show it in the remote video element
        for (let index = 0; index < ((iniciador) ? 1 : (n_usuarios-1)); index++) {
            PC[index][0].ontrack = function(evt) {
                // don't set srcObject again if it is already set.
                //if (!remoteView.srcObject)
                var video_remoto = document.getElementById('video-remoto-'+(index+1));
                video_remoto.srcObject = evt.streams[0];
                console.log("for 3");
            };    
        }
        
        // get a local stream, show it in a self-view and add it to be sent
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                var video_local = document.getElementById('video-local');
                video_local.srcObject = stream;
                for (let index = 0; index < (iniciador) ? 1 : (n_usuarios-1); index++) {
                    PC[index][0].addTrack(stream.getTracks()[0], stream);
                }
                console.log("for 4");
                //pc.addTrack(stream.getAudioTracks()[0], stream);
                // PC[0].addTrack(stream.getVideoTracks()[0], stream);
            })
            .catch(mostrar_error);
    }

    function enviar_candidato(evt) {
        if (evt.candidate) {
            console.log('Mandando candidato --> '+glob_nombre_usuario+' : ' + JSON.stringify(evt.candidate));
            socket.emit('candidato', {
                nombre_sala: glob_nombre_sala,
                nombre_usuario: glob_nombre_usuario,
                candidato: evt.candidate
            });
        }
    }

    function enviar_descripcion(index) {
        console.log('Mandando descripción --> '+(index+1));
        socket.emit('descripcion', {
            nombre_sala: glob_nombre_sala,
            nombre_usuario: glob_nombre_usuario,
            descripcion: PC[index][0].localDescription,
        });
    }

    function mostrar_error(error) {
        console.log(error.name + ': ' + error.message);
    }

    socket.on('descripcion', function(datos) {
        console.log('Recibiendo descripción --> '+datos.nombre_usuario);
        var i=0;//para saber a que pc.. del array se le va a poner descripcion
        if (datos.descripcion.type == 'offer') {
            for (let index = 0; index < (n_usuarios-1); index++) {
                if(PC[index][1] === ''){
                    i=index;
                    PC[i][1]=datos.nombre_usuario;
                    break;
                }
            }
            PC[i][0].setRemoteDescription(datos.descripcion).then(function() {
                    return PC[i][0].createAnswer();
                })
                .then(function(answer) {
                    return PC[i][0].setLocalDescription(answer);
                })
                .then(function() {
                    console.log('Mandando respuesta --> '+i);
                    enviar_descripcion(i);
                })
                .catch(mostrar_error);
        } else {
            for (let index = 0; index < (n_usuarios-1); index++) {
                if(PC[index][1] === datos.nombre_usuario || PC[index][1] === ''){
                    i=index;
                    PC[i][1]=datos.nombre_usuario;
                    break;
                }
            }
            console.log('Recibiendo respuesta --> '+i);
            PC[i][0].setRemoteDescription(datos.descripcion).catch(mostrar_error);
        }
    });

    socket.on('candidato', function(datos) {
        console.log('Recibiendo candidato --> '+datos.nombre_usuario+' : ' + JSON.stringify(datos.candidato));
        for (let index = 0; index < (n_usuarios-1); index++) {
            if(PC[index][1] === datos.nombre_usuario)
                    PC[index][0].addIceCandidate(datos.candidato);
        }
        // PC[0].addIceCandidate(datos.candidato);
    });
})();