// Seleciona o botão do emoji e o campo de texto
const emojiButton = document.getElementById('emoji-button');
const messageInput = document.getElementById('message-to-send');

// Cria o Emoji Mart picker
const picker = new EmojiMart.Picker({
  onEmojiSelect: (emoji) => {
    messageInput.value += emoji.native;  // Adiciona o emoji ao campo de texto
  },
  theme: 'light',  // Você pode escolher 'dark' também
});

// Variável para controlar se o picker está visível
let pickerVisible = false;

// Função para exibir o picker
function showPicker() {
  if (!pickerVisible) {
    document.body.appendChild(picker);  // Adiciona o picker ao corpo da página
    picker.style.position = 'absolute';
    picker.style.top = `${emojiButton.getBoundingClientRect().top - picker.offsetHeight}px`;  // Aparece acima do botão
    picker.style.left = `${emojiButton.getBoundingClientRect().left}px`;
    pickerVisible = true;
  }
}

// Função para ocultar o picker
function hidePicker() {
  if (pickerVisible) {
    document.body.removeChild(picker);
    pickerVisible = false;
  }
}

// Exibe o picker quando o botão de emoji é clicado
emojiButton.addEventListener('click', (event) => {
  event.stopPropagation();  // Evita que o clique feche o picker
  if (pickerVisible) {
    hidePicker();  // Se já está visível, oculta
  } else {
    showPicker();  // Caso contrário, exibe
  }
});

// Fecha o picker ao clicar fora dele
document.addEventListener('click', (event) => {
  if (pickerVisible && !picker.contains(event.target) && !emojiButton.contains(event.target)) {
    hidePicker();
  }
});
"use strict";
const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;



var mensagens = function(){
 
    var div_menu;
    var loader;
    let pagination_users = 1;
    let pagination_messages = 1;
    let loading = false;
    let id_users;
    let carregando_user = false
    let isLoaded = false;
    let primeira = 0;
    var init = function(){



        function gera_lista_user(index) {
            let rowsHTML = ''; // String para construir HTML
            console.log(index);
            // Verifica se index é um objeto único e não um array, e o converte para um array
            if (!Array.isArray(index)) {
                index = [index];
            }
            for(let i = 0; i < index.length; i++){
                primeira += i 
                let identificador = ''
                let entidade = ''
                if (index[i].nome){
                    identificador = index[i].entidade_id
                    entidade = index[i].nome
                }
                else{
                    identificador = index[i].telefone
                    entidade = index[i].telefone
                }
                rowsHTML += `
                    <a  class="contact-tab-${identificador} nav-link ${ primeira == 0 ? 'active' : '' }" id="v-pills-user-tab" data-bs-toggle="pill" onclick="mensagens.reseta_pag(${identificador}, '${entidade}'), mensagens.activeDiv(${identificador})"
                        href="#v-pills-user" role="tab" aria-controls="v-pills-user" aria-selected="true">
                        <li class="clearfix">
                            <div class="media"><img class="rounded-circle user-image" src="/static/assets/images/user/1.jpg"
                                alt="">
                            <div class="status-circle away"></div>
                            <div class="media-body">
                                <div class="about">
                                <div class="name" id='nome_lead'>${entidade}</div>
                                <div class="status ultima_mensagem">${index[i].ultima_mensagem}</div>
                                </div>
                            </div>
                            <label class="badge badge-light-primary" id='qtd_messages'>${index[i].msgs_nao_lidas || ''}</label>
                            </div>
                        </li>
                    </a>
                </div>
                `;
                if (primeira == 0){
                    mensagens.reseta_pag(identificador, `${entidade}`)
                    mensagens.activeDiv(identificador)
                }
            }
      
            console.log('html', rowsHTML);
            return rowsHTML; // Definir HTML de uma vez
        }




        function carrega_mensagens(){
            if(carregando_user) return;
            carregando_user = true
            loader.style.display = 'block';
            var data = {
                'campanha': $("#id_campanha").val(),
                'query': $("#lead_pesquisar").val(),
                'user_canal': $("#filtragem_canais_user").val(),
                'user': $(".js-example-basic-single").data('user')
            };
            fetch(`/pt/api/msg_message/retorna_mensagens_usuarios/?page=${pagination_users}`, {  // Substitua pela URL da sua API
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                },
                body: JSON.stringify(data)
            }).then(res => res.json())
            .then(data => {
                console.log(data)
                if(data.results){
                    if(data.results.length > 0){
                        div_menu.innerHTML += gera_lista_user(data.results);
                        pagination_users += 1;
                        
                    }
                    else{
                    console.log('jfvhj')
                    }
                }
                carregando_user = false
            })
            .finally(()=>{
              loader.style.display = 'none';
              
              Swal.close()
              fetch_websocket()
            })
        }

        document.querySelector('.list-container').addEventListener('scroll', function() {
            if (this.scrollTop + this.clientHeight >= this.scrollHeight){
                setTimeout(()=>{
                    carrega_mensagens()
                }, 2000)
              }
            });

        
        carrega_mensagens()

        function change_campanha(){
            pagination_users = 1
            div_menu.innerHTML = ''
            carrega_mensagens()
        }

        $("#id_campanha").on('change', function(){
            change_campanha()
        })

        $("#lead_pesquisar").on("keydown", function (event) {
            // Verifica se a tecla pressionada foi "Enter"
            if (event.key === "Enter") {
                event.preventDefault(); // Evita o comportamento padrão, se necessário
                const query = $(this).val().trim(); // Obtém o valor do input sem espaços extras
    
                // Verifica se o campo não está vazio antes de executar a ação
                if (query) {
                    change_campanha()
                    // Substitua esta linha pela ação desejada
                } else {
                    console.log("Digite algo antes de pressionar Enter.");
                }
            }
        });


        $("#filtragem_canais_user").on('change', function() {
            const selectedOption = $(this).find('option:selected'); // Obtém a opção selecionada
            
            // Verifica se é um usuário ou canal, usando o atributo data-user
            const isUser = selectedOption.data('user');
            
            if (isUser) {
                // Se for usuário, define o data como 'True'
                $("#filtragem_canais_user").data('user', 'True');
            } else {
                // Se não for usuário, remove o atributo data 'user'
                $("#filtragem_canais_user").removeData('user');
            }
            change_campanha()
        });




        var bestPictures = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.obj.whitespace("value"),
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            prefetch: "",
            remote: {
              url: `api/create-entidade/busca/?query=%QUERY`,
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
              name: "Entidade",
              display: 'Entidade',
              limit: 15,
              source: bestPictures
          }).on('typeahead:selected', function (e, datum) {
              change_campanha()
          })
        
          $("#remote-message .typeahead").on('input', function() {
            if ($(this).val() === ''){
                change_campanha()
                $(".loading-indicator-message").hide();
            }
          });

        // function getContrastYIQ(hexcolor) {
        //     hexcolor = hexcolor.replace("#", "");
        //     const r = parseInt(hexcolor.substr(0, 2), 16);
        //     const g = parseInt(hexcolor.substr(2, 2), 16);
        //     const b = parseInt(hexcolor.substr(4, 2), 16);
        //     const yiq = (r * 299 + g * 587 + b * 114) / 1000;
        //     return yiq >= 128 ? 'black' : 'white';
        // }

        // function adjustTextColor() {
        //     const parent = document.getElementById("v-pills-user-tab");
        //     const text = document.getElementById("nome_lead");
        //     const backgroundColor = window.getComputedStyle(parent).backgroundColor;

        //     // Convert RGB color to HEX format
        //     const rgb = backgroundColor.match(/\d+/g).map(Number);
        //     const hexColor = rgbToHex(rgb[0], rgb[1], rgb[2]);

        //     // Get the appropriate text color based on contrast
        //     const textColor = getContrastYIQ(hexColor);
        //     text.style.color = textColor;

        // }

        // function rgbToHex(r, g, b) {
        //     return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
        // }

        // adjustTextColor()
    
    }



    function formatarDataBmm(dataString) {
        // Criar um objeto Date a partir da string de data ISO
        if(dataString){
            var data = new Date(dataString);
            // Obter os componentes da data
            var dia = data.getDate().toString().padStart(2, '0');
            var mes = (data.getMonth() + 1).toString().padStart(2, '0'); // getMonth() retorna um valor de 0 a 11
            var ano = data.getFullYear();
  
            // Montar a string formatada
            return `${dia}/${mes}/${ano}`;
        } else {
            return '-';
        }
    }

    function gera_chats(index) {
        let rowsHTML = ''; // String para construir HTML
        // Verifica se index é um objeto único e não um array, e o converte para um array
        if (!Array.isArray(index)) {
            index = [index];
        }
        console.log(index)
        for(let i = index.length - 1; i >= 0; i--){
            let div_anexo = '';
            let sender  = index[i].direcao == 'I' ? $("#nome_user_msgs").text() : 'Bot';
            let direction =  index[i].direcao == 'I' ? "float-start" : 'float-end';
            let from = index[i].direcao == 'I' ? "my-message" : 'other-message pull-right';
            let classe = index[i].direcao == 'I' ? "" : 'clearfix';
            if(index[i].complemento1 == 'image' || index[i].evento2 == 'img'){
                div_anexo = `
                <figure class="inner-img ms-3" itemprop="associatedMedia" itemscope=""><a
                                href="${index[i].URL_Anexo}" target="_blank" itemprop="contentUrl"
                                data-size="1000x1000"><img class="img-fluid img-80"
                                    src="${index[i].URL_Anexo}" itemprop="thumbnail"
                                    alt="Image description"></a>
                                <figcaption itemprop="caption description"></figcaption>
                            </figure>
                `;
            }
            else if(index[i].complemento1 == 'document' || index[i].evento2 == 'doc'){
                div_anexo = `
                    <a href="${index[i].URL_Anexo}" target="_blank">${index[i].nome_anexo || "Anexo"}</a></br>
                `;
            }
  
            rowsHTML += `
                <li class="${classe}">
                    <div class="message ${from}"><img class="rounded-circle ${direction} chat-user-img img-30"
                        src="/static/assets/images/user/3.png" alt=""><p style='color: black;'>${sender}</p>
                        <div class="message-data text-end"><span class="message-data-time">${formatarDataBmm(index[i].DataHoraDoEvento)}</span></div>
                        ${div_anexo}
                        ${index[i].MensagemTexto}
                    </div>
                </li>
            `;
        }
        return rowsHTML; // Definir HTML de uma vez
    }



      



    function activeDiv(id, append = false){
        console.log("entrou aqui");
        let tbody = document.getElementById('tbody_msgs');
        document.querySelector('#chat-atual-id').value = id;
        const chatBox = document.querySelector('.chat-msg-box');
        let loadingAnimation = document.getElementById('loader_mensagens_');
        if (loading) return;
        loading = true;
  
        if (append) {
            loadingAnimation.style.display = 'block';
        }
        const initialScrollHeight = chatBox.scrollHeight;
        console.log(initialScrollHeight);
        const initialScrollTop = chatBox.scrollTop;
        fetch(`/pt/api/msg_message/retorna_mensagens/?page=${pagination_messages}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({
                campanha: $("#id_campanha").val(),
                entidade: id
            })
        })
        .then(response => response.json())
        .then(data => {
            if (append) {
                tbody.innerHTML = gera_chats(data.results) + tbody.innerHTML;
                chatBox.scrollTop = chatBox.scrollHeight - initialScrollHeight + initialScrollTop;
            } else {
                tbody.innerHTML = gera_chats(data.results); // Scroll to bottom initially
                chatBox.scrollTop = initialScrollHeight;
                console.log(chatBox.scrollTop);
            }
  
            if (data.results.length > 0) {
              pagination_messages++;
          }
            loading = false;
        })
        .catch(error => {
            console.error('Error:', error);
            loading = false;
        })
        .finally(() => {
            loadingAnimation.style.display = 'none';
        });
    }

    document.querySelector('.chat-msg-box').addEventListener('scroll', function() {
        if (this.scrollTop === 0 && !loading) {
  
            activeDiv(id_users, true);
        }
    });

    document.querySelector('.chat-msg-box').addEventListener('scroll', function() {
        if (this.scrollTop + this.clientHeight >= this.scrollHeight){
            atualiza_msg_lida(id_users)
          }
        });

    function atualiza_msg_lida(id){
        const messageData = {
            'campanha':$("#id_campanha").val(),
            'entidade': id
          };
  
          console.log("DADOS", messageData)
      
          fetch('/pt/api/msg_message/atualiza_msg_lida/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrftoken, // Certifique-se de que o token CSRF está configurado corretamente
            },
            body: JSON.stringify(messageData)
          })
          .then(res=>res.json())
          .then(data=>{
            if (data.detail){
                let div = document.querySelector(`.contact-tab-${id}`);
                let label = div.querySelector('.badge.badge-light-primary');
                if (label) {
                    label.innerText = ''; // ou você pode definir o valor desejado aqui
                }
            }
          })
    }
    
    function reseta_pag(id, name){
        console.log(name)
        $("#nome_user_msgs").text(name)
        let loadingAnimation = document.getElementById('loader_mensagens_');
        loadingAnimation.style.display='block';
        let tbody = document.getElementById('tbody_msgs');
        tbody.innerHTML = ''
        pagination_messages = 1;
        id_users = id;
  
    }

    $("#send-message").on('click',function(){
        sendMessage('chat')
    })

    $("#message-to-send").on('keydown', function(event) {
        // Verifica se a tecla pressionada é "Enter" (código 13)
        if (event.key === 'Enter' || event.keyCode === 13) {
            event.preventDefault(); // Evita que o "Enter" insira uma nova linha
            sendMessage('chat');
        }
    });

    $("#enviar_agendamento").on('click', function(){
        sendMessage('agendamento');
    })


    $("#info-transferir-tab").on('click', function(){
        carrega_canais_usuarios()
    })

    $("#open-menu").on('click', function(){
        carrega_canais_usuarios()
    })

    function gera_lista_users(index){
        let rowsHTML = ''; // String para construir HTML
        // Verifica se index é um objeto único e não um array, e o converte para um array
        if (!Array.isArray(index)) {
            index = [index];
        }
        console.log(index)
        for(let i = 0; i < index.length; i++){
            
            rowsHTML += `
                <label class="d-flex" for="chk-ani${i}">
                        <input class="checkbox_animated checkbox_animated_users" id="chk-ani${i}" type="checkbox" data-id="${index[i].id}">
                        <div class="name">${index[i].Nome}</div>
                        ${index[i].user_logado ? '<span class="">(Você mesmo)</span>' : ''}
                </label>
            `;
        }
        return rowsHTML; // Definir HTML de uma vez
    }


    function gera_lista_canais(index){
        let rowsHTML = ''; // String para construir HTML
        // Verifica se index é um objeto único e não um array, e o converte para um array
        if (!Array.isArray(index)) {
            index = [index];
        }
        console.log(index)
        for(let i = 0; i < index.length; i++){
            
            rowsHTML += `
                <label class="d-flex" for="chk-ani-canais${i}">
                        <input class="checkbox_animated checkbox_animated_canais" id="chk-ani-canais${i}" type="checkbox" data-id="${index[i].id}">
                        <div class="name">${index[i].canal_nome}</div>
                </label>
            `;
        }
        return rowsHTML; // Definir HTML de uma vez
    }


    $("#save-canal").on("click", function(){
        $("#status_salvamento").addClass('badge badge-warning').text("Salvando...")
        let data = {
            "canal_nome": $("#nome_canal").val(),
            "empresa": logo_empresa
        }
        fetch("api/canais/",{
            method:'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken, // Certifique-se de que o token CSRF está configurado corretamente
              },
            body:JSON.stringify(data)
        })
        .then(res=>res.json())
        .then(data=>{
            if(data.id){
                $("#status_salvamento").removeClass('badge badge-warning')
                $("#status_salvamento").addClass("badge badge-success").text("Salvo com sucesso!")
                const selectElement = $('.js-example-basic-single');
                selectElement.append(`<option value="${data.id}">${data.canal_nome}</option>`);
            }
        })
    })



    function carrega_canais_usuarios(){
        let list = document.getElementById('list_transferir')
        let canais_div = document.getElementById('canais_transferir')
        let loader_users = document.getElementById("loader_user_transferir")
        let loader_canais = document.getElementById("loader_canais")
        loader_users.style.display='block'
        loader_canais.style.display='block'
        list.innerHTML = ''
        canais_div.innerHTML = ''
        fetch("auth/users/get_users/")
        .then(res=>res.json())
        .then(data=>{
            if(data.length > 0){
                list.innerHTML = gera_lista_users(data)
            }
        })
        .finally(()=>{
            loader_users.style.display='none'
        })

        fetch("api/canais/get_canais/?verify=True")
        .then(res=>res.json())
        .then(data=>{
            if(data.length>0){
               canais_div.innerHTML = gera_lista_canais(data)
            }
        })
        .finally(()=>{
            loader_canais.style.display = 'none'
        })
    }


        // Função para carregar canais e usuários ao clicar no select
    $("#filtragem_canais_user").on('click', function() {
        const selectElement = $(this);

        if (isLoaded) return; // Se já carregado, não buscar novamente

        selectElement.html('<option>Carregando...</option>');

        // Fetch para buscar canais e usuários
        fetch('/api/canais/get_canais/')
        .then(response => response.json())
        .then(data => {
            selectElement.html('<option value="">Todas conversas</option>');

            if (data) {
                data.forEach(dados => {
                    if (dados.user_logado_id) {
                        selectElement.append(`<option value="${dados.user_logado_id}" data-user='true''>${dados.user_logado_username}</option>`);
                    } else {
                        selectElement.append(`<option value="${dados.id}">${dados.canal_nome}</option>`);
                    }
                });
            }

            isLoaded = true;  // Marcar como carregado
        })
        .catch((error) => {
            console.error('Erro ao carregar canais e usuários:', error);
            selectElement.html('<option value="">Erro ao carregar dados</option>');
        })
    });


    // Função para capturar checkboxes marcados e enviar via API
    $('#save-transferir').on('click', function() {
        // Captura os checkboxes marcados para usuários
        var selectedUsers = $('input.checkbox_animated_users:checked').map(function() {
            return $(this).data('id');
        }).get();

        // Captura os checkboxes marcados para canais
        var selectedChannels = $('input.checkbox_animated_canais:checked').map(function() {
            return $(this).data('id');
        }).get();
        
        $("#status_salvamento_transferir").addClass('badge badge-warning').text("Salvando...")

        // Cria o payload de dados para usuários
        if (selectedUsers.length > 0) {
            fetch('api/usuario_lead/', {
                method: 'POST', // ou 'PATCH' dependendo do que você deseja
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken // Se necessário o CSRF token
                },
                body: JSON.stringify({
                    usuarios: selectedUsers,  // Envia a lista de IDs dos usuários selecionados
                    lead_id: id_users
                })
            })
            .then(response => response.json())
            .then(data => {
                if(data.usuarios_criados.length>0){
                    $("#status_salvamento_transferir").removeClass('badge badge-warning')
                    $("#status_salvamento_transferir").addClass("badge badge-success").text("Tranferido para os usuários selecionados!")
                }
            })
            .catch(error => {
                console.error('Erro ao enviar usuários:', error);
            });
        }

        // Cria o payload de dados para canais
        if (selectedChannels.length > 0) {
            fetch('api/canais_leads/', {
                method: 'POST', // ou 'PATCH' dependendo do que você deseja
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken // Se necessário o CSRF token
                },
                body: JSON.stringify({
                    canais: selectedChannels,  // Envia a lista de IDs dos canais selecionados
                    lead_ids: [id_users]
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log("resultado criação", data)
                if(data.canais_criados.length>0){
                    $("#status_salvamento_transferir").removeClass('badge badge-warning')
                    $("#status_salvamento_transferir").addClass("badge badge-success").text("Tranferido para os canais selecionados!")
                }
            })
            .catch(error => {
                console.error('Erro ao enviar canais:', error);
            })
            .finally(()=>{
                setTimeout(()=>{
                    $("#status_salvamento_transferir").text('')
                }, 5000)
            })
        }

        if (selectedChannels.length == 0 && selectedUsers.length == 0){
            $("#status_salvamento_transferir").removeClass('badge badge-warning').addClass("badge badge-danger").text('Não há opções selecionadas')
            setTimeout(()=>{
                $("#status_salvamento_transferir").text('')
            }, 5000)
        }
    });

    function gera_lista_accordion_canais(index, flag){
        let rowsHTML = ''; // String para construir HTML
        // Verifica se index é um objeto único e não um array, e o converte para um array
        if (!Array.isArray(index)) {
            index = [index];
        }
        console.log(index)
        for(let i = 0; i < index.length; i++){
            
            rowsHTML += `
                <div class="card">
                  <div class="card-header">
                    <h5 class="p-0">
                      <button class="btn btn-link ps-0" data-bs-toggle="collapse" onclick="mensagens.busca_leads_canal(${index[i].id})" data-bs-target="#collapseicon${index[i].id}"
                        aria-expanded="false" aria-controls="collapseicon${index[i].id}">${index[i].canal_nome}</button>
                    </h5>
                  </div>
                  <div class="collapse" id="collapseicon${index[i].id}" aria-labelledby="collapseicon${index[i].id}" data-parent="#accordion">
                    <div class="card-body social-status filter-cards-view" id="lista-leads-${index[i].id}">
                      
                    </div>
                    <div class="loader-box" id="loader_canais_names_${index[i].id}" style="display: none;">
                        <div class="loader-2"></div>
                    </div>
                  </div>
                </div>
            `;
        }
        return rowsHTML; // Definir HTML de uma vez
    }


    function gera_lista_users_accordion(index){
        let rowsHTML = ''; // String para construir HTML
        // Verifica se index é um objeto único e não um array, e o converte para um array
        if (!Array.isArray(index)) {
            index = [index];
        }
        console.log(index)
        for(let i = 0; i < index.length; i++){
            
            rowsHTML += `
                <div class="media"><img class="img-50 rounded-circle m-r-15"
                          src="/static/assets/images/user/10.jpg" alt="">
                        <div class="media-body"><span class="f-w-600 d-block">${index[i].lead_name}</span>
                          <p><a href="javascript:void(0)"></a></p><span class="light-span"></span>
                        </div>
                        <button class="btn btn-danger p-0 m-l-10 float-end" style="font-size: 16px; width: 20px;" onclick="mensagens.excluirUser(${index[i].id})">
                            <i class="fa fa-trash"></i>
                        </button>
                      </div>
            `;
        }
        return rowsHTML; // Definir HTML de uma vez
    }

    function excluirUser(id){
        Swal.fire({
            title: 'Tem certeza que deseja excluir esse Usuário do canal?',
            icon: 'info',
            showConfirmButton: true,
            showCancelButton: true,
            confirmButtonText: 'Sim',
            cancelButtonText: 'Não',
            confirmButtonColor: '#f27474',
            cancelButtonColor: '#6c757d'
        })
        .then(response => {
            if (response.isConfirmed) {
                Swal.fire({
                title: 'Aguarde',
                text: 'Excluindo...',
                icon: 'info',
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => {
                    Swal.showLoading()
                }
                });
                fetch(`api/canais_leads/${id}/`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken,
                    },
                })
                .then(res => {
                    if (res.status == 204) {
                        Swal.fire({
                            title: 'Excluido!',
                            text: '',
                            icon: 'success',
                            showConfirmButton: false
                        });
                    }
                    else {
                        Swal.fire({
                            title: 'Ocorreu um erro ao deletar usuário.',
                            icon: 'error',
                            confirmButtonText: 'Entendi',
                            confirmButtonColor: '#f27474'
                        });
                    }
                })
            }
        })
    }

    function busca_leads_canal(id){
        console.log("AJUSTOU", id)
        let div = document.getElementById(`lista-leads-${id}`)
        let loader_canais_names = document.getElementById(`loader_canais_names_${id}`)
        loader_canais_names.style.display='block'
        div.innerHTML = ""
        fetch(`api/canais_leads/retorna_leads/?id=${id}`)
        .then(res=>res.json())
        .then(data=>{
            console.log(data)
            if(data.length>0){
               div.innerHTML = gera_lista_users_accordion(data)
            }
        })
        .finally(()=>{
            loader_canais_names.style.display = 'none'
        })


    }

    function fetch_websocket(){
        fetch(`api/msg_message/socket_messages/`)
        .then(res=>res.json())
        .then(data=>{
            console.log(data)
        })
    }

    $("#profile-canais-tab").on("click", function(){
        let list = document.getElementById('accordionoc2')
        let loader_canais_lista = document.getElementById("loader_canais_lista")
        loader_canais_lista.style.display = 'block'
        list.innerHTML = ""
        fetch("api/canais/get_canais/?verify=True")
        .then(res=>res.json())
        .then(data=>{
            if(data.length>0){
               list.innerHTML = gera_lista_accordion_canais(data)
            }
        })
        .finally(()=>{
            loader_canais_lista.style.display = 'none'
        })

    })

    function sendMessage(type) {
        try {
            // Captura os inputs dinâmicos
            const dynamicInputs = document.querySelectorAll(".dynamic-input");
            const parametros = [];
            let camposValidos = true;
            let campoVazio = '';
    
            // Itera sobre os inputs dinâmicos e valida seus valores
            if(type != 'chat'){
                dynamicInputs.forEach((input, index) => {
                    let valor = input.value.trim();
                    
                    // Verifica se o input principal está vazio
                    if (!valor) {
                        camposValidos = false;
                        campoVazio = `Campo ${index + 1}`;
                        return;
                    }
                    
                    // Verificar se há input de data associado
                    const dateInput = document.querySelector(`#${input.id}-date`);
                    if (dateInput) {
                        const dateValue = dateInput.value.trim();
                        if (!dateValue) {
                            camposValidos = false;
                            campoVazio = `Data do Campo ${index + 1}`;
                            return;
                        }
                        valor += ` ${dateValue}`;
                    }
                    
                    // Verificar se há input de hora associado
                    const timeInput = document.querySelector(`#${input.id}-time`);
                    if (timeInput) {
                        const timeValue = timeInput.value.trim();
                        if (!timeValue) {
                            camposValidos = false;
                            campoVazio = `Hora do Campo ${index + 1}`;
                            return;
                        }
                        valor += ` ${timeValue}`;
                    }
                    
                    parametros.push(valor);
                });
            
    
                // Se algum campo estiver vazio, mostra erro e interrompe o envio
                if (!camposValidos) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Campo Obrigatório',
                        text: `O ${campoVazio} não pode estar vazio.`,
                        confirmButtonText: 'Entendi',
                        customClass: {
                            confirmButton: "btn btn-primary"
                        }
                    });
                    return;
                }
            }
            else{
                parametros.push($("#message-to-send").val(), $("#user_logado_name").text())
            }
            // Mostra loading
            Swal.fire({
                title: 'Aguarde',
                text: 'Enviando mensagem...',
                icon: 'info',
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => {
                    Swal.showLoading()
                }
            });
    
            // Obtém o ID do template
            const template_id = document.getElementById("template_id").value || ''; 
        
            // Prepara os dados para envio
            const messageData = {
                template_id: type != 'chat' ? template_id : '',
                parametros: parametros,
                entidade: id_users,
                type: type,
                campanha: $("#id_campanha").val(),
                message_text: type != 'chat' ? $("#text-format").val() : $("#message-to-send").val()
            };
        
            console.log("Dados sendo enviados:", messageData);
        
            // Faz a requisição para a API
            fetch('/pt/api/msg_message/envia_mensagem/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                },
                body: JSON.stringify(messageData)
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => Promise.reject(data));
                }
                return response.json();
            })
            .then(data => {
                // Adiciona a mensagem ao chat
                const newMessage = {
                    direcao: 'O',
                    DataHoraDoEvento: new Date().toISOString(),
                    MensagemTexto: type != 'chat' ? $("#text-format").val() : $("#message-to-send").val()
                };
                
                const newMessageHTML = gera_chats(newMessage);
                const tbody = document.getElementById('tbody_msgs');
                tbody.innerHTML += newMessageHTML;
        
                // Limpa os campos de entrada
                if (type != 'chat') {
                    dynamicInputs.forEach(input => {
                        input.value = '';
                        const dateInput = document.querySelector(`#${input.id}-date`);
                        const timeInput = document.querySelector(`#${input.id}-time`);
                        
                        if (dateInput) dateInput.value = '';
                        if (timeInput) timeInput.value = '';
                    });
                }
                else{
                    $("#message-to-send").val('');
                }
        
                // Mostra mensagem de sucesso
                Swal.fire({
                    icon: 'success',
                    title: 'Mensagem Enviada!',
                    showConfirmButton: false,
                    timer: 1500
                });
            })
            .catch(error => {
                console.error('Erro ao enviar a mensagem:', error);
                
                // Mostra mensagem de erro
                Swal.fire({
                    text: `Ocorreu um erro ao tentar enviar: ${error.error || error}`,
                    icon: "error",
                    buttonsStyling: false,
                    confirmButtonText: "Ok",
                    customClass: {
                        confirmButton: "btn btn-primary"
                    }
                });
            });
        }
        catch(error){
            Swal.fire({
                text: `Ocorreu um erro ao tentar enviar: ${error.error || error}`,
                icon: "error",
                buttonsStyling: false,
                confirmButtonText: "Ok",
                customClass: {
                    confirmButton: "btn btn-primary"
                }
            });
        }
    }
    let originalTemplate = ""; 

    function gerarInputsDinamicos(template) {
        originalTemplate = template;
        const container = document.getElementById("dynamic-inputs");
    
        const matches = template.match(/{{\d+}}/g) || [];
    
        matches.forEach((match, index) => {
            const inputId = `text${index + 1}`;
            
            const inputGroup = document.createElement("div");
            inputGroup.className = "mb-md-3 mb-0";
    
            inputGroup.innerHTML = `
                <label class="col-form-label">Campo ${index + 1}:</label>
                <div class="input-group">
                    <input class="form-control dynamic-input" type="text" id="${inputId}" data-placeholder="${match}" placeholder="Digite um texto...">
                    <div class="input-group-append ms-1">
                        <button class="btn btn-primary date-btn" type="button" data-target="${inputId}" title="Selecionar Data">
                            <i class="fa fa-calendar"></i>
                        </button>
                        <button class="btn btn-primary time-btn" type="button" data-target="${inputId}" title="Selecionar Hora">
                            <i class="fa fa-clock-o"></i>
                        </button>
                    </div>
                </div>
            `;
    
            container.appendChild(inputGroup);
    
            const dateBtn = inputGroup.querySelector('.date-btn');
            dateBtn.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const $input = $(`#${targetId}`);

                if (dateBtn.classList.contains('btn-success')) {
                    // Remove o evento 'hide' antes de destruir
                    // Remove todos os eventos do datepicker antes de destruir
                    $input.off('.datepicker'); // Remove listeners específicos do plugin
                    $input.datepicker("hide");
                    // Remove elementos residuais do datepicker (importante!)
                    $input.parent().find('.datepicker').remove(); 
                    dateBtn.classList.remove('btn-success');
                    dateBtn.classList.add('btn-primary');
                } else {
                    // Inicializa o datepicker
                    $input.datepicker({
                        language: 'pt-BR',
                        format: 'dd/mm/yyyy',
                        autoclose: true,
                        todayHighlight: true
                    }).datepicker('show');

                    dateBtn.classList.add('btn-success');
                    dateBtn.classList.remove('btn-primary');

                    // Define o evento 'hide' para remover a classe ao fechar
                    $input.on('hide', function() {
                        dateBtn.classList.remove('btn-success');
                        dateBtn.classList.add('btn-primary');
                        // Remove o evento após ser executado para evitar acumulação
                        $input.off('hide');
                    });
                }
            });

            const timeBtn = inputGroup.querySelector('.time-btn');
            timeBtn.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const $input = $(`#${targetId}`);

                // Verifica se já existe um clockpicker
                if ($input.data('clockpicker')) {
                    // Destroi o clockpicker existente
                    $input.clockpicker('remove');
                    
                    // Remove a div do clockpicker do DOM
                    $input.parent().find('.clockpicker-popover').remove();
                    
                    timeBtn.classList.remove('btn-success');
                    timeBtn.classList.add('btn-primary');
                } else {
                    // Inicializa novo clockpicker
                    $input.clockpicker({
                        placement: 'top',
                        align: 'left',
                        autoclose: true,
                        'default': 'now'
                    }).clockpicker('show');

                    timeBtn.classList.add('btn-success');
                    timeBtn.classList.remove('btn-primary');

                    // Adiciona evento para remover quando fechar
                    $input.on('hide', function() {
                        $input.clockpicker('remove');
                        $input.parent().find('.clockpicker-popover').remove();
                        
                        timeBtn.classList.remove('btn-success');
                        timeBtn.classList.add('btn-primary');
                    });
                }
            });
                    });
    
        // Adiciona eventos para os inputs principais
        const dynamicInputs = document.querySelectorAll(".dynamic-input");
        dynamicInputs.forEach(input => {
            input.addEventListener("input", atualizarTextoTemplate);
        });

    
        document.getElementById("text-format").value = originalTemplate;
    }
    
    function atualizarTextoTemplate() {
        let novoTexto = originalTemplate;
    
        document.querySelectorAll(".dynamic-input").forEach(input => {
            const placeholder = input.getAttribute("data-placeholder");
            const valor = input.value.trim() || placeholder;
            
            const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            novoTexto = novoTexto.replace(new RegExp(escapedPlaceholder, "g"), valor);
        });
    
        document.getElementById("text-format").value = novoTexto;
    }
    
    $("#template_id").on("change", function() {
        const template_id = $(this).val();
        $("#text-format").val('');
        const container = document.getElementById("dynamic-inputs");
        container.innerHTML = "";
        let loader_inputs = document.getElementById('loader-inputs')
        loader_inputs.style.display = 'block'
        fetch("/pt/api/wpp_templatescomponents/busca_texto_padrao/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken,
            },
            body: JSON.stringify({ id: template_id })
        })
        .then(response => response.json())
        .then(data => {
            if (data.texto_padrao) {
                gerarInputsDinamicos(data.texto_padrao);
            }
        })
        .catch(error => console.error("Erro ao buscar template:", error))
        .finally(()=>{
            loader_inputs.style.display = 'none'
        })
    });

    return {
        init: function() {
            div_menu = document.getElementById("v-pills-tab")
            loader = document.getElementById('loader-message_2');
            init();
        },
        activeDiv:activeDiv,
        reseta_pag: reseta_pag,
        busca_leads_canal: busca_leads_canal,
        excluirUser: excluirUser,
        gera_lista_users_accordion: gera_lista_users_accordion,
        gera_chats: gera_chats
    };
}()

mensagens.init()