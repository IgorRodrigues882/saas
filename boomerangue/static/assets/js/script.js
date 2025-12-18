(function ($) {
  "use strict";
  var darkMode = localStorage.getItem("layoutMode");
  if (darkMode === "dark-only") {
    $(".mode").addClass("dark");
    $("body").addClass("dark-only");
  } else {
    $(".mode").removeClass("dark");
    $("body").removeClass("dark-only");
  }
  
  
  $(document).on("click", function (e) {
    var outside_space = $(".outside");
    if (
      !outside_space.is(e.target) &&
      outside_space.has(e.target).length === 0
    ) {
      $(".menu-to-be-close").removeClass("d-block");
      $(".menu-to-be-close").css("display", "none");
    }
  });

  $(".prooduct-details-box .close").on("click", function (e) {
    var tets = $(this).parent().parent().parent().parent().addClass("d-none");
    console.log(tets);
  });

  if ($(".page-wrapper").hasClass("horizontal-wrapper")) {
    $(".sidebar-list").hover(
      function () {
        $(this).addClass("hoverd");
      },
      function () {
        $(this).removeClass("hoverd");
      }
    );
    $(window).on("scroll", function () {
      if ($(this).scrollTop() < 600) {
        $(".sidebar-list").removeClass("hoverd");
      }
    });
  }

  /*----------------------------------------
     passward show hide
     ----------------------------------------*/
  $(".show-hide").show();
  $(".show-hide span").addClass("show");

  $(".show-hide span").click(function () {
    if ($(this).hasClass("show")) {
      $('input[name="login[password]"]').attr("type", "text");
      $(this).removeClass("show");
    } else {
      $('input[name="login[password]"]').attr("type", "password");
      $(this).addClass("show");
    }
  });
  $('form button[type="submit"]').on("click", function () {
    $(".show-hide span").addClass("show");
    $(".show-hide")
      .parent()
      .find('input[name="login[password]"]')
      .attr("type", "password");
  });

  /*=====================
      02. Background Image js
      ==========================*/
  $(".bg-center").parent().addClass("b-center");
  $(".bg-img-cover").parent().addClass("bg-size");
  $(".bg-img-cover").each(function () {
    var el = $(this),
      src = el.attr("src"),
      parent = el.parent();
    parent.css({
      "background-image": "url(" + src + ")",
      "background-size": "cover",
      "background-position": "center",
      display: "block",
    });
    el.hide();
  });

  $(".mega-menu-container").css("display", "none");
  $(".header-search").click(function () {
    $(".search-full").addClass("open");
  });
  $(".close-search").click(function () {
    $(".search-full").removeClass("open");
    $("body").removeClass("offcanvas");
  });
  $(".mobile-toggle").click(function () {
    $(".nav-menus").toggleClass("open");
  });

  $(".bookmark-search").click(function () {
    $(".form-control-search").toggleClass("open");
  });
  $(".filter-toggle").click(function () {
    $(".product-sidebar").toggleClass("open");
  });
  $(".toggle-data").click(function () {
    $(".product-wrapper").toggleClass("sidebaron");
  });
  $(".form-control-search input").keyup(function (e) {
    if (e.target.value) {
      $(".page-wrapper").addClass("offcanvas-bookmark");
    } else {
      $(".page-wrapper").removeClass("offcanvas-bookmark");
    }
  });
  $(".search-full input").keyup(function (e) {
    console.log(e.target.value);
    if (e.target.value) {
      $("body").addClass("offcanvas");
    } else {
      $("body").removeClass("offcanvas");
    }
  });

  $("body").keydown(function (e) {
    if (e.keyCode == 27) {
      $(".search-full input").val("");
      $(".form-control-search input").val("");
      $(".page-wrapper").removeClass("offcanvas-bookmark");
      $(".search-full").removeClass("open");
      $(".search-form .form-control-search").removeClass("open");
      $("body").removeClass("offcanvas");
    }
  });
  $(".mode").on("click", function () {
    $(".mode").toggleClass("dark");
    $("body").toggleClass("dark-only");
    var color = $(this).attr("data-attr");
    var darkInBody = document.body.classList.contains("dark-only");
    if (darkInBody) {
      localStorage.setItem("layoutMode", "dark-only");
    } else {
      localStorage.setItem("layoutMode", "");
    }
  });
})(jQuery);

$(".loader-wrapper").fadeOut("slow", function () {
  $(this).remove();
});

$(window).on("scroll", function () {
  if ($(this).scrollTop() > 600) {
    $(".tap-top").fadeIn();
  } else {
    $(".tap-top").fadeOut();
  }
});

$(".tap-top").click(function () {
  $("html, body").animate(
    {
      scrollTop: 0,
    },
    600
  );
  return false;
});

function toggleFullScreen() {
  if (
    (document.fullScreenElement && document.fullScreenElement !== null) ||
    (!document.mozFullScreen && !document.webkitIsFullScreen)
  ) {
    if (document.documentElement.requestFullScreen) {
      document.documentElement.requestFullScreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullScreen) {
      document.documentElement.webkitRequestFullScreen(
        Element.ALLOW_KEYBOARD_INPUT
      );
    }
  } else {
    if (document.cancelFullScreen) {
      document.cancelFullScreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen();
    }
  }
}
(function ($, window, document, undefined) {
  "use strict";
  var $ripple = $(".js-ripple");
  $ripple.on("click.ui.ripple", function (e) {
    var $this = $(this);
    var $offset = $this.parent().offset();
    var $circle = $this.find(".c-ripple__circle");
    var x = e.pageX - $offset.left;
    var y = e.pageY - $offset.top;
    $circle.css({
      top: y + "px",
      left: x + "px",
    });
    $this.addClass("is-active");
  });
  $ripple.on(
    "animationend webkitAnimationEnd oanimationend MSAnimationEnd",
    function (e) {
      $(this).removeClass("is-active");
    }
  );
})(jQuery, window, document);

// active link

$(".chat-menu-icons .toogle-bar").click(function () {
  $(".chat-menu").toggleClass("show");
});

//landing header //
$(".toggle-menu").click(function () {
  $(".landing-menu").toggleClass("open");
});
$(".menu-back").click(function () {
  $(".landing-menu").toggleClass("open");
});

$(".md-sidebar-toggle").click(function () {
  $(".md-sidebar-aside").toggleClass("open");
});

// Language
var tnum = "en";

$(document).ready(function () {
  if (localStorage.getItem("body")) {
    document.body.classList.add();
  }

  if (localStorage.getItem("primary") != null) {
    var primary_val = localStorage.getItem("primary");
    $("#ColorPicker1").val(primary_val);
    var secondary_val = localStorage.getItem("secondary");
    $("#ColorPicker2").val(secondary_val);
  }

  $(document).click(function (e) {
    $(".translate_wrapper, .more_lang").removeClass("active");
  });
  $(".translate_wrapper .current_lang").click(function (e) {
    e.stopPropagation();
    $(this).parent().toggleClass("active");

    setTimeout(function () {
      $(".more_lang").toggleClass("active");
    }, 5);
  });

  /*TRANSLATE*/
  translate(tnum);

  $(".more_lang .lang").click(function () {
    $(this).addClass("selected").siblings().removeClass("selected");
    $(".more_lang").removeClass("active");

    var i = $(this).find("i").attr("class");
    var lang = $(this).attr("data-value");
    var tnum = lang;
    translate(tnum);

    $(".current_lang .lang-txt").text(lang);
    $(".current_lang i").attr("class", i);
  });
});

function translate(tnum) {
  $(".lan-1").text(trans[0][tnum]);
  $(".lan-2").text(trans[1][tnum]);
  $(".lan-3").text(trans[2][tnum]);
  $(".lan-4").text(trans[3][tnum]);
  $(".lan-5").text(trans[4][tnum]);
  $(".lan-6").text(trans[5][tnum]);
  $(".lan-7").text(trans[6][tnum]);
  $(".lan-8").text(trans[7][tnum]);
  $(".lan-9").text(trans[8][tnum]);
}

var trans = [
  {
    en: "General",
    pt: "Geral",
    es: "Generalo",
    fr: "GÃ©nÃ©rale",
    de: "Generel",
    cn: "ä¸€èˆ¬",
    ae: "Ø­Ø¬Ù†Ø±Ø§Ù„ Ù„ÙˆØ§Ø¡",
  },
  {
    en: "Dashboards,widgets & layout.",
    pt: "PainÃ©is, widgets e layout.",
    es: "Paneloj, fenestraÄµoj kaj aranÄo.",
    fr: "Tableaux de bord, widgets et mise en page.",
    de: "Dashboards, widgets en lay-out.",
    cn: "ä»ªè¡¨æ¿ï¼Œå°å·¥å…·å’Œå¸ƒå±€ã€‚",
    ae: "Ù„ÙˆØ­Ø§Øª Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª ÙˆØ§Ù„Ø£Ø¯ÙˆØ§Øª ÙˆØ§Ù„ØªØ®Ø·ÙŠØ·.",
  },
  {
    en: "Dashboards",
    pt: "PainÃ©is",
    es: "Paneloj",
    fr: "Tableaux",
    de: "Dashboards",
    cn: " ä»ªè¡¨æ¿ ",
    ae: "ÙˆØ­Ø§Øª Ø§Ù„Ù‚ÙŠØ§Ø¯Ø© ",
  },
  {
    en: "Default",
    pt: "PadrÃ£o",
    es: "Vaikimisi",
    fr: "DÃ©faut",
    de: "Standaard",
    cn: "é›»å­å•†å‹™",
    ae: "ÙˆØ¥ÙØªØ±Ø§Ø¶ÙŠ",
  },
  {
    en: "Ecommerce",
    pt: "ComÃ©rcio eletrÃ´nico",
    es: "Komerco",
    fr: "Commerce Ã©lectronique",
    de: "E-commerce",
    cn: "é›»å­å•†å‹™",
    ae: "ÙˆØ§Ù„ØªØ¬Ø§Ø±Ø© Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ©",
  },
  {
    en: "Widgets",
    pt: "Ferramenta",
    es: "Vidin",
    fr: "Widgets",
    de: "Widgets",
    cn: "å°éƒ¨ä»¶",
    ae: "ÙˆØ§Ù„Ø­Ø§Ø¬ÙŠØ§Øª",
  },
  {
    en: "Page layout",
    pt: "Layout da pÃ¡gina",
    es: "PaÄa aranÄo",
    fr: "Tableaux",
    de: "Mise en page",
    cn: "é é¢ä½ˆå±€",
    ae: "ÙˆØªØ®Ø·ÙŠØ· Ø§Ù„ØµÙØ­Ø©",
  },
  {
    en: "Applications",
    pt: "FormulÃ¡rios",
    es: "Aplikoj",
    fr: "Applications",
    de: "Toepassingen",
    cn: "æ‡‰ç”¨é ˜åŸŸ",
    ae: "ÙˆØ§Ù„ØªØ·Ø¨ÙŠÙ‚Ø§Øª",
  },
  {
    en: "Ready to use Apps",
    pt: "Pronto para usar aplicativos",
    es: "Preta uzi Apps",
    fr: " Applications prÃªtes Ã  lemploi ",
    de: "Klaar om apps te gebruiken",
    cn: "ä»ªè¡¨æ¿",
    ae: "Ø¬Ø§Ù‡Ø² Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„ØªØ·Ø¨ÙŠÙ‚Ø§Øª",
  },
];

$(".mobile-title svg").click(function () {
  $(".header-mega").toggleClass("d-block");
});

$(".onhover-dropdown").on("click", function () {
  $(this).children(".onhover-show-div").toggleClass("active");
});

// if ($(window).width() <= 991) {
//     $(".left-header .link-section").children('ul').css('display', 'none');
//     $(this).parent().children('ul').toggleClass("d-block").slideToggle();
// }

// if ($(window).width() < 991) {
//     $('<div class="bg-overlay"></div>').appendTo($('body'));
//     $(".bg-overlay").on("click", function () {
//         $(".page-header").addClass("close_icon");
//         $(".sidebar-wrapper").addClass("close_icon");
//         $(this).removeClass("active");
//     });

//     $(".toggle-sidebar").on("click", function () {
//         $(".bg-overlay").addClass("active");
//     });
//     $(".back-btn").on("click", function () {
//         $(".bg-overlay").removeClass("active");
//     });
// }

$("#flip-btn").click(function () {
  $(".flip-card-inner").addClass("flipped");
});

$("#flip-back").click(function () {
  $(".flip-card-inner").removeClass("flipped");
});

$(".email-sidebar .email-aside-toggle ").on("click", function (e) {
  $(".email-sidebar .email-left-aside ").toggleClass("open");
});

$(".resp-serch-box").on("click", function (e) {
  $(".search-form").toggleClass("open");
  e.preventDefault();
});

// for count function js ----------------------------

// $(document).ready(function(){
//     $('.count').prop('disabled', true);
//      $(document).on('click','.plus',function(){
//     $('.count').val(parseInt($('.count').val()) + 1 );
//     });
//       $(document).on('click','.minus',function(){
//       $('.count').val(parseInt($('.count').val()) - 1 );
//         if ($('.count').val() == 0) {
//         $('.count').val(1);
//       }
//         });
//   });

// $(".md-sidebar-toggle").click(function () {
//   $(".md-sidebar-aside").toggleClass("a");
// });

// color selector
$(".color-selector ul li ").on("click", function (e) {
  $(".color-selector ul li").removeClass("active");
  $(this).addClass("active");
});

// extra
$(document).ready(function () {
  $("body").addClass("rtl");
});

window.onload = function() {
  if (typeof swal === 'undefined') {
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11.0.19/dist/sweetalert2.all.min.js'; // Adicione o URL do CDN do SweetAlert aqui
    script.onload = function() {
      console.log('SweetAlert carregado com sucesso.');
    };
    script.onerror = function() {
      console.error('Erro ao carregar SweetAlert.');
    };
    document.head.appendChild(script);
  } else {
    console.log('SweetAlert já está carregado.');
  }
};

// // barra pesquisa global

// // Selecionando o input pelo ID
// var inputElement = document.getElementById("pesquisa_global");

// // Selecionando a div pelo seletor de classe
// var divElement = document.querySelector("#dropdown-pesquisa");

// // Adicionando a classe quando o input estiver focado
// inputElement.addEventListener("focus", function() {
//     divElement.classList.remove("onhover-show-div");
// });

// // Removendo a classe quando o input for desfocado
// inputElement.addEventListener("blur", function() {
//     divElement.classList.add("onhover-show-div");
// });



function aprove_empresa(index, aprove){
  console.log(aprove)
  const data = new FormData;
  if(aprove == 'aprove'){
    data.append('statusregistro_id',200)
  }
  else{
    data.append('statusregistro_id',9000)
  }
  fetch(`api/create-empresa/${index}/`,{
    method:'PATCH',
    body:data,
    headers: {
      'X-CSRFToken': csrftoken,
  },
  })
  .then(res=>res.json())
  .then(data=>{
    console.log(data)
    if(data.id){
      notifications();
    }
    else{
      new swal({
        title: "Erro",
        text: data.error, 
        icon: "error",
        button: "OK",
      });
    }
  })
}

function fetch_logo_empresa(data, csrftoken){
  fetch(`/pt/api/create-empresa/${logo_empresa}/`, {
    method: "PATCH",
    headers: {
      'X-CSRFToken': csrftoken,
    },
    body: data,
  })
    .then((response) => {
      if (response.ok) {
        new swal({
          icon: 'success',
          title: 'Arquivo Importado Com sucesso!',
          showConfirmButton: false,
          timer: 1500
        })
        // window.location.reload()
      } else {
        new swal({
          text: "Ocorreu um erro ao tentar salvar",
          icon: "error",
          buttonsStyling: false,
          confirmButtonText: "Ok",
          customClass: {
            confirmButton: "btn btn-primary"
          }
        });
      }
      return response.json()
    })
    .then(data=>{
      console.log(data)
      if(data.id){
        let div = document.getElementById('logo_empresa_');
        div.innerHTML = ''
        div.innerHTML = `
        <div style="width: 100%; display:flex; justify-content:center; align-items:center; position: relative;" id="image_logo_div">
              <div style="width: 120px; height:120px;">
                  <div class="sidebar-img-content">
                      <img class="img-fluid" src="${data.image_logo_empresa}" alt="" style="object-fit: cover; width: 100%; height: 100%;">
                      <a id="removeButton_logo" href="#" class="btn btn-secondary" style="position: absolute; top: 0; right: 5px; border-radius: 50%; padding: 10px; height: 40px; width:40px; border:none; display:none;">
                          <i class="fa fa-trash"></i>
                      </a>
                  </div>
              </div>
          </div>
        `
      }
      else{
        new swal({
          text: "Ocorreu um erro ao tentar salvar:" + data.image_logo_empresa,
          icon: "error",
          buttonsStyling: false,
          confirmButtonText: "Ok",
          customClass: {
            confirmButton: "btn btn-primary"
          }
        });
      }
    })
    .finally(()=>{
      importa_logo.init()
    })
}

function exluir_logo_empresa(csrftoken){
  let data = new FormData();
  // Se você tem uma imagem padrão para usar quando a logo é removida, adicione aqui.
  // Caso contrário, você pode tentar enviar 'null' para remover a logo.
  data.append("image_logo_empresa", '');

  fetch(`/pt/api/create-empresa/${logo_empresa}/`, {
    method: "PATCH",
    headers: {
      'X-CSRFToken': csrftoken,
      // "Content-Type": "application/json",
    },
    body: data,
  })
    .then((response) => {
      if (response.ok) {
        let div = document.getElementById('logo_empresa_');
        div.innerHTML = ''
        div.innerHTML = `
        <div class="sidebar-img-section">
        <div class="sidebar-img-content"><img class="img-fluid" src="/static/assets/images/side-bar.png"
            alt="">
          <h4>Sem logo?</h4><a class="txt" href="">Coloque a logo da sua empresa aqui!</a><a class="btn btn-secondary"
          data-bs-toggle="modal" data-bs-target="#modal-importar-logo" href="#">Inserir logo</a>
        </div>
      </div>
        `
      } else {
        swal({
          text: "Ocorreu um erro ao tentar remover a logo",
          icon: "error",
          buttonsStyling: false,
          confirmButtonText: "Ok",
          customClass: {
            confirmButton: "btn btn-primary"
          }
        });
      }
    console.log(response.json())
    })
}


var importa_logo = function(){
    // Encontra o cookie que contém o csrftoken do Django
    const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
    // Extrai o valor do csrftoken do cookie
    const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;
    let btn_importa_logo;
    var removeButton;
    var imageDiv;
    var init = function(){
      Dropzone.options.ImportLogo= {
        paramName: "ImportLogo",
        maxFiles: 1,
        maxFilesize: 5,
        acceptedFiles: "image/*", // Aceitar apenas arquivos de imagem
        autoProcessQueue: false, // Desativar o envio automático
        init: function() {
                var myDropzone = this; 
                this.on("success", function(file, response) {
                // Lógica a ser executada após o upload bem-sucedido, se necessário
                console.log(response);
                });
                this.on("addedfile", function(file) {
                    // Cria um botão de exclusão
                    var removeButton = Dropzone.createElement("<button class='dz-remove_logo'>Remover imagem</button>");
                    
                    // Ouve o evento de clique no botão de exclusão
                    removeButton.addEventListener("click", function(e) {
                      e.preventDefault();
                      e.stopPropagation();
        
                      // Remove o arquivo usando a referência armazenada à instância do Dropzone
                      myDropzone.removeFile(file);
                    });
        
                    // Adiciona o botão de exclusão ao arquivo de visualização
                    file.previewElement.appendChild(removeButton);
                });
                imagesUploaded=true

        }
        };

        // salva arquivo
        btn_importa_logo.addEventListener("click", function (e) {
          new swal({
            title: 'Aguarde...',
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            showConfirmButton: false,
            onOpen: () => {
              swal.showLoading();
            }
          });

          const data = new FormData();
          const dropzone = Dropzone.forElement("#ImportLogo");
          const queuedFiles = dropzone.getQueuedFiles();

          if (queuedFiles.length > 0) {
            data.append("image_logo_empresa", dropzone.getQueuedFiles()[0]);
          }
          else {
            new swal({
              text: "Nenhum Arquivo Importado!",
              icon: "error",
              buttonsStyling: false,
              confirmButtonText: "Ok",
              customClass: {
                confirmButton: "btn btn-primary"
              }
            });
            return;
          }

          fetch_logo_empresa(data, csrftoken)

        })
          if(imageDiv){
            imageDiv.addEventListener('mouseover', function() {
              removeButton.style.display = 'block';
            });
      
            imageDiv.addEventListener('mouseout', function() {
              removeButton.style.display = 'none';
            });

            removeButton.addEventListener('click', function(){
              exluir_logo_empresa(csrftoken)
            })
          }

    }
    return {
        init: function() {
            btn_importa_logo = document.getElementById('new_logo_empresa')
            removeButton = document.getElementById('removeButton_logo');
            imageDiv = document.getElementById('image_logo_div');
            init();
        }
    };
}()

importa_logo.init()
let count_success = '0'
let count_erro = '0'
let total_msg_enviar = '0'
let error_websocket = ''
let notify_web = ''
let isPaused = false
let reconnectAttempts = 0
let maxReconnectAttempts = 10

var protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
var socket = null;

function connectWebSocket() {
  socket = new WebSocket(protocol + "//" + window.location.host + `/ws/messages/${logo_empresa}/`);

  socket.onopen = function() {
    console.log('WebSocket connection established.');
    reconnectAttempts = 0; // Reset reconnect attempts on successful connection
  };

  socket.onmessage = function(e) {
    console.log(e);
    var data = JSON.parse(e.data);
    var message = '';
    if(data['message']){
      message = data['message']
    }
    else{
      message = data
    }

    console.log("Message", message)
    let format = '';

    if (data['message'] && message.includes('Mensagens enviadas')) {
      // Extrair valores de mensagens enviadas, mensagens com erro e o total
      let parts = message.split(' ');
      count_success = parts[2]; // Valor após 'Mensagens enviadas:'
      count_erro = parts[9];    // Valor após 'Mensagens com erro:'
      total_msg_enviar = parts[11]; // Valor após 'Total:'


      // Atualizar os elementos na interface
      $("#msg_enviadas_tab").text(count_success);
      $("#msg_nao_enviadas_tab").text(count_erro);
      $("#msg_total_tab").text(total_msg_enviar);
      $("#div-send-tab").removeClass('d-none');
    }
    if (message['MensagemTexto'] !== undefined) {
      // Obtém o identificador do chat atual
      const chatAtual = document.querySelector('#chat-atual-id')?.value;
      const novoRemetente = message['entidade_id'] || message['sender'];

      // Se o chat do remetente estiver aberto, adiciona a mensagem
      if (chatAtual && chatAtual === String(novoRemetente)) {
          const novaMensagem = {
              MensagemTexto: message['MensagemTexto'],
              DataHoraDoEvento: message['DataHoraDoEvento'],
              direcao: message['direcao'],
              complemento1: message['complemento1'],
              evento2: message['evento2'],
              URL_Anexo: message['URL_Anexo'],
              nome_anexo: message['nome_anexo']
          };
          
          // Gera o HTML do novo balão
          const novoBalao = mensagens.gera_chats(novaMensagem);
          
          // Adiciona o balão ao container de mensagens
          const chatContainer = document.querySelector('#tbody_msgs');
          if (chatContainer) {
              chatContainer.insertAdjacentHTML('beforeend', novoBalao);
              // Rola para a última mensagem
              chatContainer.scrollTop = chatContainer.scrollHeight;
          }
      }
    }
    if (message['total_mensagens'] && (message['entidade_id'] !== undefined || message['sender'])) {
      let identificador = message['entidade_id'] || message['sender'];
      let listaUsuarios = document.querySelector('#v-pills-tab');
      let div = document.querySelector(`.contact-tab-${identificador}`);
      

      if (!div && listaUsuarios) {
          // Criar nova div de contato seguindo o padrão existente
          let novoContato = `
              <a class="contact-tab-${identificador} nav-link" id="v-pills-user-tab" 
                 data-bs-toggle="pill" 
                 onclick="mensagens.reseta_pag(${identificador}, '${message['sender'] || message['entidade_id']}'), mensagens.activeDiv(${identificador})"
                 href="#v-pills-user" role="tab" aria-controls="v-pills-user" aria-selected="true">
                  <li class="clearfix">
                      <div class="media">
                          <img class="rounded-circle user-image" src="/static/assets/images/user/1.jpg" alt="">
                          <div class="status-circle away"></div>
                          <div class="media-body">
                              <div class="about">
                                  <div class="name" id="nome_lead">${message['entidade_id'] ? 'Entidade ' + message['entidade_id'] : message['sender']}</div>
                                  <div class="status ultima_mensagem">${message['MensagemTexto']}</div>
                              </div>
                          </div>
                          <label class="badge badge-light-primary" id="qtd_messages">${message['total_mensagens']}</label>
                      </div>
                  </li>
              </a>
          `;
          
          // Adiciona o novo contato no início da lista
          listaUsuarios.insertAdjacentHTML('afterbegin', novoContato);
      } else if (div) {
          // Atualiza o contador de mensagens não lidas
          let label = div.querySelector('#qtd_messages');
          if (label) {
              let qtd = label.innerText;
              let number = parseInt(message['total_mensagens']) + (qtd ? parseInt(qtd) : 0);
              label.innerText = number;
          }

          let ult = div.querySelector(".ultima_mensagem")
          if (ult){
            ult.innerText = message['MensagemTexto']
          }
          
          // Move para o topo da lista
          if (listaUsuarios) {
              listaUsuarios.insertBefore(div, listaUsuarios.firstChild);
          }
      }
    }
    if (data['response']) {
      let div = document.getElementById('result_div_validation');
      let loader = document.getElementById('analise_div');
      if(loader){
        loader.style.display = 'none'
      }
      if (div) {
    // Limpa o conteúdo anterior da div
    div.innerHTML = '';

    // Verifica se há validações no JSON
    const validations = data['response']['validations'];
    if (validations && validations.length > 0) {
      // Cria um título para os erros
      const title = document.createElement('h3');
      title.textContent = 'Erros encontrados:';
      title.style.color = '#ff4d4d';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '10px';
      div.appendChild(title);

      // Cria uma lista para exibir os erros
      const ul = document.createElement('ul');
      ul.style.listStyleType = 'disc';
      ul.style.marginLeft = '20px';
      ul.style.color = '#333';

      // Percorre as validações e exibe as discrepâncias
      validations.forEach((validation) => {
        if (validation['discrepancies'] && Object.keys(validation['discrepancies']).length > 0) {
          Object.entries(validation['discrepancies']).forEach(([key, value]) => {
            const li = document.createElement('li');
            li.textContent = `${key} ${value}`;
            li.style.marginBottom = '5px';
            li.style.backgroundColor = '#fce4e4';
            li.style.border = '1px solid #ffcccc';
            li.style.borderRadius = '5px';
            li.style.padding = '8px';
            ul.appendChild(li);
          });
          div.appendChild(ul); // Add this line to append the ul if there are discrepancies
        } else {
          const successMessage = document.createElement('p');
          successMessage.textContent = 'Nenhum erro encontrado.';
          successMessage.style.color = '#4CAF50';
          successMessage.style.fontWeight = 'bold';
          successMessage.style.padding = '10px';
          successMessage.style.border = '1px solid #d4edd9';
          successMessage.style.borderRadius = '5px';
          successMessage.style.backgroundColor = '#e8f5e9';
          div.appendChild(successMessage);
        }
      });

      div.appendChild(ul);
    } else {
      // Se não houver erros, exibe uma mensagem de sucesso
      const successMessage = document.createElement('p');
      successMessage.textContent = 'Nenhum erro encontrado.';
      successMessage.style.color = '#4CAF50';
      successMessage.style.fontWeight = 'bold';
      successMessage.style.padding = '10px';
      successMessage.style.border = '1px solid #d4edd9';
      successMessage.style.borderRadius = '5px';
      successMessage.style.backgroundColor = '#e8f5e9';
      div.appendChild(successMessage);
    }
  }
    }
    if (data['message'] && message.includes('ERROR')) {
      error_websocket = `
      <div class='mb-2'>
        <strong style="color: red;">${message}</strong>
      </div>
      `;
      $("#message-erro-tab").text(message)
      $("#div-send-tab").removeClass('d-none')
    }

    let progress = ((parseInt(count_success) + parseInt(count_erro)) / parseInt(total_msg_enviar)) * 100;

    $("#msg_total_tab").text(total_msg_enviar)
    $("#processadas-tab").text((parseInt(count_success) + parseInt(count_erro)))
    $("#total-tab-send").text(total_msg_enviar)

    $("#progress_bar_tab").css('width', progress+'%')
    
    if (notify_web) {
      notify_web.update('message', `
      <div class='d-flex align-items-center'>
        <i class="fa fa-bell-o"></i>
        <div class='ms-1 d-block' style="width: 80%;">
          <div>
            <strong>Mensagens enviadas: ${count_success}</strong>
          </div>
          <div>
            <strong style="color: red;">Mensagens com erro: ${count_erro}</strong>
          </div>

          <div class='mb-3'>
              ${ parseInt(count_success) + parseInt(count_erro)} / ${total_msg_enviar}
              <div class="progress">
                <div class="progress-bar" role="progressbar" style="width: ${progress}%" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
            </div>
            <button id="pauseButton" class="btn btn-light mb-2 d-flex justify-content-center align-items-center" style='width: 10px; height:20px; color:black;'>
              <i id="pauseIcon" class="fa fa-pause" style="font-size: 10px;"></i>
            </button>

          ${error_websocket}
          
        </div>
      </div>
      `);

      document.getElementById('pauseButton').addEventListener('click', function() {
        isPaused = !isPaused;
        var icon = document.getElementById('pauseIcon');
        if (isPaused) {
          icon.className = 'fa fa-play';
        } else {
          icon.className = 'fa fa-pause';
        }
        operation();
      });
    }
  };

  socket.onclose = function(e) {
    console.log('WebSocket connection closed:', e.reason);
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      console.log(`Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts})`);
      setTimeout(function() {
        connectWebSocket();
      }, 3000); // Tenta reconectar após 3 segundos
    } else {
      console.log('Max reconnect attempts reached. Could not reconnect to WebSocket.');
      // Aqui você pode mostrar uma mensagem de erro ou tentar uma ação alternativa
    }
  };

  socket.onerror = function(err) {
    console.error('WebSocket encountered error: ', err.message, 'Closing socket');
    socket.close(); // Fecha o socket ao encontrar um erro
  };
}

// Chame esta função para iniciar a conexão WebSocket
connectWebSocket();

function init_envio(id) {
  notify_web = ''
  count_success = '0'
  count_erro = '0'
  total_msg_enviar = '0'
  error_websocket = ''

  notify_web = $.notify(`Verificando arquivos`, {
    type: 'theme',
    allow_dismiss: true,
    delay: 0,
    showProgressbar: true,
    timer: 300,
    animate: {
      enter: 'animated fadeInDown',
      exit: 'animated fadeOutUp'
    }
  });

  fetch(`/pt/api/campanhas/envio_mensagens_campanha/`, {
    method: 'POST',
    headers: {
      'X-CSRFToken': csrftoken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: id })
  }).then((response) => response.json())
    .then((data) => {
      console.log(data);
      if (data.success) {
        // Mensagem de sucesso (se necessário)
      } else {
        new swal({
          title: "Erro",
          text: data.error,
          icon: "error",
          button: "OK",
        });
      }
    });
}



function operation() {
  let element = ''
  let data = new FormData;
  if (document.getElementById('save_bot_update')){
    element = document.getElementById('save_bot_update')
  }
  else if(document.getElementById('id_campanha')){
    element = document.getElementById('id_campanha')
  }
  if (isPaused) {
    data.append("status_campanha", 'PA');
  }
  else{
    data.append("status_campanha", 'EA');
  }
  if(element){
    fetch(`/pt/api/campanhas/${element.dataset.id}/`,{
      method: 'PATCH',
      headers: {
        // 'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken,
      },
      body: data
    })
    .then(res=> res.json())
    .then(data=>{
      console.log(data)
      if(data.status_campanha == 'EA'){
        init_envio(element.dataset.id)
      }
    })
  }
}


var chat_bot = function() {
  const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
  const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;

  let id = '';
  
  var init = function() {
    document.addEventListener("DOMContentLoaded", () => {
      // Elementos do DOM
      const chatToggle = document.getElementById("chat-toggle");
      const chatWidget = document.getElementById("chat-widget");
      const chatHistory = document.getElementById("chat-history");
      const closeChat = document.getElementById("close-chat");
      const loader = document.getElementById("loader-chat-bot");
      const sendMessageButton = document.getElementById("send-message-bot");
      const chatInput = document.getElementById("chat-input");
      const chatBody = document.getElementById("chat-body");
      const typingIndicator = document.getElementById("typing-indicator");
      const viewHistory = document.getElementById("view-history");
      const backToChat = document.getElementById("back-to-chat");
      const historyBody = document.getElementById("history-body");
      const loaderhistory = document.getElementById("loader-chat-bot-hitory");
    
      // Funções de interação com o DOM
      function toggleChatVisibility() {
        chatWidget.style.display = "flex";
        chatToggle.style.display = "none";
      }
    
      function closeChatVisibility() {
        chatWidget.style.display = "none";
        chatToggle.style.display = "flex";
      }
    
      function toggleHistoryVisibility() {
        chatWidget.style.display = "none";
        chatHistory.style.display = "block";
        currentPage = 1
        historyBody.innerHTML = ''
        loadChannels();
      }
    
      function backToChatVisibility() {
        chatHistory.style.display = "none";
        chatWidget.style.display = "flex";
      }
    
      // Função para adicionar mensagens ao chat
      function appendMessage(message, className) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message-bot", className);
        messageDiv.textContent = message;
        chatBody.prepend(messageDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
      }
    
      // Função para carregar o histórico de mensagens

      function formatTime(utcTime) {
        const date = new Date(utcTime);
        const now = new Date();
      
        // Ajustar para o fuso horário de Brasília (-3 horas do UTC)
        const offset = -3; // Fuso horário de Brasília
        date.setHours(date.getHours() + offset);
        
        const diffInMs = now - date;
        const diffInSeconds = Math.floor(diffInMs / 1000);
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);
      
        if (diffInMinutes < 60) {
          return diffInMinutes === 1 ? "1 minuto atrás" : `${diffInMinutes} minutos atrás`;
        } else if (diffInHours < 24) {
          return diffInHours === 1 ? "1 hora atrás" : `${diffInHours} horas atrás`;
        } else {
          // Formata para o padrão dd/mm/yyyy
          return date.toLocaleDateString("pt-BR");
        }
      }

      let currentPage = 1;
      let isLoading = false;

      async function loadChannels() {
        loaderhistory.style.display='block'
        if (isLoading) return;
        isLoading = true;
        try {
          const response = await fetch(`/pt/api/chat-history/?page=${currentPage}`);
          const data = await response.json();
          if (data.results.length > 0) {
            data.results.forEach((item) => {
              const cardDiv = document.createElement("div");
              cardDiv.classList.add("channel-card");
            
              const formattedTime = formatTime(item.data_hora);
            
              cardDiv.innerHTML = `
                <div class="channel-avatar"></div>
                <div class="channel-info">
                  <div class="channel-header">
                    <span class="channel-name">PlugueIA</span>
                    <span class="channel-time">${formattedTime}</span>
                  </div>
                  <div class="channel-message">${item.last_message}</div>
                </div>
              `;
            
              historyBody.appendChild(cardDiv);
            
              cardDiv.addEventListener("click", () => {
                loadChannelMessages(item.id);
              });
            });
            currentPage++;
          }
        } catch (err) {
          console.error("Erro ao carregar canais:", err);
        } finally {
          isLoading = false;
          loaderhistory.style.display='none'
        }
      }

      // Evento para scroll infinito
      historyBody.addEventListener("scroll", () => {
        if (historyBody.scrollTop + historyBody.clientHeight >= historyBody.scrollHeight - 10) {
          loadChannels();
        }
      });
      // Função para carregar as mensagens de um canal específico
      let messagesPage = 1;
      let messagesLoading = false;

      async function loadChannelMessages(channelId) {
        messagesPage = 1;
        id = channelId;
        loader.style.display = 'block';
        backToChatVisibility();
        chatBody.innerHTML = '';
      
        async function fetchMessages() {
          if (messagesLoading) return;
          messagesLoading = true;
      
          try {
            const response = await fetch(`/pt/api/chat-history/${channelId}/?page=${messagesPage}`);
            const data = await response.json();
      
            data.results.forEach((item) => {
              const messageDiv = document.createElement("div");
              messageDiv.classList.add(item.sender === "user" ? "user-message" : "bot-message");
              messageDiv.textContent = `${item.message}`;
              chatBody.appendChild(messageDiv); // Adicionar mensagens ao final
            });
      
            // Ajustar o scroll para o final após adicionar mensagens
            // chatBody.scrollTop = chatBody.scrollHeight;
      
            messagesPage++;
          } catch (err) {
            console.error("Erro ao carregar mensagens:", err);
          } finally {
            messagesLoading = false;
            loader.style.display = "none";
          }
        }
      
        // Evento para carregar mais mensagens ao rolar para cima
        chatBody.addEventListener("scroll", () => {
          if (chatBody.scrollTop <= 50) {
            fetchMessages();
          }
        });
      
        // Carregar as primeiras mensagens
        await fetchMessages();
      }
    
      // Função para enviar mensagem ao servidor
      async function sendMessageToServer(message) {
        const response = await fetch("/pt/api/send-message/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            'X-CSRFToken': csrftoken,
          },
          body: JSON.stringify({ message: message, id: id }),
        });
        const data = await response.json();
        return data.response;
      }
    
      // Funções de envio de mensagem
      async function handleSendMessage() {
        const userMessage = chatInput.value.trim();
        if (userMessage) {
          appendMessage(userMessage, "user-message");
          chatInput.value = "";
          chatBody.scrollTop = chatBody.scrollHeight;
    
          typingIndicator.style.display = "block";
    
          // Espera pela resposta do bot
          const botResponse = await sendMessageToServer(userMessage);
          typingIndicator.style.display = "none";
          appendMessage(botResponse, "bot-message");
        }
      }
    
      // Eventos de interação do usuário
      sendMessageButton.addEventListener("click", handleSendMessage);
      chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault(); // Impede nova linha
          handleSendMessage();
        }
      });
    
      viewHistory.addEventListener("click", toggleHistoryVisibility);
      backToChat.addEventListener("click", backToChatVisibility);
    
      chatToggle.addEventListener("click", toggleChatVisibility);
      closeChat.addEventListener("click", closeChatVisibility);
    });
  }
  
  return {
    init: function() {
      init();
    }
  };

}();

chat_bot.init();




// fetch("mensagem_termos_troca",{
//   method:"POST",
//   headers: {
//     'Content-Type': 'application/json',
//     // 'X-CSRFToken': csrftoken,
//   },
//   body:JSON.stringify({
//     campanha: '9',
//     entidade: '275332',
//     mensagem: 'teste oloa {Cliente}, {Campanha}, {limite_campanha}, {link_curto_bm}, {token_bm}'
//   })
// })
// .then(res=>res.json())
// .then(data=>{
//   console.log(data)
// })




function notifications(){
  let ul = document.getElementById('notifications_aprove');
  let number = document.getElementById('notifications_number');
  let loader = document.getElementById("loader-notifi")
  if(ul){
    ul.innerHTML='';
    number.innerText = '';
    loader.style.display = 'block';
    fetch('/pt/api/create-empresa/get_empresas_block/')
    .then(res=>res.json())
    .then(data=>{
      if(data.length > 0){
        let row = '';
        for(let i=0; i<data.length; i++){
          row += `
          <li>
            <div class="media">
            <div class="notification-img bg-light-info"><img width="30" src="/static/assets/images/predio-comercial.png"
                        alt=""></div>
              <div class="media-body">
                <h5> <a class="f-14 m-0" href="#">${data[i].empresa}</a></h5>
                <p>${data[i].cnpj}</p>
              </div>
              <div class="notification-right"><a href="#" style="color:green;" onclick="aprove_empresa(${data[i].id}, 'aprove');"><i data-feather="check"></i></a></div>
              <div class="notification-right"><a href="#" onclick="aprove_empresa(${data[i].id}, 'desaprove');"><i data-feather="x"></i></a></div>
            </div>
          </li>
          `;
        }
        ul.innerHTML = row + '<li class="p-0"><a class="btn btn-primary" href="#">Aprovar todos</a></li>';
        number.innerText = data.length;
        feather.replace();
        loader.style.display = 'none';
      }else{
        loader.style.display = 'none';
      }
    });
  }
}
notifications();

