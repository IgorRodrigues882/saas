'use strict';
var notify = $.notify('<i class="fa fa-bell-o"></i><strong>Bem vindo</strong> ao boomerangue backend versão beta!', {
    type: 'theme',
    allow_dismiss: true,
    delay: 10000,
    showProgressbar: true,
    timer: 300,
    animate:{
        enter:'animated fadeInDown',
        exit:'animated fadeOutUp'
    }
});

setTimeout(function() {
    notify.update('message', '<i class="fa fa-bell-o"></i>Se acontecer algum problema, entrar em contato!');
}, 3000);
