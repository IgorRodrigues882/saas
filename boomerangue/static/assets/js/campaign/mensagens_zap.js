

var zapmsgs = (function(){
  let pagination_users = 1;
  let pagination_messages = 1;
  let pagination_doc = 1;
  let loading = false;
  let id_users;

  let dropzone1 = '';
  
  Dropzone.options.importComprovante = {
      paramName: "importComprovante",
      maxFiles: 1,
      maxFilesize: 10, // Tamanho máximo do arquivo em MB
      acceptedFiles: "application/*,audio/*,image/*,text/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z",
      autoProcessQueue: false, // Desativar o envio automático
      init: function() {
          dropzone1 = this;
          console.log("Dropzone inicializado:", dropzone1);
          
          this.on("success", function(file, response) {
              console.log("Upload bem-sucedido:", response);
          });
          this.on("addedfile", function(file) {
              console.log("Arquivo adicionado:", file);
  
              // Cria um botão de exclusão
              var removeButton = Dropzone.createElement("<button class='dz-remove'>Remover arquivo</button>");
              
              // Ouve o evento de clique no botão de exclusão
              removeButton.addEventListener("click", function(e) {
                  e.preventDefault();
                  e.stopPropagation();
                  dropzone1.removeFile(file);
              });
  
              // Adiciona o botão de exclusão ao arquivo de visualização
              file.previewElement.appendChild(removeButton);
  
              // Verifica e remove arquivos SVG
              if (file.type === "image/svg+xml") {
                  dropzone1.removeFile(file);
                  alert("Arquivos SVG não são permitidos.");
              }
          });
      }
  };
  



 
    var bestPictures = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace("value"),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      prefetch: "",
      remote: {
        url: `/pt/api/create-entidade/busca/?query=%QUERY`,
        wildcard: "%QUERY",
        filter: function (response) {
          return response; // Assumindo que a API retorna a lista diretamente
        }
      }
    });
  
    $(".faq-form .typeahead").on('typeahead:asyncrequest', function () {
      // Mostrar indicador de carregamento
      $(".loading-indicator-itens-msgs-user").show();
    });
  
    $(".faq-form .typeahead").on('typeahead:asyncreceive', function () {
      // Esconder indicador de carregamento
      $(".loading-indicator-itens-msgs-user").hide();
    });
  
    $(".faq-form .typeahead").typeahead(null, {
      name: "Entidade",
      display: 'Entidade',
      limit: 15,
      source: bestPictures
    })
  
    $(".faq-form .typeahead").on('input', function() {
      if ($(this).val() === '') {
        $(".loading-indicator-itens-msgs-user").hide();
      }
    })
  




  $("#busca_lead_mensagens").on('click',function(){
    Swal.fire({
            title: 'Aguarde',
            text: 'Buscando usuários...',
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading()
            }
    });
    pagination_users = 1
    pagination_messages = 1;
    let div = document.getElementById('v-pills-tab');
    div.innerHTML = ''
    carrega_mensagens()
  })
  // formata valores vindos do banco
  function formatarValor(valor) {
      // Remove o 'R$ ' e converte para float
      const numero = parseFloat(valor.replace(',', '.'));

      // Formata o número para o formato de moeda desejado
      const valorFormatado = numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      return valorFormatado;
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

  function formatarCPFouCNPJ(valor) {
      // Remove qualquer coisa que não seja número
      valor = valor.replace(/\D/g, '');

      if (valor.length === 11) {
          // Formatar como CPF
          return valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      } else if (valor.length === 14) {
          // Formatar como CNPJ
          return valor.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
      } else {
          // Retorna o valor sem formatação se não for um CPF ou CNPJ válido
          return valor;
      }
  }

  function gera_lista_msgs(index) {
      let rowsHTML = ''; // String para construir HTML
      console.log(index);
      // Verifica se index é um objeto único e não um array, e o converte para um array
      if (!Array.isArray(index)) {
          index = [index];
      }

      for(let i = 0; i < index.length; i++){
          rowsHTML += `
              <a class="contact-tab-${index[i].id} nav-link  ${ i == 0 ? 'active' : '' }" id="v-pills-user-tab" data-bs-toggle="pill" onclick="zapmsgs.reseta_pag(${index[i].id}, '${index[i].Entidade}'), zapmsgs.activeDiv(${index[i].id})"
                      href="#v-pills-user" role="tab" aria-controls="v-pills-user" aria-selected="true">
                      <div class="media"><img class="img-50 img-fluid m-r-20 rounded-circle update_img_0"
                          src="/static/assets/images/profile-image.png" alt="">
                          <div class="media-body">
                          <h6><span class="first_name_0"></span>${index[i].Entidade}</h6>
                          <p class="email_add_0">${index[i].Telefone1}</p>
                          </div>
                      </div>
                      </a>
          `;
          if (i==0){
            zapmsgs.activeDiv(index[i].id)
            zapmsgs.reseta_pag(index[i].id, `${index[i].Entidade}`)
          }
      }

      console.log('html', rowsHTML);
      return rowsHTML; // Definir HTML de uma vez
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
          if(index[i].complemento1 == 'image'){
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
          else if(index[i].complemento1 == 'document'){
              div_anexo = `
                  <a href="${index[i].URL_Anexo}" target="_blank">${index[i].nome_anexo}</a></br>
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
      console.log("entrou aqui", id);
      let tbody = document.getElementById('tbody_msgs');
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
              campanha: $("#id_campanha").data('id'),
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


  document.querySelector('#lista_usuarios_msg').addEventListener('scroll', function() {
    if (this.scrollTop + this.clientHeight >= this.scrollHeight){
        carrega_mensagens()
      }
    });

  function carrega_mensagens(){
      let div = document.getElementById('v-pills-tab');
      let loader = document.getElementById("loader_user_msgs")
      loader.style.display = 'block';
      var data = {
          'campanha': $("#id_campanha").data('id'),
          'query': $("#lead_pesquisar").val()
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
          if(data.results.length > 0){
              div.innerHTML += gera_lista_msgs(data.results);
                pagination_users += 1;
          }
          else{
            console.log('jfvhj')
          }
      })
      .finally(()=>{
        loader.style.display = 'none';
        Swal.close()
      })
  }


    // mensagem Status
    let status_page = 1
    function loadPage(page) {
        status_page  = page;
        busca_status_mensagem(page);
    }

    function gera_lista_status(index){
        let rowsHTML = ''; // String para construir HTML
      console.log(index);
      // Verifica se index é um objeto único e não um array, e o converte para um array
      if (!Array.isArray(index)) {
          index = [index];
      }

      for(let i = 0; i < index.length; i++){
        let status = ''
        let badge = ''
        if(index[i].status_envio == 'O'){
            status = 'Lida'
            badge = 'info'
        }
        else if(index[i].status_envio == 'N'){
            status = 'Criada'
            badge = 'warning'
        }
        else if(index[i].status_envio == 'S'){
            status = 'Enviada'
            badge = 'success'
        }
        else if(index[i].status_envio == 'D'){
            status = 'Entregue'
            badge = 'primary'
        }
        else if(index[i].status_envio == 'R'){
            status = 'Redirecionada'
            badge = 'secondary'
        }
        else if(index[i].status_envio == 'X'){
            status = 'Rejeitada'
            badge = 'danger'
        }
        else if(index[i].status_envio == 'K'){
            status = 'Não enviada'
            badge = 'dark'
        }
          rowsHTML += `
              <tr>
          <td>
            <div class="media">
              <div class="square-box me-2"><i class="fa fa-comment-o txt-success"></i></div>
              <div class="ps-2">
                <h6>${index[i].Entidade}</h6>
            </div>
          </td>
          <td class="img-content-box">
            <h6>${index[i].Telefone1}</h6>
          </td>
          <td class="img-content-box">
            <h6><span class=" text-white badge badge-${badge}">${status}</span></h6>
          </td>
          <td>
          ${formatarDataBmm(index[i].data_evento_registro)}
          </td>
        </tr>
          `;
          
      }
      return rowsHTML
    }


    function updatePagination(count) {
        totalPages = Math.ceil(count / 20);
        const pagination = document.getElementById('pagination-2');
        
        // Remove existing page items except previous and next buttons
        while (pagination.children.length > 2) {
            pagination.removeChild(pagination.children[1]);
        }
        
        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.className = 'page-item';
            if (i === status_page ) {
                li.classList.add('active');
            }
            const a = document.createElement('a');
            a.className = 'page-link';
            a.href = 'javascript:void(0)';
            a.textContent = i;
            a.addEventListener('click', () => loadPage(i));
            li.appendChild(a);
            pagination.insertBefore(li, document.getElementById('next-page-2'));
        }
        
        document.getElementById('previous-page-2').classList.toggle('disabled', status_page  === 1);
        document.getElementById('next-page-2').classList.toggle('disabled', status_page  === totalPages);
    }


    document.getElementById('previous-page-2').addEventListener('click', () => {
        if (status_page  > 1) {
            loadPage(status_page  - 1);
          }
      });
    
      document.getElementById('next-page-2').addEventListener('click', () => {
          if (status_page  < totalPages) {
              loadPage(status_page  + 1);
          }
      });


      $("#filtro_status_mensagem").on('change', function(){
        busca_status_mensagem(1)
      })
    function busca_status_mensagem(page){
        let tbody = document.getElementById("body_mensagens_status")
        let loader = document.getElementById("loader-message_2")
        loader.style.display = 'block';
        tbody.innerHTML =''
        fetch(`/pt/api/msg_message/retorna_status_mensagens/?page=${page}`,{
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrftoken,
          },
          body: JSON.stringify({
            "campanha":$("#id_campanha").data('id'),
            'status': $("#filtro_status_mensagem").val()
          })
        })
        .then(res => res.json())
      .then(data => {
            console.log("status retorno",data)
          if(data.results.length > 0){
              tbody.innerHTML = gera_lista_status(data.results);
              updatePagination(data.count)
          }
          else{
            console.log('jfvhj')
          }
      })
      .finally(()=>{
        loader.style.display = 'none';
      })
    }

    $('.nav-link').on('click', function(){
        $('.nav-link').each(function () {
          if ($(this).hasClass('active')) {
            let verifica_pagina = $(this).text();
            if (verifica_pagina == 'Mensagens'){
                carrega_mensagens();
                busca_status_mensagem(1)
            }
            console.log(verifica_pagina)
            // $('.tooltip').tooltip('dispose');
            // $('[data-toggle="tooltip"]').tooltip();
          }
        });
        })


        $("#send-message").on('click',function(){
            sendMessage()
        })

        $("#message-to-send").on('keydown', function(event) {
            // Verifica se a tecla pressionada é "Enter" (código 13)
            if (event.key === 'Enter' || event.keyCode === 13) {
                event.preventDefault(); // Evita que o "Enter" insira uma nova linha
                sendMessage();
            }
        });


        // Inicializar o seletor de emojis
        const button = document.querySelector('#smiley-button');
        const pickerContainer = document.querySelector('#emoji-picker');
        const input = document.querySelector('#message-to-send');
        const picker = new EmojiMart.Picker({
            set: 'apple',
            onClick: (emoji) => {
                input.value += emoji.native;
            }
        });
        pickerContainer.appendChild(picker);

        button.addEventListener('click', () => {
            pickerContainer.style.display = pickerContainer.style.display === 'none' ? 'block' : 'none';
        });

        function sendMessage() {
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
            let messageInput = document.getElementById("message-to-send")
            const messageText = messageInput.value.trim();
            console.log(messageText)
            if (!messageText) return;
        
            // Dados da mensagem para enviar para a API
            const messageData = {
              "name": 'fcv_feat_msg_3',
              "text1": $("#nome_user_msgs").text(),
              "text2": messageText,
              "campanha": $("#id_campanha").data('id'),
              "entidade": id_users
            };

            console.log("DADOS", messageData)
        
            fetch('/pt/api/msg_message/envia_mensagem/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken, // Certifique-se de que o token CSRF está configurado corretamente
              },
              body: JSON.stringify(messageData)
            })
            .then(response => response.json())
            .then(data => {
              if (data.error) {
                console.error('Erro ao enviar a mensagem:', data.error);
                Swal.fire({
                    text: "Ocorreu um erro ao tentar enviar, "+ data.error,
                    icon: "error",
                    buttonsStyling: false,
                    confirmButtonText: "Ok",
                    customClass: {
                    confirmButton: "btn btn-primary"
                    }
                });
                return;
              }
        
              // Adicionar a mensagem ao chat
              const newMessage = {
                direcao: 'O', // Supondo que 'O' significa mensagem de saída (enviada pelo usuário)
                DataHoraDoEvento: new Date().toISOString(),
                MensagemTexto: messageText
              };
              const newMessageHTML = gera_chats(newMessage);
              const tbody = document.getElementById('tbody_msgs');
              tbody.innerHTML += newMessageHTML;

              Swal.fire({
                icon: 'success',
                title: 'Mensagem Enviada!',
                showConfirmButton: false,
                timer: 1500
            })
        
              // Limpar o campo de entrada
              messageInput.value = '';
            })
            .catch(error => {
              console.error('Erro ao enviar a mensagem:', error);
              Swal.fire({
                text: "Ocorreu um erro ao tentar enviar, "+ error,
                icon: "error",
                buttonsStyling: false,
                confirmButtonText: "Ok",
                customClass: {
                confirmButton: "btn btn-primary"
                }
            });
            })

          }

          // pesquisa doc
          $("#msg_doc_inpt").on('typeahead:asyncrequest', function () {
            // Mostrar indicador de carregamento
            $(".loading-indicator-msg-doc").show();
          });
        
          $("#msg_doc_inpt").on('typeahead:asyncreceive', function () {
            // Esconder indicador de carregamento
            $(".loading-indicator-msg-doc").hide();
          });
        
          $("#msg_doc_inpt").typeahead(null, {
            name: "",
            limit: 10,
            display: 'Entidade',
            source: bestPictures
          }).on('typeahead:selected', function (e, datum) {
            busca_mensagens_doc(1)
          })

          $("#msg_doc_inpt").on('input', function() {
            if ($(this).val() === '') {
              busca_mensagens_doc(1)
            }
          })

          function gera_lista_msgs_doc(index){
            let rowsHTML = ''; // String para construir HTML
            console.log(index);
            // Verifica se index é um objeto único e não um array, e o converte para um array
            if (!Array.isArray(index)) {
                index = [index];
            }

            for(let i = 0; i < index.length; i++){
              let status = ''
              let badge = ''
              if(index[i].doc_validado == 'O'){
                  status = 'Validado'
                  badge = 'success'
              }
              else {
                  status = 'Não Validado'
                  badge = 'danger'
              }
              
                rowsHTML += `
                    <tr>
                <td>
                  <div class="media">
                    <div class="square-box me-2"><i class="fa fa-comment-o txt-success"></i></div>
                    <a href='/entidade_consulta/${index[i].entidade_id}'>
                      <div class="ps-2">
                        <h6>${index[i].entidade}</h6>
                      </div>
                    </a>
                </td>
                <td class="img-content-box">
                  <h6>${index[i].Telefone1}</h6>
                </td>
                <td class="img-content-box">
                  <h6><span class=" text-white badge badge-${badge}">${status}</span></h6>
                </td>
                <td class="img-content-box">
                  <h6><a href="${index[i].URL_Anexo}" target="_blank">${index[i].nome_anexo ? index[i].nome_anexo : 'Documento'}</a></h6>
                </td>
                <td>
                ${formatarDataBmm(index[i].DataHoraDoEvento)}
                </td>
                <td>
                   <a class="btn btn-secondary" onclick='zapmsgs.new_comprovante(${index[i].id})'  data-bs-toggle="modal" data-bs-target="#modal-comprovantes">Validar</a>
                </td>
              </tr>
                `;
                
            }
            return rowsHTML
          }

          function loaddoc(page) {
            pagination_doc  = page;
            busca_mensagens_doc(page);
        }

        function convertDateFormat(dateStr) {
          // Split the date string into parts
          const [day, month, year] = dateStr.split('/');
        
          // Create a new Date object
          const date = new Date(`${year}-${month}-${day}`);
        
          // Format the date to ISO 8601 string
          const isoString = date.toISOString();
        
          return isoString;
        }
        

          function busca_mensagens_doc(page){
            let div = document.getElementById('body_mensagens_doc');
            let loader = document.getElementById("loader-message_doc")
            div.innerHTML = ''
            loader.style.display = 'block';
            var data = {
                'campanha': $("#id_campanha").data('id'),
                'query': $("#msg_doc_inpt").val()
            };
            fetch(`/pt/api/msg_message/retorna_mensagens_docs/?page=${page}`, {  // Substitua pela URL da sua API
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                },
                body: JSON.stringify(data)
            }).then(res => res.json())
            .then(data => {
                console.log("mensagens doc", data)
                if(data.results.length > 0){
                    div.innerHTML = gera_lista_msgs_doc(data.results);
                    updatePaginationdoc(data.count)
                }
                else{
                  console.log('jfvhj')
                }
            })
            .finally(()=>{
              loader.style.display = 'none';
              Swal.close()
            })
          }



          function updatePaginationdoc(count) {
            totalPages = Math.ceil(count / 20);
            const pagination = document.getElementById('pagination-doc');
            
            // Remove existing page items except previous and next buttons
            while (pagination.children.length > 2) {
                pagination.removeChild(pagination.children[1]);
            }
            
            for (let i = 1; i <= totalPages; i++) {
                const li = document.createElement('li');
                li.className = 'page-item';
                if (i === pagination_doc ) {
                    li.classList.add('active');
                }
                const a = document.createElement('a');
                a.className = 'page-link';
                a.href = 'javascript:void(0)';
                a.textContent = i;
                a.addEventListener('click', () => loaddoc(i));
                li.appendChild(a);
                pagination.insertBefore(li, document.getElementById('next-page-doc'));
            }
            
            document.getElementById('previous-page-doc').classList.toggle('disabled', pagination_doc  === 1);
            document.getElementById('next-page-doc').classList.toggle('disabled', pagination_doc  === totalPages);
        }
    
    
        document.getElementById('previous-page-doc').addEventListener('click', () => {
            if (pagination_doc  > 1) {
              loaddoc(pagination_doc   - 1);
              }
          });
        
          document.getElementById('next-page-doc').addEventListener('click', () => {
              if (pagination_doc   < totalPages) {
                loaddoc(pagination_doc  + 1);
              }
          });
    

          function formatComprovanteData(jsonData) {
            console.log("ENTRO FUNÇÃO");
            console.log("JSONS", jsonData);
        
            try {
                const { valor, data_pag, identificador } = jsonData;
        
                // Verificar se o valor já está no formato correto
                let decimalValue = valor;
                if (valor.startsWith('R$')) {
                    decimalValue = parseFloat(valor.replace('R$', '').replace(',', '.')).toFixed(2);
                }
        
                // Verificar se a data já está no formato correto
                let formattedDate = data_pag;
                const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/; // Regex para formato dd/mm/aaaa
                if (!dateRegex.test(data_pag)) {
                    // Dicionário de meses
                    const meses = {
                        'JAN': '01',
                        'FEV': '02',
                        'MAR': '03',
                        'ABR': '04',
                        'MAI': '05',
                        'JUN': '06',
                        'JUL': '07',
                        'AGO': '08',
                        'SET': '09',
                        'OUT': '10',
                        'NOV': '11',
                        'DEZ': '12'
                    };
        
                    // Extrair partes da data
                    const dateParts = data_pag.split(' ');
                    if (dateParts.length >= 3) {
                        const day = dateParts[0].trim();
                        const month = meses[dateParts[1].trim().toUpperCase()];
                        const year = dateParts[2].trim();
        
                        formattedDate = `${day.padStart(2, '0')}/${month}/${year}`;
                    } else {
                        throw new Error("Formato de data inválido");
                    }
                }
        
                // Retornar os dados no formato desejado
                console.log("valor", decimalValue);
                console.log("data", formattedDate);
                return {
                    data: formattedDate,
                    valor: decimalValue,
                    identificador: identificador
                };
            } catch (error) {
                console.error("Erro ao formatar os dados do comprovante:", error);
            }
        }

            function new_comprovante(id) {
              $("#tipo_pagamento").val('PIX').trigger('change');
              $("#valor").val('');
              $("#data_tx").val('');
              $("#txid").val('')
              $("#recorrencia").val('UNICO').trigger('change');
              $("#status").val('PENDENTE').trigger('change');
              if (dropzone1) {
                  dropzone1.removeAllFiles(true); // Limpar arquivos do Dropzone
              }
              Swal.fire({
                  title: 'Aguarde',
                  text: 'Verificando dados',
                  icon: 'info',
                  allowOutsideClick: false,
                  showConfirmButton: false,
                  willOpen: () => {
                      Swal.showLoading()
                  }
              });
          
              document.getElementById("salvar_comprovante").dataset.id = id;
              fetch(`/pt/api/msg_message/${id}/`)
                  .then(res => res.json())
                  .then(data => {
                      console.log(data);
                      if (data.URL_Anexo) {
                          $("#ver_cpv").attr('href', data.URL_Anexo)
                          document.getElementById('validar_pagamento').dataset.empresa = data.empresa
                          document.getElementById('validar_pagamento').dataset.spl = data.spl_key
                          document.getElementById('validar_pagamento').dataset.telefone = data.telefone
                          Swal.fire({
                              title: 'Aguarde',
                              text: 'Analisando documentos com IA',
                              icon: 'info',
                              allowOutsideClick: false,
                              showConfirmButton: false,
                              willOpen: () => {
                                  Swal.showLoading()
                              }
                          });
                          fetch('/pt/api/msg_message/analisa_comprovante/', {
                              method: 'POST',
                              headers: {
                                  'Content-Type': 'application/json',
                                  'X-CSRFToken': csrftoken
                              },
                              body: JSON.stringify({ url: data.URL_Anexo })
                          })
                          .then(res => res.json())
                          .then(result => {
                              let formatados = formatComprovanteData(result)
                              $("#valor").val(formatados.valor) 
                              $("#data_tx").val(formatados.data)
                              $("#txid").val(formatados.identificador)
                              fetch(data.URL_Anexo)
                                  .then(res => res.blob())
                                  .then(blob => {
                                    console.log(blob.type);

                                    // Mapeamento de tipos MIME para extensões de arquivos
                                    const mimeToExtension = {
                                      'image/jpeg': '.jpg',
                                      'image/png': '.png',
                                      'application/pdf': '.pdf',
                                      // Adicione mais tipos MIME conforme necessário
                                    };

                                    // Obtém a extensão do arquivo com base no tipo MIME
                                    const extension = mimeToExtension[blob.type] || '';

                                    // Cria o nome do arquivo com a extensão apropriada
                                    const fileName = `Comprovante_${data.boomerangue}${extension}`;

                                    const mockFile = new File([blob], fileName, { type: blob.type, size: blob.size });

                                    // Adiciona o arquivo manualmente ao Dropzone
                                    dropzone1.addFile(mockFile);

                                    console.log("mockFile", mockFile);
                                    console.log("Arquivos na fila de envio após adicionar:", dropzone1.getQueuedFiles());
                                  })
                                  .catch(error => {
                                    console.error("Erro ao buscar o arquivo:", error);
                                  });

                                  Swal.fire({
                                    title: 'Aguarde',
                                    text: 'Verificando pagamento',
                                    icon: 'info',
                                    allowOutsideClick: false,
                                    showConfirmButton: false,
                                    willOpen: () => {
                                        Swal.showLoading()
                                    }
                                });
                                fetch("/pt/pix/spl/busca_pix",{
                                  method: "POST",
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRFToken': csrftoken
                                  },
                                  body:JSON.stringify({
                                    contact_id: data.spl_key,
                                    txid: formatados.identificador,
                                    empresa_id: data.empresa,
                                    number: data.telefone
                                  })
                                })
                                .then(res=>res.json())
                                .then(data=>{
                                  console.log('retorno pix', data)
                                  if(data.pagamento_feito == 'S'){
                                    $("#status").val('APROVADO').trigger('change');
                                    Swal.fire({
                                      icon: 'success',
                                      title: 'Pagamento confirmado!',
                                      showConfirmButton: false,
                                      timer: 1500
                                    })

                                    if(data.data_tx_pix != ''){
                                      document.getElementById('data_tx').dataset.data = data.data_tx_pix
                                    }
                                    if(data.valor !=''){
                                      document.getElementById('valor').dataset.valor = data.valor_pix
                                      $("#valor").val(data.valor_pix)
                                    }

                                  }
                                  else{
                                    Swal.fire({
                                      text: "Esse pagamento ainda não foi confirmado",
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
                          .catch(error => {
                              Swal.fire({
                                  text: "Ocorreu um erro ao tentar analisar o comprovante",
                                  icon: "error",
                                  buttonsStyling: false,
                                  confirmButtonText: "Ok",
                                  customClass: {
                                      confirmButton: "btn btn-primary"
                                  }
                              });
                          })
                      } else {
                          Swal.fire({
                              text: "URL do comprovante não encontrado",
                              icon: "error",
                              buttonsStyling: false,
                              confirmButtonText: "Ok",
                              customClass: {
                                  confirmButton: "btn btn-primary"
                              }
                          });
                      }
                  })
                  .catch(error => {
                      Swal.fire({
                          text: "Ocorreu um erro ao tentar buscar dados",
                          icon: "error",
                          buttonsStyling: false,
                          confirmButtonText: "Ok",
                          customClass: {
                              confirmButton: "btn btn-primary"
                          }
                      });
                  });
          }
        

            $("#validar_pagamento").on('click', function(){
                Swal.fire({
                  title: 'Aguarde',
                  text: 'Verificando pagamento',
                  icon: 'info',
                  allowOutsideClick: false,
                  showConfirmButton: false,
                  willOpen: () => {
                      Swal.showLoading()
                  }
              });
              let empresa_id = this.dataset.empresa
              let spl = this.dataset.spl
              let telefone = this.dataset.telefone
              fetch("/pt/pix/spl/busca_pix",{
                method: "POST",
                headers: {
                  'Content-Type': 'application/json',
                  'X-CSRFToken': csrftoken
                },
                body:JSON.stringify({
                  contact_id: spl,
                  txid: $("#txid").val(),
                  empresa_id: empresa_id,
                  number: telefone
                })
              })
              .then(res=>res.json())
              .then(data=>{
                console.log(data)
                if(data.pagamento_feito == 'S'){
                  $("#status").val('APROVADO').trigger('change');
                  Swal.fire({
                    icon: 'success',
                    title: 'Pagamento confirmado!',
                    showConfirmButton: false,
                    timer: 1500
                })
                if(data.data_tx_pix != ''){
                  document.getElementById('data_tx').dataset.data = data.data_tx_pix
                }

                if(data.valor !=''){
                  document.getElementById('valor').dataset.valor = data.valor_pix
                  $("#valor").val(data.valor_pix)
                }

                }
                else{
                  Swal.fire({
                    text: "Esse pagamento ainda não foi confirmado",
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

            $("#salvar_comprovante").on('click', function(){
              Swal.fire({
                title: 'Aguarde',
                text: 'Salvando',
                icon: 'info',
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => {
                    Swal.showLoading()
                }
            });
              const data = new FormData();
              
              data.append("tipo_pagamento", $("#tipo_pagamento").val() || null);
              data.append("valor", document.getElementById('valor').dataset.valor || null);
              if(document.getElementById('data_tx').dataset.data != ''){
                data.append("data_tx", document.getElementById('data_tx').dataset.data || null);
              }
              else{
                data.append("data_tx", convertDateFormat($("#data_tx").val()) || null);
              }
              
              data.append("recorrencia", $("#recorrencia").val() || null);
              data.append("status", $("#status").val() || null);
              data.append("message_id", document.getElementById("salvar_comprovante").dataset.id)
              data.append("txid", $("#txid").val() || null)
              
              if (!dropzone1) {
                console.error("Dropzone não inicializado.");
                Swal.fire({
                    text: "Erro interno ao processar o comprovante.",
                    icon: "error",
                    buttonsStyling: false,
                    confirmButtonText: "Ok",
                    customClass: {
                        confirmButton: "btn btn-primary"
                    }
                });
                return;
              }
        
              console.log("Arquivos na fila do Dropzone:", dropzone1.getQueuedFiles());
              if (dropzone1.getQueuedFiles().length > 0) {
                console.log("Dropzone possui arquivo");
                data.append("import_comprovante", dropzone1.getQueuedFiles()[0]);
              } else {
                console.log("Dropzone não possui arquivo na fila.");
              }


            fetch(`/pt/api/pix_transaction/`, {  // Substitua pela URL da sua API
              method: 'POST',
              headers: {
                  'X-CSRFToken': csrftoken,
              },
              body: data
          }).then(res => res.json())
          .then(data => {
              console.log("mensagens doc", data)
              if(data.id){
                Swal.fire({
                  icon: 'success',
                  title: 'Salvo!',
                  showConfirmButton: false,
                  timer: 1500
              })
              $("#tipo_pagamento").val('');
              $("#valor").val('');
              $("#data_tx").val('');
              $("#txid").val('')
              $("#recorrencia").val('UNICO').trigger('change');
              $("#status").val('PENDENTE').trigger('change');
              dropzone1.removeAllFiles(true); // Limpar arquivos do Dropzone
              
              }
              else{
                Swal.fire({
                  text: "Ocorreu um erro ao tentar salvar " + data.error,
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
            busca_mensagens_doc(1);
          })
            })


  return {
      init: function() {
        busca_mensagens_doc(1);
        Inputmask({ mask: '99/99/9999' }).mask($("#data_tx"));
        Inputmask({
          alias: 'decimal',
          groupSeparator: '',
          radixPoint: '.',
          autoGroup: true,
          digits: 2,
          digitsOptional: false,
          placeholder: '0',
          rightAlign: false,
          removeMaskOnSubmit: true
      }).mask($("#valor"));
        if(verifica_pagina == 'Mensagens'){
          carrega_mensagens();
          busca_status_mensagem(1);
        }
      },
      activeDiv: activeDiv,
      reseta_pag: reseta_pag,
      new_comprovante:new_comprovante,

  };
})();

zapmsgs.init();


