var tipos_documento = (function(){
    let tabela_scroll;
    let btn_importa_csv;
    let currentPage = 1;
    let totalPages = 1;
    let editar_tipo = false;
    let id_tipo = 0;
    let loading_history = false;

    // Função principal para carregar os itens
    function carrega_itens(page){
        const tbody = document.getElementById('tbody-tipos_documento');
        const loader = document.getElementById('loader-tipos_documento');
        const cont = document.getElementById('cont');
        
        tbody.innerHTML = '';
        loader.style.display = 'block';
        cont.innerHTML = '';

        const filtros = {
            search_doctype: $("#search_doctype").val().trim(),
            status_processo: $("#processo_filter").val(),
            obrigatorio: $("#obrigatorio_filter").val()
        };

        fetch(`api/tipos_documento/filtragem_tipos_documento/?page=${page}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify(filtros)
        })
        .then(res => res.json())
        .then(data => {
            if(data){
                tbody.innerHTML = gera_tabela(data.results);
                cont.innerHTML = `(${data.count})`;
                updatePagination(data.count);
            } else {
                tbody.innerHTML = '<tr><td>Não há dados</td></tr>';
                cont.innerHTML = '(0)';
            }
        })
        .catch(error => console.error('Erro:', error))
        .finally(() => {
            loading_history = false;
            loader.style.display = 'none';
        });
    }

    // Gerar tabela HTML
    function gera_tabela(index){
        console.log(index)
        if (!Array.isArray(index)) index = [index];
        if(index.length === 0) return '<tr><td colspan="5" style="text-align: center;">Nenhum dado encontrado</td></tr>';

        return index.map(item => {
            const badge = item.docobrigatorio === 'S' ? 
                '<span class="badge badge-success text-white">Sim</span>' : 
                '<span class="badge badge-danger text-white">Não</span>';

            return `
            <tr>
                <td>
                    <div class="media">
                        <div class="square-box me-2">
                            <img class="img-fluid b-r-5" src="/static/assets/images/dashboard/folder1.png" alt="">
                        </div>
                        <div class="media-body ps-2">
                            <div class="avatar-details">
                                <a href="#">
                                    <h6>${item.type_description}</h6>
                                </a>
                                <span>${item.document_type_id}</span>
                            </div>
                        </div>
                    </div>
                </td>
                <td>
                    <h6>${item.processo}</h6>
                </td>
                <td>
                    <h6>${badge}</h6>
                </td>
                <td>
                    <h6>${item.docorder}</h6>
                </td>
                <td>
                    <button class="btn btn-primary dropdown-toggle" type="button" 
                        data-bs-toggle="dropdown" aria-expanded="false">
                        Opções
                    </button>
                    <div class="dropdown-menu">
                        <a class="dropdown-item" href="javascript:void(0)" 
                            onclick="tipos_documento.deletetipos_documento(${item.document_type_id})">
                            Excluir
                        </a>
                        <a class="dropdown-item" href="javascript:void(0)" 
                            data-bs-toggle="modal" data-bs-target="#addtipos_documento" 
                            onclick="tipos_documento.editartipos_documento(${item.document_type_id})">
                            Editar
                        </a>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    document.getElementById('toggleToken').addEventListener('click', function() {
        const input = document.getElementById('tokentypedoc');
        const icon = this.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    });
    // Paginação
    function updatePagination(count) {
        totalPages = Math.ceil(count / 10);
        const pagination = document.getElementById('pagination-tipos_documento');
        
        while (pagination.children.length > 2) {
            pagination.removeChild(pagination.children[1]);
        }

        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === currentPage ? 'active' : ''}`;
            
            const a = document.createElement('a');
            a.className = 'page-link';
            a.href = 'javascript:void(0)';
            a.textContent = i;
            a.addEventListener('click', () => loadPage(i));
            
            li.appendChild(a);
            pagination.insertBefore(li, document.getElementById('next-page-tipos_documento'));
        }

        document.getElementById('previous-page-tipos_documento').classList.toggle('disabled', currentPage === 1);
        document.getElementById('next-page-tipos_documento').classList.toggle('disabled', currentPage === totalPages);
    }

    function loadPage(page) {
        currentPage = page;
        carrega_itens(page);
    }

    // Inicialização
    function init(){
        // Typeahead
        (function ($) {
            var bestPictures = new Bloodhound({
              datumTokenizer: Bloodhound.tokenizers.obj.whitespace("value"),
              queryTokenizer: Bloodhound.tokenizers.whitespace,
              prefetch: "",
              remote: {
                url: `api/tipos_documento/busca/?query=%QUERY`,
                wildcard: "%QUERY",
                filter: function (response) {
                  return response; // Assumindo que a API retorna a lista diretamente
                }
              }
            });
          
            $(".faq-form .typeahead").on('typeahead:asyncrequest', function () {
              // Mostrar indicador de carregamento
              $(".loading-indicator-itens").show();
            });
          
            $(".faq-form .typeahead").on('typeahead:asyncreceive', function () {
              // Esconder indicador de carregamento
              $(".loading-indicator-itens").hide();
            });
          
            $(".faq-form .typeahead").typeahead(null, {
              name: "type_description",
              display: 'type_description',
              limit: 15,
              source: bestPictures
            })
          
            $(".faq-form .typeahead").on('input', function() {
              if ($(this).val() === '') {
                $(".loading-indicator-itens").hide();
              }
            })
          })(jQuery);
        // Eventos
        $('#filtrar-tipos_documento').on('click', () => {
            currentPage = 1;
            carrega_itens(currentPage);
        });

        document.getElementById('previous-page-tipos_documento').addEventListener('click', () => {
            if (currentPage > 1) loadPage(currentPage - 1);
        });

        document.getElementById('next-page-tipos_documento').addEventListener('click', () => {
            if (currentPage < totalPages) loadPage(currentPage + 1);
        });

        // Salvar
        $("#salvar-tipos_documento").on("click", function(){
           let f = save_doctype()
           console.log("F", f)
        })

        

        // Exportar usando o endpoint universal
        $("#export_btn_doctype").on('click', function(){
            Swal.fire({
                title: 'Aguarde',
                text: 'Preparando exportação...', // Mensagem mais genérica
                showConfirmButton: false,
                willOpen: () => Swal.showLoading()
            });

            // 1. Definir os parâmetros para o endpoint universal
            const exportFormat = $("#export_format").val()?.toLowerCase().trim() || 'csv';
            const modelName = 'recrutamento.DocumentTypes';

            // Define os campos TÉCNICOS que você quer exportar
            const fieldsToExport = [
                'document_type_id',
                'type_description',
                'document_type_std__processo', // CORRIGIDO: Campo técnico para Processo
                'docobrigatorio',
                'docorder',
                'help_text',
                'dtcadastro'
            ];

            // Define o mapeamento de nomes técnicos para nomes amigáveis (Labels)
            // Use os nomes exibidos no cabeçalho da tabela HTML
            const fieldLabels = {
                'document_type_id': 'ID', // Label para ID (não está na tabela, mas pode ser útil)
                'type_description': 'Tipo Documento',
                'document_type_std__processo': 'Processo', // Label para o campo corrigido
                'docobrigatorio': 'Obrigatório',
                'docorder': 'Ordem',
                'help_text': 'Texto Ajuda', // Label para help_text
                'dtcadastro': 'Data Cadastro' // Label para dtcadastro
            };

            // 2. Coletar filtros (opcional)
            const filters = {
                type_description__icontains: $("#search_doctype").val()?.trim(),
                // Ajuste o filtro de processo se necessário:
                document_type_std__processo: $("#processo_filter").val(),
                docobrigatorio: $("#obrigatorio_filter").val()
            };
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

        // Carregar inicial
        carrega_itens(1);
    }

    function save_doctype() {
        // Mostrar o loading imediatamente
        Swal.fire({
            title: 'Aguarde',
            text: 'Salvando Tipo documento...',
            showConfirmButton: false,
            willOpen: () => Swal.showLoading()
        });
    
        // Criar FormData e validar campos
        const formData = new FormData();
        formData.append('type_description', $("#type_description").val());
        formData.append('document_type_std', $("#document_type_std_id").val());
        formData.append('docobrigatorio', $("#docobrigatorio").val());
        formData.append('docorder', $("#docorder").val());
        formData.append('flow_id', $("#flow_id").val());
        formData.append('help_text', $("#help_text").val());
    
        // Validação síncrona (antes do fetch)
        if (!formData.get('type_description')) {
            Swal.close(); // Fechar loading antes de mostrar o erro
            Swal.fire({
                text: "Preencha o campo Tipo de documento!",
                icon: "error",
                confirmButtonText: "Ok",
                customClass: { confirmButton: "btn btn-primary" }
            });
            return Promise.reject("Validation Error: Tipo de documento obrigatório");
        }
    
        if (!formData.get('document_type_std')) {
            Swal.close(); // Fechar loading antes de mostrar o erro
            Swal.fire({
                text: "Preencha o campo Grupo de documento!",
                icon: "error",
                confirmButtonText: "Ok",
                customClass: { confirmButton: "btn btn-primary" }
            });
            return Promise.reject("Validation Error: Grupo de documento obrigatório");
        }
    
        const url = editar_tipo ? `api/tipos_documento/${id_tipo}/` : "api/tipos_documento/";
        const method = editar_tipo ? 'PATCH' : 'POST';
    
        // Retornar a Promise do fetch para ser aguardada externamente
        return fetch(url, {
            method: method,
            headers: { 'X-CSRFToken': csrftoken },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.document_type_id) {
                id_documento = data.document_type_id; // Atualiza o ID global
                Swal.fire({
                    text: "Salvo tipo documento!",
                    icon: "success",
                    confirmButtonText: "Ok",
                    customClass: { confirmButton: "btn btn-primary" }
                });
                carrega_itens(1);
                return data; // Resolve a Promise com os dados
            } else {
                throw new Error("Erro no servidor");
            }
        })
        .catch(error => {
            Swal.fire("Erro", "Ocorreu um erro ao salvar", "error");
            throw error; // Propaga o erro para quem chamar a função
        })
        .finally(() => {
            Swal.close(); // Fecha o loading em todos os casos
        });
    }
    // Funções públicas
    function deletetipos_documento(id) {
        Swal.fire({
            title: 'Tem certeza?',
            text: "Esta ação não pode ser revertida!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim, excluir!'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Aguarde',
                    text: 'Excluindo...',
                    icon: 'info',
                    showConfirmButton: false,
                    willOpen: () => Swal.showLoading()
                });
                fetch(`api/tipos_documento/${id}/`, {
                    method: "DELETE",
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken,
                    },
                })
                .then(response => {
                    if (response.status === 204) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Excluído!',
                            showConfirmButton: false,
                            timer: 1500
                        });
                        carrega_itens(1);
                    } else {
                        Swal.fire('Erro!', 'Falha na exclusão', 'error');
                    }
                })
                .catch(error => console.error('Erro:', error));
            }
        });
    }

    function editartipos_documento(id){
        editar_tipo = true;
        id_tipo = id;
        id_documento = id;

        Swal.fire({
            title: 'Carregando...',
            showConfirmButton: false,
            willOpen: () => Swal.showLoading()
        });

        fetch(`api/tipos_documento/${id}/`)
            .then(response => response.json())
            .then(data => {
                $("#type_description").val(data.type_description);
                $("#document_type_std_id").val(data.document_type_std).trigger('change');
                $("#docobrigatorio").val(data.docobrigatorio).trigger('change');
                $("#docorder").val(data.docorder);
                $("#flow_id").val(data.flow_id);
                $("#help_text").val(data.help_text);
                campos.carrega_itens(1)
            })
            .catch(() => Swal.fire('Erro!', 'Falha ao carregar', 'error'))
            .finally(() => Swal.close());
    }

    function newVaga(){
        editar_tipo = false;
        id_tipo = 0;
        editar_campos = false;
        id_campos = 0;
        id_documento = ''
        $("#type_description").val('');
        $("#document_type_std_id").val('').trigger('change');
        $("#docobrigatorio").val('').trigger('change');
        $("#docorder").val('');
        $("#flow_id").val('');
        $("#help_text").val('');
        $("#fieldsearch").val('');
        $("#fieldobg").val('N').trigger('change');
        $("#fieldorder").val('')
        $("#tokenfield").val('')
        $("#tokenged_tipodoc").val('')
    }

    function update_select(){
        fetch('api/std/')
        .then(response => response.json())
        .then(data => {
            $("#document_type_std_id").empty().append('<option value="">Selecione</option>');
            $.each(data, function(key, value) {
                $("#document_type_std_id").append('<option value="' + value.document_type_std_id + '">' + value.document_type_std + '</option>');
            })

        })
    }
    update_select()

    return {
        init: init,
        deletetipos_documento: deletetipos_documento,
        editartipos_documento: editartipos_documento,
        newVaga: newVaga,
        carrega_itens: carrega_itens,
        update_select: update_select,
        save_doctype:save_doctype
    };
})();

tipos_documento.init();