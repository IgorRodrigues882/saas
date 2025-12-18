"use strict";

const csrftoken = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='))?.split('=')[1] || null;

var flows = (function(){
    let tabela_scroll;
    let btn_importa_csv;
    let currentPage = 1;
    let totalPages = 1;
    let editar_candidate = false;
    let id_candidate = 0;
    let loading_history = false;

    // Funções auxiliares
    function formatarData(dataString) {
        if(!dataString) return '-';
        const opcoes = {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        return new Intl.DateTimeFormat('pt-BR', opcoes).format(new Date(dataString));
    }

    function formatarCPFouCNPJ(valor) {
        if (!valor) return '';
        const cleaned = valor.toString().replace(/\D/g, '');
        return cleaned.length === 11 ? 
            cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") :
            cleaned.length === 14 ? 
            cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5") :
            valor;
    }

    // Função principal para carregar os itens
    function carrega_itens(page){
        const tbody = document.getElementById('tbody');
        const loader = document.getElementById('loader');
        const cont = document.getElementById('cont');
        
        tbody.innerHTML = '';
        loader.style.display = 'block';
        cont.innerHTML = '';

        const filtros = {
            "search-flows": $("#search_flows").val().trim(),
        };

        fetch(`api/flows/filtragem_flows/?page=${page}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify(filtros)
        })
        .then(res => res.json())
        .then(data => {
            if(data?.results){
                tbody.innerHTML = gera_tabela(data.results);
                cont.innerHTML = `(${data.count})`;
                updatePagination(data.count);
            } else {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhum dado encontrado</td></tr>';
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
        if (!Array.isArray(index)) index = [index];
        if(index.length === 0) return '<tr><td colspan="4" style="text-align: center;">Nenhum dado encontrado</td></tr>';

        return index.map(item => {
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
                                    <h6>${item.title}</h6>
                                </a>
                                <span>${item.n8n_workflow_id}</span>
                            </div>
                        </div>
                    </div>
                </td>
                <td><h6 class="descricao" title="${item.description}">${item.description}</h6></td>
                <td><h6 class="descricao" title="${item.n8n_workflow_id}">${item.n8n_workflow_id}</h6></td>
                <td>
                    <button class="btn btn-primary dropdown-toggle" type="button" 
                        data-bs-toggle="dropdown" aria-expanded="false">
                        Opções
                    </button>
                    <div class="dropdown-menu">
                        <a class="dropdown-item" href="javascript:void(0)" 
                            onclick="flows.deleteFlow('${item.n8n_workflow_id}')">
                            Excluir
                        </a>
                        <a class="dropdown-item" target="_blank" href="/drawflow/${item.n8n_workflow_id}/">
                            Editar
                        </a>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    // Paginação
    function updatePagination(count) {
        totalPages = Math.ceil(count / 15);
        const pagination = document.getElementById('pagination');
        
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
            pagination.insertBefore(li, document.getElementById('next-page'));
        }

        document.getElementById('previous-page').classList.toggle('disabled', currentPage === 1);
        document.getElementById('next-page').classList.toggle('disabled', currentPage === totalPages);
    }

    function loadPage(page) {
        currentPage = page;
        carrega_itens(page);
    }

    // CRUD Operations
    // function saveCandidate() {
    //     // --- Validação de Datas ---
    //     const agora = new Date();
    //     const dtInicioVal = $("#dtiniciopreenchimento").val();
    //     const dtEnvioVal = $("#dtenvioflow").val();

    //     if (dtInicioVal) {
    //         const dtInicio = new Date(dtInicioVal);
    //         if (dtInicio < agora) {
    //             Swal.fire("Erro", "A 'Data Início Preenchimento' não pode ser anterior à data/hora atual.", "error");
    //             return;
    //         }
    //     }

    //     if (dtEnvioVal) {
    //         const dtEnvio = new Date(dtEnvioVal);
    //         if (dtEnvio < agora) {
    //             Swal.fire("Erro", "A 'Data Envio Flow' não pode ser anterior à data/hora atual.", "error");
    //             return;
    //         }
    //     }
    //     // --- Fim Validação de Datas ---


    //     Swal.fire({
    //         title: 'Aguarde',
    //         text: 'Salvando candidato...',
    //         showConfirmButton: false,
    //         willOpen: () => Swal.showLoading()
    //     });

    //     const formData = new FormData();
    //     formData.append('candidate', $("#candidate").val().trim());
    //     formData.append('status_id', $("#status_id").val());
    //     formData.append('sex', $("#sex").val());
    //     formData.append('phone', $("#phone").val().trim());
    //     formData.append('email', $("#email").val().trim());
    //     formData.append('cpf', $("#cpf").val().trim());
    //     formData.append('unidade_id', $("#unidade_id").val());
    //     formData.append('job_id', $("#job_id").val());
    //     formData.append('recrutador_id', $("#recrutador_id").val());
    //     formData.append('dtiniciopreenchimento', $("#dtiniciopreenchimento").val());
    //     formData.append('dtenvioflow', $("#dtenvioflow").val());
    //     formData.append('tokencandidate', $("#tokencandidate").val().trim());
    //     formData.append('notasinternas', $("#notasinternas").val());
    //     if($("#photo_candidate")[0].files[0]) formData.append('photo_candidate', $("#photo_candidate")[0].files[0]);

    //     // Validações
    //     if (!formData.get('candidate')) {
    //         Swal.fire("Erro", "Preencha o campo Candidato!", "error");
    //         return;
    //     }

    //     const url = editar_candidate ? `api/candidatos/${id_candidate}/` : "api/candidatos/";
    //     const method = editar_candidate ? 'PATCH' : 'POST';

    //     fetch(url, {
    //         method: method,
    //         headers: { 'X-CSRFToken': csrftoken },
    //         body: formData
    //     })
    //     .then(async response => { // Adiciona async para usar await no response.json() em caso de erro
    //         if (response.ok) {
    //             // Se a resposta for OK (status 2xx), processa como sucesso
    //             return response.json();
    //         } else {
    //             // Se a resposta não for OK, tenta extrair os erros do corpo JSON
    //             let errorData;
    //             try {
    //                 errorData = await response.json(); // Tenta parsear o JSON de erro
    //             } catch (e) {
    //                 // Se não conseguir parsear, cria um erro genérico com o status HTTP
    //                 throw new Error(`Erro ${response.status}: ${response.statusText}`);
    //             }
    //             // Rejeita a promessa com os dados de erro para o bloco .catch tratar
    //             return Promise.reject(errorData);
    //         }
    //     })
    //     .then(data => {
    //         // Este bloco só executa se a resposta foi OK
    //         if(data.candidate_id){
    //             Swal.fire("Sucesso", "Candidato salvo!", "success");
    //             $('#addcandidato').modal('hide'); // Fecha o modal após salvar com sucesso
    //             carrega_itens(currentPage); // Recarrega a página atual
    //         } else {
    //              // Caso inesperado onde a resposta foi OK mas não tem candidate_id
    //             console.error("Resposta OK, mas sem ID do candidato:", data);
    //             Swal.fire("Erro Inesperado", "Ocorreu um problema ao salvar o candidato.", "error");
    //         }
    //     })
    //     .catch(error => {
    //         // Trata erros de rede ou erros rejeitados pelo bloco .then anterior
    //         console.error('Erro ao salvar candidato:', error);
    //         let errorMessage = "Ocorreu um erro desconhecido.";

    //         if (error instanceof Error) {
    //             // Erro de rede ou erro lançado manualmente (ex: falha ao parsear JSON de erro)
    //             errorMessage = error.message;
    //         } else if (typeof error === 'object' && error !== null) {
    //             // Erro vindo do backend (provavelmente validação do serializer)
    //             // Formata as mensagens de erro
    //             errorMessage = Object.entries(error).map(([field, messages]) => {
    //                 // Pega a primeira mensagem de erro para cada campo
    //                 return `${field}: ${Array.isArray(messages) ? messages[0] : messages}`;
    //             }).join('<br>'); // Junta as mensagens com quebra de linha HTML
    //         }

    //         Swal.fire({
    //             title: "Erro ao Salvar",
    //             html: errorMessage, // Usa html para permitir as quebras de linha
    //             icon: "error"
    //         });
    //     })
    //     .finally(() => {
    //         // Garante que o loading do Swal seja fechado mesmo em caso de erro não tratado pelo Swal.fire
    //          if (Swal.isLoading()) {
    //              Swal.close();
    //          }
    //     });
    // }

    function deleteFlow(id) {
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
                    showConfirmButton: false,
                    willOpen: () => Swal.showLoading()
                });
                fetch(`/pt/api/flows/${id}/`, {
                    method: "DELETE",
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken,
                    },
                })
                .then(response => {
                    if (response.status === 204) {
                        Swal.fire("Sucesso", "Flow excluído!", "success");
                        carrega_itens(1);
                    } else {
                        Swal.fire("Erro", "Falha na exclusão", "error");
                    }
                })
                .catch(error => console.error('Erro:', error));
            }
        });
    }

function formatDateForInput(dateString) {
    // Retorna string vazia se a data for nula, indefinida ou vazia
    if (!dateString) {
        return "";
    }
    try {
        // Cria um objeto Date. Assume que a string da API está em UTC ou formato ISO reconhecível.
        const dateUTC = new Date(dateString);

        // Verifica se a data resultante é válida
        if (isNaN(dateUTC.getTime())) {
            console.error("Formato de data inválido recebido:", dateString);
            return ""; // Retorna vazio se a data for inválida
        }

        // Calcula o timestamp para o fuso horário de São Paulo (UTC-3)
        // Subtrai 3 horas (em milissegundos) do timestamp UTC
        const saoPauloOffset = 3 * 60 * 60 * 1000;
        const dateSaoPaulo = new Date(dateUTC.getTime() - saoPauloOffset);

        // Extrai os componentes ANO, MES, DIA, HORA, MINUTO usando os métodos getUTC*
        // do objeto 'dateSaoPaulo'. Usar getUTC* aqui garante que peguemos os valores
        // numéricos corretos que representam a hora de São Paulo, sem que o JS
        // tente converter novamente para o fuso do navegador.
        const year = dateSaoPaulo.getUTCFullYear();
        const month = (dateSaoPaulo.getUTCMonth() + 1).toString().padStart(2, '0'); // getUTCMonth é 0-11
        const day = dateSaoPaulo.getUTCDate().toString().padStart(2, '0');
        const hours = dateSaoPaulo.getUTCHours().toString().padStart(2, '0');
        const minutes = dateSaoPaulo.getUTCMinutes().toString().padStart(2, '0');

        // Formato exigido pelo input datetime-local: YYYY-MM-DDTHH:mm
        return `${year}-${month}-${day}T${hours}:${minutes}`;

    } catch (error) {
        // Captura erros inesperados durante a conversão
        console.error("Erro ao formatar data para input:", dateString, error);
        return ""; // Retorna vazio em caso de erro
    }
}

    function editarFlow(id){
        
    }

    // Inicialização
    function init(){
        // Typeahead
        (function ($) {
            const bloodhound = new Bloodhound({
              datumTokenizer: Bloodhound.tokenizers.obj.whitespace("value"),
              queryTokenizer: Bloodhound.tokenizers.whitespace,
              remote: {
                url: `api/flows/busca/?query=%QUERY`,
                wildcard: "%QUERY"
              }
            });
          
            $(".faq-form .typeahead")
              .typeahead(null, {
                name: "candidate",
                display: 'candidate',
                limit: 15,
                source: bloodhound
              })
              .on('typeahead:asyncrequest', () => $(".loading-indicator-itens").show())
              .on('typeahead:asyncreceive', () => $(".loading-indicator-itens").hide());
        })(jQuery);

        // Eventos
        $('#filtrar').on('click', () => {
            currentPage = 1;
            carrega_itens(currentPage);
        });

        // $("#salvar_candidate").on("click", saveCandidate);

        // Máscaras
        Inputmask({ mask: '999.999.999-99' }).mask($("#cpf"));
        Inputmask({ mask: '(99) 99999-9999' }).mask($("#phone"));

        // --- Funcionalidade de Exportação ---
        const exportBtn = document.getElementById('export_btn');
        const exportFormatSelect = document.getElementById('export_format');
        const exportModalElement = document.getElementById('exportVaga'); // Assumindo que o ID do modal é 'exportVaga'

        if (exportBtn && exportFormatSelect && exportModalElement) {
            const exportModal = new bootstrap.Modal(exportModalElement); // Inicializa a instância do modal Bootstrap

            exportBtn.addEventListener('click', async () => {
                const exportFormat = exportFormatSelect.value;
                if (!exportFormat) {
                    Swal.fire("Atenção", "Por favor, selecione um formato para exportação.", "warning");
                    return;
                }

                // Feedback visual - Início
                exportBtn.disabled = true;
                const originalButtonText = exportBtn.innerHTML; // Salva o texto original
                exportBtn.innerHTML = `
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Exportando...
                `;

                // Definição dos campos e rótulos para exportação
                const fieldsToExport = [
                    'title', 'description', 'n8n_workflow_id', 'cadastro_dt'
                ];
                const fieldLabels = {
                    'title': 'Título',
                    'description': 'Descrição',
                    'n8n_workflow_id': 'ID',
                    'Cadastro': 'cadastro_dt',
                };

                // Obter filtros atuais da interface (reutilizando a lógica de carrega_itens)
                const currentFilters = {
                    "search-flows": $("#search_flows").val().trim(),
                };
                // Remover filtros vazios ou nulos para não enviar chaves desnecessárias
                Object.keys(currentFilters).forEach(key => {
                    if (currentFilters[key] === null || currentFilters[key] === undefined || currentFilters[key] === '') {
                        delete currentFilters[key];
                    }
                });


                const payload = {
                    model_name: 'wpp_templates.flows',
                    export_format: exportFormat,
                    fields: fieldsToExport,
                    field_labels: fieldLabels,
                    filters: currentFilters // Envia os filtros aplicados na interface
                };

                try {
                    const response = await fetch('api/export/exporta/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrftoken, // Reutiliza o token CSRF obtido no início do script
                        },
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.style.display = 'none';
                        a.href = url;

                        // Gerar nome do arquivo dinâmico
                        const now = new Date();
                        const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
                        a.download = `flows_export_${timestamp}.${exportFormat}`;

                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        a.remove();

                        // Fechar o modal Bootstrap após sucesso
                        exportModal.hide();
                        Swal.fire("Sucesso", "Exportação iniciada. O download começará em breve.", "success");

                    } else {
                        // Tratar erro da API
                        let errorMessage = `Erro ${response.status}: ${response.statusText}`;
                        try {
                            const errorData = await response.json();
                            errorMessage = errorData.detail || errorData.error || JSON.stringify(errorData); // Tenta pegar mensagens de erro comuns
                        } catch (e) {
                            // Se não conseguir parsear o JSON, usa o statusText
                        }
                        console.error("Erro na exportação:", errorMessage);
                        Swal.fire("Erro na Exportação", `Falha ao exportar dados: ${errorMessage}`, "error");
                    }
                } catch (error) {
                    console.error('Erro na requisição fetch:', error);
                    Swal.fire("Erro na Exportação", "Falha na comunicação com o servidor ao tentar exportar.", "error");
                } finally {
                    // Feedback visual - Fim (reabilitar botão)
                    exportBtn.disabled = false;
                    exportBtn.innerHTML = originalButtonText; // Restaura o texto original
                }
            });
        } else {
            console.warn("Elementos necessários para a exportação (botão 'export_btn', select 'export_format' ou modal 'exportVaga') não foram encontrados no DOM.");
        }
        // --- Fim da Funcionalidade de Exportação ---


        // Carregar inicial
        carrega_itens(1);
    }

    return {
        init: init,
        deleteFlow: deleteFlow,
        editarFlow: editarFlow,
        newFlow: () => {
            
        }
    };
})();

flows.init();