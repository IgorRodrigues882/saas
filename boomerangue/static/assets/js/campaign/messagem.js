// const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
// // Extrai o valor do csrftoken do cookie
// const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;

// Função atualiza tabela
function atualiza_tabela_msgs(){
  $(".loading-indicator-message").hide();
      loader_message.style.display='block';
      div_message.innerHTML=''
      
      // O campo de pesquisa foi apagado
    // Faça uma requisição para buscar as opções que estavam antes aqui
    fetch(`/pt/api/retorna_nome_mensagens/?id=${$("#id_campanha").data('id')}`)
    .then(response => response.json())
    .then(data => {
      if(data){
        console.log(data)
        var pill = []
        for(let i = 0; i<data.length; i++){
            
        if(data[i].uso_template == 'OPTIN'){
            var badge = 'warning'
        }
        else{
            var badge = 'success'
        }

          pill += `
          <tr>
          <td>
            <div class="media">
              <div class="square-box me-2"><i class="fa fa-comment-o txt-success"></i></div>
              <div class="ps-2">
                <h6>${data[i].template_name}</h6>
            </div>
          </td>
          <td class="img-content-box">
            <h6>${data[i].categoria}</h6>
          </td>
          <td class="img-content-box">
            <h6><span class=" text-white badge badge-${badge}">${data[i].uso_template}</span></h6>
          </td>
          <td>
            <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown"
                    aria-haspopup="true" aria-expanded="false">Opções</button>
                  <div class="dropdown-menu">
                    <a class="dropdown-item"
                      href="#" onclick="deleteMensagem(${data[i].id})">Excluir</a>
                      <a class="dropdown-item"
                      href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#criar_campanha_mensagem" onclick="edit_template_mensagem(${data[i].id})">Editar</a>
                      <a class="dropdown-item"
                      href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#ver_componentes"  onclick="ver_componentes(${data[i].wpp_id})">Ver Componentes</a>
                  </div>
          </td>
        </tr>
          `
        }
        div_message.innerHTML = pill
        loader_message.style.display = 'none';
        recarregamessage = true;
      }
    })
    .catch(error => {
      swal({
        text: "Ocorreu um erro ao tentar buscar dados!" ,
        icon: "error",
        buttonsStyling: false,
        confirmButtonText: "Ok",
        customClass: {
            confirmButton: "btn btn-primary"
        }
    });
    });
}

let pagemessagem = 2;  // Comece na segunda página, pois a primeira já foi carregada
let recarregamessage = true;
const div_message = document.getElementById('body_mensagens');
let loading_message = false; // Flag para evitar solicitações simultâneas
var loader_message = document.getElementById('loader-message')
    function loadMoreItemsMessage() {
        if (loading_message){
            loader_message.style.display = 'block';
            return; // Evitar solicitações simultâneas
        }

        
        loader_message.style.display = 'none'
        // Marcar que estamos carregando itens
        loading_message = true;
        fetch(`/pt/load_more_messages_campanhas/?page=${pagemessagem}&id=${$("#id_campanha").data('id')}`)
            .then(response => response.json())
            .then(data => {
                console.log(data)
                const items = data.items;
                if (items.length > 0) {
                    var pill = []
                    items.forEach(itemData => {
                      if(itemData.usotemplate == 'OPTIN'){
                            var badge = 'warning'
                        }
                        else{
                            var badge = 'success'
                        }
                        pill += `
                        <tr>
                        <td>
                          <div class="media">
                            <div class="square-box me-2"><i class="fa fa-comment-o txt-success"></i></div>
                            <div class="ps-2">
                              <h6>${itemData.template_name}</h6>
                          </div>
                        </td>
                        <td class="img-content-box">
                          <h6>${itemData.categoria}</h6>
                        </td>
                        <td class="img-content-box">
                          <h6><span class=" text-white badge badge-${badge}">${itemData.usotemplate}</span></h6>
                        </td>
                        <td>
                          <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown"
                                  aria-haspopup="true" aria-expanded="false">Opções</button>
                                <div class="dropdown-menu">
                                  <a class="dropdown-item"
                                    href="#" onclick="deleteMensagem(${itemData.pk})">Excluir</a>
                                    <a class="dropdown-item"
                                    href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#criar_campanha_mensagem" onclick="edit_template_mensagem(${itemData.pk})">Editar</a>
                                    <a class="dropdown-item"
                                    href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#ver_componentes"  onclick="ver_componentes(${itemData.wpptemplate_id})">Ver Componentes</a>
                                </div>
                        </td>
                      </tr>
                        
                        `
                      
                    });
                    div_message.innerHTML += pill
                    pagemessagem++;
                }
            })
            .catch(error => {
                console.error('Erro ao carregar mais itens:', error);
            }).finally(() => {
                // Marcar que terminamos de carregar
                loading_message = false;
                loader_message.style.display = 'none';
                recarregamessage= true
            });
    }

    // window.addEventListener('scroll', () => {
    //     if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && recarregamessage == true && verifica_pagina == 'Mensagens') {
    //       loadMoreItemsMessage();
    //     }
    // });



(function ($) {
  var bestPictures = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace("value"),
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    prefetch: "",
    remote: {
      url: `/pt/api/retorna_nome_mensagens/?query=%QUERY&id=${$("#id_campanha").data('id')}`,
      wildcard: "%QUERY",
      filter: function (response) {
        console.log(response)
        return response; // Assumindo que a API retorna a lista diretamente
      }
    }
  });

  $("#remote-message .typeahead").on('typeahead:asyncrequest', function () {
    // Mostrar indicador de carregamento
    $(".loading-indicator-message").show();
  });

  $("#remote-message .typeahead").on('typeahead:asyncreceive', function () {
    // Esconder indicador de carregamento
    $(".loading-indicator-message").hide();
  });

  $("#remote-message .typeahead").typeahead(null, {
    name: "",
    display: 'template_name',
    source: bestPictures
  }).on('typeahead:selected', function (e, datum) {
    loader_message.style.display='block';
    div_message.innerHTML=''
    
    // Aqui você pode acessar o ID do item selecionado como datum.id
    var selectedId = datum.id;
    console.log(datum)
    fetch(`/pt/api/bmm_campanhas_msgs/${selectedId}/`)
      .then(response => response.json())
      .then(data => {
        console.log(data)
        if(data.id){
            if(data.usotemplate == 'OPTIN'){
                var badge = 'warning'
            }
            else{
                var badge = 'success'
            }
          div_message.innerHTML = `
          <tr>
          <td>
            <div class="media">
              <div class="square-box me-2"><i class="fa fa-comment-o txt-success"></i></div>
              <div class="ps-2">
                <h6>${data.wpptemplate.template_name}</h6>
            </div>
          </td>
          <td class="img-content-box">
            <h6>${data.wpptemplate.category}</h6>
          </td>
          <td class="img-content-box">
            <h6><span class=" text-white badge badge-${badge}">${data.usotemplate}</span></h6>
          </td>
          <td>
            <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown"
                    aria-haspopup="true" aria-expanded="false">Opções</button>
                  <div class="dropdown-menu">
                    <a class="dropdown-item"
                      href="#" onclick="deleteMensagem(${data.id})">Excluir</a>
                      <a class="dropdown-item"
                      href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#criar_campanha_mensagem" onclick="edit_template_mensagem(${data.id})">Editar</a>
                      <a class="dropdown-item"
                      href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#ver_componentes"  onclick="ver_componentes(${data.wpptemplate.id})">Ver Componentes</a>
                  </div>
          </td>
        </tr>
          `
          loader_message.style.display='none';
          recarregamessage = false;
          // recarrega = false;
        }
        
      })
      .catch(error => {
        console.error('Erro ao buscar dados:', error);
      });
  })

  $("#remote-message .typeahead").on('input', function() {
    if ($(this).val() === ''){
      atualiza_tabela_msgs()
    }
  });

})(jQuery);


function criarCampanhaMessages(campanha_id) {
  let form_create = document.querySelector('#create_form');
  form_create.classList.add('was-validated');

  if($("#salvar_campanha_mensagem").data('id') == 'new'){
    var method = "POST"
    var url = '/pt/api/bmm_campanhas_msgs/'
  }
  else{
    var method = 'PATCH'
    var url = `/pt/api/bmm_campanhas_msgs/${$("#salvar_campanha_mensagem").data('id')}/`
  }

  if (!form_create.checkValidity()) {
    swal.fire({
        title: "Houve um erro",
        text: "Verifique os campos digitados. Se não houver opções de Whatsapp Template, todas já estão vinculadas a essa campanha.",
        icon: "error",
        buttonsStyling: false,
        confirmButtonText: "Ok",
        customClass: {
            confirmButton: "btn btn-primary"
        }
    });
  }
  else {    
    let data = {
      "campanha": campanha_id,
      "wpptemplate": document.querySelector('[name="wpptemplate"]').value,
      "usotemplate": document.querySelector('[name="usotemplate"]').value
    }
    
    fetch(url, {
      method: method,
      headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
      },
      body: JSON.stringify(data)
    })
    .then(res => {
      if (!res.ok) {
        Swal.fire({
          title: "Erro",
          text: "Houve um erro ao tentar criar a mensagem da campanha!",
          icon: "error",
          button: "OK",
        });
      }
      return res.json()
    })
    .then(data => {
      if (data.id) {
        Swal.fire({
          icon: 'success',
          title: 'Mensagem da campanha salva!',
          showConfirmButton: false,
          timer: 1500
        }).then(
          window.location.reload()
        )
      }
      else if(data.error){
        Swal.fire({
          title: "Erro",
          text: data.error,
          icon: "error",
          button: "OK",
        })
      }
      else{
        Swal.fire({
          title: "Erro",
          text: data,
          icon: "error",
          button: "OK",
        })
      }
    })
  }
}

function deleteMensagem(index){
  Swal.fire({
    title: "Tem certeza?",
    text: "Tem certeza que deseja excluir esse Template mensagem?",
    icon: "warning",
    showCancelButton: true, // Mostra o botão de cancelar
    confirmButtonText: 'Sim', // Texto do botão de confirmação
    cancelButtonText: 'Não', // Texto do botão de cancelar
    reverseButtons: true, // Inverte a ordem dos botões se necessário
    dangerMode: true // Estilo de botão de perigo para o botão de confirmação
}).then((willDelete) => {
    if (willDelete.value) {
      fetch(`/pt/api/bmm_campanhas_msgs/${index}/`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
      }).then(response => {
        if (response.status === 204) {
          Swal.fire({
            icon: 'success',
            title: 'Template Mensagem Excluido!',
            buttons: false,
            timer: 1500
          }).then(
            window.location.reload()
          )
        }
        else {
          Swal.fire({
            title: "Erro",
            text: "Houve um erro ao tentar excluir!",
            icon: "error",
            button: "OK",
          });
        }
      }).catch(error => {
        console.error('Erro ao enviar a solicitação:', error);
      });

    }
  })
}

function edit_template_mensagem(index){
  $("#salvar_campanha_mensagem").data('id',index)
  Swal.fire({
    title: 'Aguarde...',
    allowOutsideClick: false, // Impede cliques fora do alerta
    allowEscapeKey: false,    // Impede o uso da tecla Esc
    allowEnterKey: false,     // Impede o uso da tecla Enter
    showConfirmButton: false, // Não mostra o botão de confirmação
    onBeforeOpen: () => {     // Função chamada antes de abrir o alerta
        Swal.showLoading()    // Mostra o indicador de carregamento
    }
});

  fetch(`/pt/api/bmm_campanhas_msgs/${index}/`)
      .then(response => response.json())
      .then(data => {
        if(data.id){
          $("#select_wpp_templates").val(data.wpptemplate.id).trigger('change')
          $("#usotemplate").val(data.usotemplate).trigger('change')
          swal.close();
        }
        
      })
      .catch(error => {
        console.error('Erro ao buscar dados:', error);
      });
}

$("#criar_template_mensagem_btn").on('click',function(){
  $("#salvar_campanha_mensagem").data('id','new')
  $("#select_wpp_templates").val('').trigger('change')
  $("#usotemplate").val('OPTIN').trigger('change')
})


// Area componentes
function ver_componentes(index){
  document.getElementById('salvar_component').dataset.id = index
  Swal.fire({
    title: 'Aguarde...',
    allowOutsideClick: false, // Impede cliques fora do alerta
    allowEscapeKey: false,    // Impede o uso da tecla Esc
    allowEnterKey: false,     // Impede o uso da tecla Enter
    showConfirmButton: false, // Não mostra o botão de confirmação
    onBeforeOpen: () => {     // Função chamada antes de abrir o alerta
        Swal.showLoading()    // Mostra o indicador de carregamento
    }
});
  fetch(`/pt/api/wpp_templatescomponents_retorno/${index}/`,{
  }).then(response => response.json())
  .then(data => {
    if(data){
      var body = document.getElementById('body_componentes')
      // body.innerHTML=''
      var div = []
      console.log(data)
        let contentClass = "";
        for(let i = 0; i< data.length; i++){
          let image = ''
          if (data[i].component_type == "HEADER") {
            contentClass = "badge-primary";
          } else if (data[i].component_type == "BODY") {
            contentClass = "badge-secondary";
          } else if (data[i].component_type == "FOOTER") {
            contentClass = "badge-success";
          } else if (data[i].component_type == "BUTTONS") {
            contentClass = "badge-warning";
          } else if (data[i].component_type == "LIST") {
            contentClass = "badge-danger";
          }

          if(data[i].format == 'IMAGE'){
            image = `
              <div style="display:flex; justify-content:center; align-items:center; position: relative;">
              <div style="width: 120px; height:120px;">
                  <div class="sidebar-img-content">
                      <img class="img-fluid" src="${data[i].image_content}" alt="" style="object-fit: cover; width: 100%; height: 100%;">
                  </div>
              </div>
          </div>
            `
          }

          div +=`
          <a href='#'>
            <div class="col-12">
              <div class="card">
                <div class="media p-20">
                  <div class="media-body">
                    <h6 class="mt-0 mega-title-badge">${data[i].format}
                      <span class="badge ${contentClass} pull-right digits" data-id="${data[i].template}" data-tipo="${data[i].component_type}" id="span_componente_tipo_${data[i].id}">${data[i].component_type}</span>
                    </h6>
                    ${image}
                    <p style='color:black;' id="text_content_${data[i].id}">${data[i].text_content}</p>
                    <button class='btn btn-primary' onclick='habilitarEdicao(${data[i].id})'>Editar</button>
                    <button class='btn btn-info' onclick='salvarEdicao(${data[i].id})' style='display:none;'>Salvar</button>
                  </div>
                </div>
              </div>
            </div>
          </a>
        `;
        }
        body.innerHTML = div
        swal.close()
    }
  
  })
}
// Função para habilitar a edição
window.habilitarEdicao = function (id) {
  var textContentElement = document.getElementById(`text_content_${id}`);
  textContentElement.contentEditable = true;
  textContentElement.style.border = "1px solid #ccc";

  // Exibir o botão "Salvar"
  var salvarButton = document.querySelector(`button[onclick='salvarEdicao(${id})']`);
  salvarButton.style.display = 'inline';
};

// Função para salvar as edições
window.salvarEdicao = function (id) {
  var textContentElement = document.getElementById(`text_content_${id}`);
  var component_type = document.getElementById(`span_componente_tipo_${id}`)
  textContentElement.contentEditable = false;
  textContentElement.style.border = "none";
  fetch(`/pt/api/wpp_templatescomponents/${id}/`,{
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken,
    },
    body:JSON.stringify({
      template: component_type.dataset.id,
      component_type: component_type.dataset.tipo,
      text_content: textContentElement.innerText
    })
  }).then(response => response.json())
  .then(data => {
    if(data){
      console.log(data)
    }
  })

  // Ocultar o botão "Salvar"
  var salvarButton = document.querySelector(`button[onclick='salvarEdicao(${id})']`);
  salvarButton.style.display = 'none';
};


$("#save_bot_envio").on('click', function(){
  Swal.fire({
    title: 'Tem certeza que deseja iniciar essa campanha?',
    text: "Se o arquivo da campanha tiver menos que 500 registros os envios começarão imediatamente",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sim, faça isso!',
    cancelButtonText: 'Não, cancele!'
  }).then((result) => {
    if (result.isConfirmed) {
      let id = $("#select_bot").val()
      if (id == ''){
        Swal.fire({
          title: "Erro",
          text: "Escolha um bot",
          icon: "error",
          button: "OK",
        })
        return
      }
      let data = new FormData;
      data.append('bot_id', id)
      data.append("status_campanha", 'EA');
      data.append('ultimo_cnpj_processado', '')
      fetch(`/pt/api/campanhas/${$("#id_campanha").data('id')}/`,{
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
        if(data.id){
          init_envio($("#id_campanha").data('id'))
        }
        else{
          Swal.fire({
            title: "Erro",
            text: data.error,
            icon: "error",
            button: "OK",
          })
        }
      })
    }
  })
})

$("#novo_wpp_template").on('click', function(){
  $('#criar_campanha_mensagem').modal('hide');
})

$("#save_wpp_template_new").on('click', function(){
  Swal.fire({
    icon: 'info', // Altere para "info" ou qualquer outro ícone conforme sua preferência
    title: '<b>Carregando...</b><br/>', // Adicione um GIF de carregamento aqui
    showConfirmButton: false,
    willOpen: () => {
      Swal.showLoading(); // Mostra o loader antes do conteúdo ser renderizado
    },
    allowOutsideClick: false, // Impede cliques no fundo durante o carregamento
  })
  const data = {
    template_name: $(".template_name").val() || null,
    category:$(".category").val() || null,
    language:$(".language").val() || null,
    // Outros campos e valores aqui...
  };
  fetch('/pt/api/wpp_templates/',{
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        'X-CSRFToken': csrftoken,
    },
    body: JSON.stringify(data),
  }).then((response) => response.json())
  .then((data) => {
    console.log(data)
    if(data.id){
      let dados = {
      "campanha": $("#id_campanha").data('id'),
      "wpptemplate": data.id,
      "usotemplate": $("#usotemplate_new").val()
      }
      fetch('/pt/api/bmm_campanhas_msgs/',{
        method:'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
      },
      body: JSON.stringify(dados)
      })
      .then(res=>res.json())
      .then(resp=>{
        if(resp.id){
          Swal.fire({
            icon: 'success',
            title: 'Template criado',
            buttons: false,
            timer: 1500
          })
          atualiza_tabela_msgs()
        }
        else{
          swal({
            text: "Ocorreu um erro ao tentar salvar" ,
            icon: "error",
            buttonsStyling: false,
            confirmButtonText: "Ok",
            customClass: {
                confirmButton: "btn btn-primary"
            }
        });
        }
      })
    }
    else{
        swal({
            text: "Ocorreu um erro ao tentar salvar" ,
            icon: "error",
            buttonsStyling: false,
            confirmButtonText: "Ok",
            customClass: {
                confirmButton: "btn btn-primary"
            }
        });
    }
    
  })
})

var id_template;
var method;
var url = '';


$(".format").on('change', function(e){
  if(e.target.value == 'TEXT'){
    // Mostra a textarea e oculta a dropzone
    $("#text_area_wpp").removeClass('d-none').addClass('d-block d-sm-flex');
    $("#title_textarea").text('Texto (Mensagem que será enviada pelo whatsapp)')
    $("#dropzone_wpp_image").removeClass('d-block d-sm-flex').addClass('d-none');
  } else if(e.target.value == 'IMAGE') {
    // Mostra a dropzone e oculta a textarea
    $("#dropzone_wpp_image").removeClass('d-none').addClass('d-block d-sm-flex');
    $("#title_textarea").text('Legenda Imagem')
  }
})

function add_termo_text(termo) {
  var doc = simplemde.codemirror.getDoc();
  var cursor = doc.getCursor(); // Obtenha a posição do cursor
  doc.replaceRange(termo, cursor); // Insira o termo na posição do cursor
}

function add_component(){
  $(".component_type").val('').trigger('change')
  $(".format").val('').trigger('change')
  simplemde.value('');
  id_template = document.getElementById('salvar_component').dataset.id;
  url = '/pt/api/wpp_templatescomponents/'
  method = 'POST'
}

"use strict";
var create_component = function(){

    var forms;
    var init = function(){
      Dropzone.options.wppimage = {
        paramName: "wppimage",
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
                var removeButton = Dropzone.createElement("<button class='dz-remove'>Remover imagem</button>");
                
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
        }
        };
        var validation = Array.prototype.filter.call(forms, function(form) {
            form.addEventListener('submit', function(event) {
                if (form.checkValidity() === false) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                else{
                    event.preventDefault();
                    event.stopPropagation();
                    fetchApi();

                }
                form.classList.add('was-validated');
            }, false);
        });
        function fetchApi (){
          console.log(method, url, id_template)
          
            console.log($(".text_content").val())
            const dropzone = Dropzone.forElement("#wppimage");
            var data = new FormData();
            data.append("template", id_template);
            data.append("component_type", $(".component_type").val() || '');
            data.append("format", $(".format").val() || '');
            data.append("text_content", $(".text_content").val() || '');
            data.append("image_content", dropzone.getQueuedFiles()[0] || '');
            
              console.log('AJAJHAJAJAJ', data)
              if($(".component_type").val() == "" || $(".format").val() == ""){
                swal({
                  text: "Preencha todos os campos" ,
                  icon: "error",
                  buttonsStyling: false,
                  confirmButtonText: "Ok",
                  customClass: {
                      confirmButton: "btn btn-primary"
                  }
                  
              });
              return;
              }
              fetch(url,{
                method: method,
                headers: {
                    // "Content-Type": "application/json",
                    'X-CSRFToken': csrftoken,
                },
                body: data,
              }).then((response) => response.json())
              .then((data) => {
                console.log(data)
                if(data.id){
                    
                  new swal({
                        icon: 'success',
                        title: 'Salvo com sucesso!',
                        showConfirmButton: false,
                        timer: 1500
                      }).then(
                        activeDiv(id_template)
                            // window.location.reload()
                      )

                      
                }
                else if(data == 'Item with this characteristic already exists.'){
                    new swal({
                        text: "Um item com esse componente já existe nesse Template" ,
                        icon: "error",
                        buttonsStyling: false,
                        confirmButtonText: "Ok",
                        customClass: {
                            confirmButton: "btn btn-primary"
                        }
                    });
                }
                else{
                 new swal({
                    text: "Ocorreu um erro ao tentar salvar!" ,
                    icon: "error",
                    buttonsStyling: false,
                    confirmButtonText: "Ok",
                    customClass: {
                        confirmButton: "btn btn-primary"
                    }
                });
                }
                
              })
        }

    }
    return {
        init: function() {
            forms = document.getElementsByClassName('needs-validation2');
            init();
        }
    };
}()

create_component.init();
