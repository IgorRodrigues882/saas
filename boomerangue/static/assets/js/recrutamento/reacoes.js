"use strict";
  // Encontra o cookie que contém o csrftoken do Django
  const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
  // Extrai o valor do csrftoken do cookie
  const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;
  
  var reacoes = (function(){
    let tabela_scroll;
    let btn_importa_csv;
    let currentPage = 1;
    let totalPages = 1;
    let editar_vaga = false;
    let id_reacoes = 0;
    let loading_history = false; // Flag para evitar chamadas simultâneas

    // Função para carregar os itens (agora fora do init)
    function carrega_itens(page){
        let tbody = document.getElementById('tbody-reacoes');
        let loader = document.getElementById('loader');
        tbody.innerHTML = '';
        loader.style.display = 'block';
        var data = {
            // Adicione os filtros necessários, se houver
        };
        fetch(`api/reacoes/filtragem_reacoes/?page=${page}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify(data)
        }).then(res => res.json())
          .then(data => {
              if(data){
                  tbody.innerHTML = gera_tabela(data.results);
                  loader.style.display = 'none';
                  updatePagination(data.count);
              } else {
                  tbody.innerHTML = '<tr><td>Não há dados</td></tr>';
                  loader.style.display = 'none';
              }
          })
          .catch(error => {
              console.error('Erro ao carregar os dados:', error);
          }).finally(() => {
              loading_history = false;
              loader.style.display = 'none';
          });
    }

    // Função para gerar a tabela com os dados
    function gera_tabela(index){
        let rowsHTML = '';
        if (!Array.isArray(index)) {
            index = [index];
        }
        if(index.length > 0){
            for(let i = 0; i < index.length; i++){
                rowsHTML += `
                <tr>
                  <td>
                    <div class="media">
                      
                      <div class="media-body ps-2">
                        <div class="avatar-details">
                          <a href="javascript:void(0)">
                            <h6>${index[i].document_reasons}</h6>
                          </a>
                          <span>${index[i].document_reasons_id}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown"
                      aria-haspopup="true" aria-expanded="false">Opções</button>
                    <div class="dropdown-menu">
                      <a class="dropdown-item" href="javascript:void(0)" onclick="reacoes.deleteReacoes(${index[i].document_reasons_id})">Excluir</a>
                      <a class="dropdown-item" href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#addreacoes" onclick="reacoes.editarReacoes(${index[i].document_reasons_id})">Editar</a>
                    </div>
                  </td>
                </tr>
                `;
            }
        } else {
            rowsHTML = '<tr><td colspan="2" style="text-align: center;">Nenhum dado encontrado</td></tr>';
        }
        return rowsHTML;
    }

    // Função para atualizar a paginação
    function updatePagination(count) {
        totalPages = Math.ceil(count / 5);
        const pagination = document.getElementById('pagination');
        
        // Remove itens existentes de paginação, exceto os botões de anterior e próximo
        while (pagination.children.length > 2) {
            pagination.removeChild(pagination.children[1]);
        }
        
        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.className = 'page-item';
            if (i === currentPage) {
                li.classList.add('active');
            }
            const a = document.createElement('a');
            a.className = 'page-link';
            a.href = 'javascript:void(0)';
            a.textContent = i;
            a.addEventListener('click', () => loadPage(i));
            li.appendChild(a);
            pagination.insertBefore(li, document.getElementById('next-page'));
        }
        
        document.getElementById('previous-page').classList.toggle('disabled', currentPage === 1);
        document.getElementById('next-page').classList.toggle('disabled', currentPage === totalPages);
    }

    function loadPage(page) {
        currentPage = page;
        carrega_itens(page);
    }

    // Função init para inicializações e configuração dos eventos
    function init(){
        // Configuração dos elementos
        btn_importa_csv = document.getElementById('new_csv');
        tabela_scroll = document.getElementById('div_scroll');

        // Sistema de pesquisa com typeahead
        // (function ($) {
        //     var bestPictures = new Bloodhound({
        //       datumTokenizer: Bloodhound.tokenizers.obj.whitespace("value"),
        //       queryTokenizer: Bloodhound.tokenizers.whitespace,
        //       prefetch: "",
        //       remote: {
        //         url: `api/cadastros/busca/?query=%QUERY`,
        //         wildcard: "%QUERY",
        //         filter: function (response) {
        //           return response;
        //         }
        //       }
        //     });
          
        //     $(".faq-form .typeahead").on('typeahead:asyncrequest', function () {
        //       $(".loading-indicator-itens").show();
        //     });
          
        //     $(".faq-form .typeahead").on('typeahead:asyncreceive', function () {
        //       $(".loading-indicator-itens").hide();
        //     });
          
        //     $(".faq-form .typeahead").typeahead(null, {
        //       name: "document_reasons",
        //       display: 'document_reasons',
        //       limit: 15,
        //       source: bestPictures
        //     });
          
        //     $(".faq-form .typeahead").on('input', function() {
        //       if ($(this).val() === '') {
        //         $(".loading-indicator-itens").hide();
        //       }
        //     });
        //   })(jQuery);

        // Evento para filtrar dados
        $('#filtrar').on('click', function(){
          currentPage = 1;
          carrega_itens(currentPage);
        });

        // Eventos de paginação
        document.getElementById('previous-page').addEventListener('click', () => {
          if (currentPage > 1) {
              loadPage(currentPage - 1);
          }
        });
      
        document.getElementById('next-page').addEventListener('click', () => {
            if (currentPage < totalPages) {
                loadPage(currentPage + 1);
            }
        });

        // Carrega os itens iniciais
        carrega_itens(1);

        // Salvar ou atualizar reações
        $("#salvar_reacoes").on("click", function(){
            Swal.fire({
                title: 'Aguarde',
                text: 'Por favor, espere...',
                icon: 'info',
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => { Swal.showLoading(); }
            });
            let url = (editar_vaga) ? `api/reacoes/${id_reacoes}/` : "api/reacoes/";
            let method = (editar_vaga) ? 'PATCH' : 'POST';
            let title = $("#document_reasons").val();
            if (title == ''){
                Swal.fire({
                    text: "Preencha o campo vaga!",
                    icon: "error",
                    buttonsStyling: false,
                    confirmButtonText: "Ok",
                    customClass: { confirmButton: "btn btn-primary" }
                });
                return;
            }
            const formData = new FormData();
            formData.append('document_reasons', title);
            fetch(url, {
                method: method,
                headers: {
                    'X-CSRFToken': csrftoken,
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if(data.document_reasons_id){
                    Swal.fire({
                        text: "Salvo com sucesso!",
                        icon: "success",
                        buttonsStyling: false,
                        confirmButtonText: "Ok",
                        customClass: { confirmButton: "btn btn-primary" }
                    });
                    carrega_itens(1);
                }
                else{
                    Swal.fire({
                        text: "Ocorreu um erro",
                        icon: "error",
                        buttonsStyling: false,
                        confirmButtonText: "Ok",
                        customClass: { confirmButton: "btn btn-primary" }
                    });
                }
            });
        });

        // Exportar dados
        $("#export_btn_reacoes").on('click', function(){
            Swal.fire({
                title: 'Aguarde',
                text: 'Preparando exportação...', // Mensagem mais genérica
                showConfirmButton: false,
                willOpen: () => Swal.showLoading()
            });
    
            // 1. Definir os parâmetros para o endpoint universal
            const exportFormat = $("#export_format_reacoes").val()?.toLowerCase().trim() || 'csv';
            const modelName = 'recrutamento.DocumentReasons';
    
            // Define os campos TÉCNICOS que você quer exportar
            const fieldsToExport = [
                'document_reasons_id',
                'document_reasons',
                'dtcadastro',
            ];
    
            // Define o mapeamento de nomes técnicos para nomes amigáveis (Labels)
            // Use os nomes exibidos no cabeçalho da tabela HTML
            const fieldLabels = {
                'document_reasons_id': 'ID', // Label para ID (não está na tabela, mas pode ser útil)
                'document_reasons': 'Reação/motivo',
                'dtcadastro': 'Data cadastro',
            };
    
            // 2. Coletar filtros (opcional)
            const filters = {};
            Object.keys(filters).forEach(key => {
                if (filters[key] === null || filters[key] === undefined || filters[key] === '') {
                    delete filters[key];
                }
            });
    
            // 3. Montar o corpo da requisição, incluindo field_labels
            const requestBody = {
                model_name: modelName,
                export_format: exportFormat,
                fields: fieldsToExport, // Lista de campos técnicos
                field_labels: fieldLabels, // Dicionário com os labels
                filters: filters
            };
    
            // 4. Fazer a requisição para o endpoint universal
            fetch(`api/export/exporta/`, { // URL do endpoint universal
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken, // Certifique-se que 'csrftoken' está disponível globalmente
                },
                body: JSON.stringify(requestBody) // Envia os parâmetros definidos
            })
            .then(response => {
                if (!response.ok) {
                    // Se a resposta não for OK, tenta ler o erro como JSON
                    return response.json().then(err => {
                        throw new Error(err.error || `Erro ${response.status}: ${response.statusText}`);
                    });
                }
                // Se a resposta for OK, espera um blob (arquivo)
                // Pega o nome do arquivo do cabeçalho Content-Disposition, se disponível
                const disposition = response.headers.get('Content-Disposition');
                let filename = `${modelName}_export.${exportFormat}`; // Nome padrão
                if (disposition && disposition.indexOf('attachment') !== -1) {
                    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                    const matches = filenameRegex.exec(disposition);
                    if (matches != null && matches[1]) {
                      filename = matches[1].replace(/['"]/g, '');
                    }
                }
                return response.blob().then(blob => ({ blob, filename })); // Retorna o blob e o nome do arquivo
            })
            .then(({ blob, filename }) => {
                // 5. Criar URL temporária e acionar download
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = filename; // Usa o nome do arquivo obtido ou o padrão
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url); // Libera a URL do objeto
                document.body.removeChild(a); // Remove o link temporário
                Swal.close(); // Fecha o loading de sucesso
            })
            .catch(error => {
                console.error('Erro na exportação:', error);
                Swal.fire("Erro", `Falha ao exportar: ${error.message}`, "error");
            })
            // Removido o finally Swal.close() daqui para fechar apenas no sucesso ou erro específico
        });
    }

    // Função para excluir reações
    function deleteReacoes(id) {
        Swal.fire({
            title: 'Tem certeza?',
            text: "Tem certeza que deseja excluir este item?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim, excluir!',
            cancelButtonText: 'Não, cancelar!'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`api/reacoes/${id}/`, {
                    method: "DELETE",
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken,
                    },
                }).then(response => {
                    if (response.status === 204) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Vaga Excluida!',
                            showConfirmButton: false,
                            timer: 1500
                        }).then(() => {
                            carrega_itens(1);
                        });
                    } else {
                        Swal.fire({
                            title: "Erro",
                            text: "Houve um erro ao tentar excluir!",
                            icon: "error",
                            confirmButtonText: "OK"
                        });
                    }
                }).catch(error => {
                    console.error('Erro ao enviar a solicitação:', error);
                });
            }
        });
    }

    // Função para editar reações
    function editarReacoes(id){
        editar_vaga = true;
        id_reacoes = id;
        Swal.fire({
            title: 'Aguarde',
            text: 'Carregando dados',
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => { Swal.showLoading(); }
        });
        fetch(`api/reacoes/${id}/`)
        .then(response => response.json())
        .then(data => {
            $("#document_reasons").val(data.document_reasons);
        })
        .catch(error => {
            Swal.fire({
                title: "Erro",
                text: "Houve um erro!",
                icon: "error",
                confirmButtonText: "OK"
            });
        })
        .finally(()=>{
            Swal.close();
        });
    }

    // Função para limpar o formulário e preparar para nova entrada
    function newVaga(){
        editar_vaga = false;
        id_reacoes = 0;
        $("#document_reasons").val('');
    }

    return {
        init: function() {
            btn_importa_csv = document.getElementById('new_csv');
            tabela_scroll = document.getElementById('div_scroll');
            init();
        },
        deleteReacoes: deleteReacoes,
        editarReacoes: editarReacoes,
        newVaga: newVaga,
        // Expondo carrega_itens para eventuais chamadas externas, se necessário
        carrega_itens: carrega_itens
    };
})();

reacoes.init();
