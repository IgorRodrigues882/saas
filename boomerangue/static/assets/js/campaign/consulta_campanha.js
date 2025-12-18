"use strict";

// Encontra o cookie que contém o csrftoken do Django
const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
// Extrai o valor do csrftoken do cookie
const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;

var campaign = function(){

    
    var create_campaign;
    var init = function(){
    
    }
    return {
        init: function() {
            create_campaign = document.getElementById("create_campaign");
            init();
        }
    };
}()

campaign.init()

var verifica_pagina = ''
$('.nav-link').on('click', function(){
$('.nav-link').each(function () {
  if ($(this).hasClass('active')) {
    verifica_pagina = $(this).text();
    console.log(verifica_pagina)
    // $('.tooltip').tooltip('dispose');
    // $('[data-toggle="tooltip"]').tooltip();
  }
});
})

  
