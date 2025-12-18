"use strict";
  // Encontra o cookie que contém o csrftoken do Django
  const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
  // Extrai o valor do csrftoken do cookie
  const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;

var boomerangue = (function(){

  let pagina = 1;
  let loading = false;
    var init = function(){

        function makeTimer() {
            var endTime = new Date(final);      
            endTime = (Date.parse(endTime) / 1000);
            var now = new Date();
            now = (Date.parse(now) / 1000);
            var timeLeft = endTime - now;
            var days = Math.floor(timeLeft / 86400); 
            var hours = Math.floor((timeLeft - (days * 86400)) / 3600);
            var minutes = Math.floor((timeLeft - (days * 86400) - (hours * 3600 )) / 60);
            var seconds = Math.floor((timeLeft - (days * 86400) - (hours * 3600) - (minutes * 60)));
            if(now > endTime){
              days = '0'
              hours = '0'
              minutes= '0'
              seconds = '0'
            }
            if (days < "10") { days = "0" + days; }
            if (hours < "10") { hours = "0" + hours; }
            if (minutes < "10") { minutes = "0" + minutes; }
            if (seconds < "10") { seconds = "0" + seconds; }
            $(".days").html(days);
            $(".hours").html(hours);
            $(".minutes").html(minutes);
            $(".seconds").html(seconds);    
          }
          
          setInterval(function() { makeTimer(); }, 1000);

        

          function formatDate(dateString) {
            const date = new Date(dateString);
        
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
        
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
        
            return `${day}/${month}/${year} ${hours}:${minutes}`;
        }
        
        function gera_chats(index) {
            let rowsHTML = ''; // String para construir HTML
            console.log(index);
            // Verifica se index é um objeto único e não um array, e o converte para um array
            if (!Array.isArray(index)) {
                index = [index];
            }
            for(let i = index.length - 1; i >= 0; i--){
                let div_anexo = '';
                let div_msg = '';
                let sender  = index[i].direcao == 'I' ? $("#nome_cliente_").val() : 'Bot';
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
                            <div class="message-data text-end"><span class="message-data-time">${formatDate(index[i].DataHoraDoEvento)}</span></div>
                            ${div_anexo}
                            ${index[i].MensagemTexto}
                        </div>
                    </li>
                `;
            }
            return rowsHTML; // Definir HTML de uma vez
        }
        
        function busca_mensagens(page = 1, append = false) {
            let tbody = document.getElementById('tbody_msgs');
            const chatBox = document.querySelector('.chat-msg-box');
            let loadingAnimation = document.getElementById('loader');
            if (loading) return;
            loading = true;
            
            if (append) {
                loadingAnimation.style.display = 'block';
            }
            const initialScrollHeight = chatBox.scrollHeight;
            console.log(initialScrollHeight)
            const initialScrollTop = chatBox.scrollTop;
            fetch(`/pt/api/msg_message/retorna_mensagens/?page=${page}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                },
                body: JSON.stringify({
                    bmm_id: $("#id_bmm").val()
                })
            })
            .then(response => response.json())
            .then(data => {
                if (append) {
                    tbody.innerHTML = gera_chats(data.results) + tbody.innerHTML;
                    chatBox.scrollTop = chatBox.scrollHeight - initialScrollHeight + initialScrollTop;
                    if (data.results.length>0){
                        pagina++;
                    }
                } else {
                    tbody.innerHTML = gera_chats(data.results); // Scroll to bottom initially
                    chatBox.scrollTop = initialScrollHeight;
                    console.log(chatBox.scrollTop)
                }
                loading = false;
            })
            .catch(error => {
                console.error('Error:', error);
                loading = false;
            })
            .finally(()=>{
                loadingAnimation.style.display = 'none';
            })
        }
        
        document.querySelector('.chat-msg-box').addEventListener('scroll', function() {
            if (this.scrollTop === 0 && !loading) {
                let pag_temp = pagina + 1;
                busca_mensagens(pag_temp, true);
            }
        });
        
        busca_mensagens();
    }
    
    let pagination_pagamentos_entidade = 1
    let totalPages = 1


    Dropzone.options.importComprovante = {
    paramName: "importComprovante",
    maxFiles: 1,
    maxFilesize: 10, // Tamanho máximo do arquivo em MB
    acceptedFiles: "application/*,audio/*,image/*,text/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z", // Aceitar todos os arquivos com exceção de SVG
    autoProcessQueue: false, // Desativar o envio automático
    init: function() {
        var myDropzone = this; 
        this.on("success", function(file, response) {
            // Lógica a ser executada após o upload bem-sucedido, se necessário
            console.log(response);
        });
        this.on("addedfile", function(file) {
            // Cria um botão de exclusão
            var removeButton = Dropzone.createElement("<button class='dz-remove'>Remover arquivo</button>");
            
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

        // Adicionar verificação adicional para rejeitar arquivos SVG
        this.on("addedfile", function(file) {
            if (file.type === "image/svg+xml") {
                myDropzone.removeFile(file);
                alert("Arquivos SVG não são permitidos.");
            }
        });
    }
    };


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

    function gera_lista_pagamentos_entidade(index){
    let rowsHTML = ''; // String para construir HTML
    if (!Array.isArray(index)) {
        index = [index];
    }

    for(let i = 0; i < index.length; i++){
        
        rowsHTML += `
            <tr>
                <td>
                    <div class="media">
                        <div class="square-box me-2"><i class="fa fa-money"></i></div>
                            <div class="ps-2">
                                <h6>${index[i].campanhaNome}</h6>
                            </div>
                    </div>
                </td>
                <td class="img-content-box">
                    <h6>${index[i].valor}</h6>
                </td>
                <td>${formatarDataBmm(index[i].data_tx)}</td>
                <td>
                    <a class="btn btn-secondary" onclick="boomerangue.detalhes_pagamento('${index[i].id}')" data-bs-toggle="modal" data-bs-target="#modal-pix-detalhes">Ver detalhes</a>
                </td>
            </tr>
        `;
    }
    return rowsHTML;
    }

    busca_pagamentos_entidade(1)

    function convertDateFormat(dateStr) {
    // Split the date string into parts
    const [day, month, year] = dateStr.split('/');

    // Create a new Date object
    const date = new Date(`${year}-${month}-${day}`);

    // Format the date to ISO 8601 string
    const isoString = date.toISOString();

    return isoString;
    }

    let dados = {}

    function detalhes_pagamento(id){
    console.log("ID", id)
    $("#excluir_comprovante").data('id', id)
    Swal.fire({
        title: 'Aguarde',
        text: 'Buscando dados...',
        icon: 'info',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
            Swal.showLoading()
        }
    });

    fetch(`/pt/api/pix_transaction/${id}/`)
    .then(res => res.json())
    .then(data=>{
        console.log(data)
        if(data.id){
        dados = data
        $("#tipo_pagamento").val(data.tipo_pagamento).trigger('change');
        $("#valor").val(data.valor);
        $("#data_tx").val(formatarDataBmm(data.data_tx));
        $("#recorrencia").val(data.recorrencia).trigger('change');
        $("#status").val(data.status).trigger('change');
        if(data.import_comprovante != '' && data.import_comprovante != null){
            $('#ver_comprovante').removeClass('d-none')
            fetch('/pt/api/gatewayPagamento/gera_url_temporaria/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({
                object: data.import_comprovante_url
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data)
            $("#btn_ver_comprovante").attr('href', data);
        })
            $('#comprovante').addClass('d-none')
        }
        else{
            $('#ver_comprovante').addClass('d-none')
            $('#comprovante').removeClass('d-none')
        }
        if(data.copia_e_cola){
            $("#valor").attr('disabled', true)
            $("#pix").removeClass('d-none')
            $("#pix_copia_cola").val(data.copia_e_cola)
        }
        }
    })
    .catch(error=>{
        Swal.fire({
        text: "Ocorreu um erro ao tentar buscar dados",
        icon: "error",
        buttonsStyling: false,
        confirmButtonText: "Ok",
        customClass: {
        confirmButton: "btn btn-primary"
        }
    });
    })
    .finally(()=>{
        Swal.close()
    })

    }

    $("#verifica_pagamento").on('click', function(){
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
    console.log("DFGJ", dados)
    let data = {
        "txid": dados.txid,
        "contact_id": dados.contact_id,
        "empresa_id": dados.empresa,
    }
    console.log("DATA", data)
    fetch('/pt/pix/spl/busca_pix', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify(data)
    })
    .then(res=>res.json())
    .then(data=>{
        if(data.pagamento_feito == 'S'){
        Swal.fire({
            icon: 'success',
            title: 'Esse pix foi pago corretamente!',
            showConfirmButton: false,
            timer: 5000
        })
        }
        else{
        Swal.fire({
            text: "Pix ainda não confirmado",
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


    $("#export_historico").on('click', function(){
        Swal.fire({
          title: 'Aguarde',
          text: 'Por favor, espere...',
          icon: 'info',
          allowOutsideClick: false,
          showConfirmButton: false,
          willOpen: () => {
              Swal.showLoading()
          }
      });
        var data = {
            'boomerangue_id': $("#id_bmm").val(),
        }
        fetch(`/pt/api/pix_transaction/gerar_excel_historico/`, {  // Substitua pela URL da sua API
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify(data)
        }).then(response => {
            return response.blob();
        }).then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `historico_doações_boomerangue_${entidade_nome}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        }).catch(error => {
            new swal({
                text: "Ocorreu um erro ao tentar exportar dados!",
                icon: "error",
                buttonsStyling: false,
                confirmButtonText: "Ok",
                customClass: {
                    confirmButton: "btn btn-primary"
                }
            });
        })
        .finally(()=>{
          Swal.close()
        });
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
        data.append("valor", $("#valor").val() || null);
        data.append("data_tx", convertDateFormat($("#data_tx").val()) || null);
        data.append("recorrencia", $("#recorrencia").val() || null);
        data.append("status", $("#status").val() || null);
        data.append("message_id", document.getElementById("salvar_comprovante").dataset.id)
        const dropzone1 = Dropzone.forElement("#importComprovante");
        if (dropzone1.getQueuedFiles().length > 0) {
            data.append("import_comprovante", dropzone1.getQueuedFiles()[0]);
        }




        fetch(`/pt/api/pix_transaction/${$("#excluir_comprovante").data('id')}/`, {  // Substitua pela URL da sua API
        method: 'PATCH',
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
        busca_pagamentos_entidade(1)
        })
    })




    $("#excluir_comprovante").on('click', function(){
    Swal.fire({
        title: 'Tem certeza que deseja excluir esse Comprovante?',
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
            fetch(`/pt/api/pix_transaction/exclui_arquivos_wasabi/`, {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                },
                body: JSON.stringify({
                data: $("#excluir_comprovante").data('id')
                })
            })
            .then(res => {
                if (res.status == 204) {
                    Swal.fire({
                        title: 'Comprovante deletado com sucesso!',
                        text: '',
                        icon: 'success',
                        showConfirmButton: false
                    });
                    $('#ver_comprovante').addClass('d-none')
                    $('#comprovante').removeClass('d-none')
                }
                else {
                    Swal.fire({
                        title: 'Ocorreu um erro ao deletar o comprovante.',
                        icon: 'error',
                        confirmButtonText: 'Entendi',
                        confirmButtonColor: '#f27474'
                    });
                }
            })
        }
    })
    })


    function loadPagamentosEntidade(page) {
    pagination_pagamentos_entidade = page;
    busca_pagamentos_entidade(page);
    }

    function busca_pagamentos_entidade(page){
    let div = document.getElementById('body_pagamentos_entidade');
    let loader = document.getElementById("loader-pagamentos-entidade");
    div.innerHTML = '';
    loader.style.display = 'block';



    var data = {
        'boomerangue_id': $("#id_bmm").val(),
    };

    console.log(data)
    fetch(`/pt/api/pix_transaction/filtragem_historico/?page=${page}`, {  // Substitua pela URL da sua API
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify(data)
    }).then(res => res.json())
    .then(data => {
        if(data.results.length > 0){
            div.innerHTML = gera_lista_pagamentos_entidade(data.results);
            updatePaginationPagamentosEntidade(data.count);
        }
        else{
            console.log('Nenhum dado encontrado');
        }
    })
    .finally(()=>{
        loader.style.display = 'none';
        Swal.close();
    });
    }

    function updatePaginationPagamentosEntidade(count) {
    totalPages = Math.ceil(count / 25);  // Assumindo 25 itens por página, altere se necessário
    const pagination = document.getElementById('pagination-pagamentos-entidade');
    
    // Remove existing page items except previous and next buttons
    while (pagination.children.length > 2) {
        pagination.removeChild(pagination.children[1]);
    }
    
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = 'page-item';
        if (i === pagination_pagamentos_entidade) {
            li.classList.add('active');
        }
        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = 'javascript:void(0)';
        a.textContent = i;
        a.addEventListener('click', () => loadPagamentosEntidade(i));
        li.appendChild(a);
        pagination.insertBefore(li, document.getElementById('next-page-pagamentos-entidade'));
    }
    
    document.getElementById('previous-page-pagamentos-entidade').classList.toggle('disabled', pagination_pagamentos_entidade === 1);
    document.getElementById('next-page-pagamentos-entidade').classList.toggle('disabled', pagination_pagamentos_entidade === totalPages);
    }

    document.getElementById('previous-page-pagamentos-entidade').addEventListener('click', () => {
    if (pagination_pagamentos_entidade > 1) {
        loadPagamentosEntidade(pagination_pagamentos_entidade - 1);
    }
    });

    document.getElementById('next-page-pagamentos-entidade').addEventListener('click', () => {
    if (pagination_pagamentos_entidade < totalPages) {
        loadPagamentosEntidade(pagination_pagamentos_entidade + 1);
    }
    });


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
    return {
        init: function() {
           init()
          },
          detalhes_pagamento: detalhes_pagamento,
    
      };
    })()

boomerangue.init()