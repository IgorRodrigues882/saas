// Garanta que o token CSRF esteja disponível neste escopo
const csrftoken = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='))?.split('=')[1] || null;
const kanbanElementId = "#demo3";
let kanbanGlobalInstance = null; // Variável para armazenar a instância globalmente


// Função para formatar data no formato dd/mm/yyyy HH:mm
function formatDate(dateString) {
    if (!dateString) return 'N/A'; // Retorna 'N/A' se a data for nula ou vazia
    try {
        const date = new Date(dateString);
        // Verifica se a data é válida
        if (isNaN(date.getTime())) {
            console.warn(`Data inválida recebida para formatação: ${dateString}`);
            return dateString; // Retorna a string original se inválida
        }

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês é base 0, então +1
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
        console.error(`Erro ao formatar data "${dateString}":`, error);
        return dateString; // Retorna a string original em caso de erro inesperado
    }
}

    // Função para criar o HTML de um card de candidato
    function createCandidateCardHtml(candidate) {
        const avatarUrl = candidate.photo_candidate || '/static/assets/images/user/3.jpg'; // Imagem padrão
        const sex = candidate.sex == 'M' ? "Masculino" : "Feminino";
        // Adapte este HTML conforme necessário
        return `
            <a class="kanban-box" href="#" data-candidate-id="${candidate.candidate_id}"><span class="badge f-right" style="background-color:${candidate.corkankan};">${candidate.status_description}</span>
                                <h6>${candidate.candidate}</h6>
                                <div class="media"><img class="img-20 me-1 rounded-circle" src="${avatarUrl}" alt="" data-original-title="" title="">
                                  <div class="media-body">
                                    <p>${candidate.job_desc}</p>
                                    <p><i class="fa fa-folder-open-o"></i> ${candidate.cpf}</p>
                                    <p><i class="fa fa-phone"></i> ${candidate.phone}</p>
                                    <p><i class="fa fa-venus-mars"></i> ${sex}</p>
                                  </div>
                                </div>
                                <div class="d-flex mt-3">
                                  <ul class="list">
                                    <li>Cadastro: ${formatDate(candidate.dtcadastro)}</li>
                                    <li>Inicio: ${formatDate(candidate.dtiniciopreenchimento)}</li>
                                  </ul>
                                  <div class="customers">
                                    <ul>
                                      <li class="d-inline-block me-3">
                                        <p class="f-12">Atualizado: ${formatDate(candidate.dtultimopreenchimento)}</p>
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                                <a href="#" class="btn btn-primay edit-candidate-btn" data-bs-toggle="modal" data-bs-target="#editCandidateModalKanban" data-candidate-id="${candidate.candidate_id}" title="Editar Candidato">Editar</a>
                                </a>
        `;
    }

(async function initializeDynamicKanban() {

    // AJUSTE OS ENDPOINTS CONFORME SUA API REAL
    const statusesApiUrl = "/pt/api/statuscandidate/all/"; // Endpoint para buscar status (colunas)
    const candidatesApiUrl = "/pt/api/candidatos/all/"; // Endpoint para buscar candidatos (cards)
    const candidateUpdateApiUrlBase = "/pt/api/candidatos/"; // Base do URL para atualizar candidato

    // Função para buscar dados da API
    async function fetchData(url) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    // Adicione o CSRF token se as views GET exigirem autenticação/sessão
                    ...(csrftoken && {'X-CSRFToken': csrftoken})
                }
            });
            if (!response.ok) {
                throw new Error(`Erro HTTP ${response.status} ao buscar ${url}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Falha ao buscar dados:", error);
            const kanbanElement = document.querySelector(kanbanElementId);
            if(kanbanElement) {
                kanbanElement.innerHTML = `<p class="text-danger">Erro ao carregar dados do Kanban: ${error.message}. Verifique o console.</p>`;
            }
            return null; // Retorna null para indicar falha
        }
    }

// Função auxiliar copiada de candidatos.js para formatar data para input datetime-local

    // Função para atualizar o status do candidato no backend
    async function updateCandidateStatus(candidateId, newStatusId) {
        console.log(`Atualizando status do candidato ${candidateId} para ${newStatusId}`);
        const updateUrl = `${candidateUpdateApiUrlBase}${candidateId}/`;
        // Adiciona um feedback visual temporário ao card
        const cardElement = document.querySelector(`${kanbanElementId} [data-candidate-id="${candidateId}"]`);
        if (cardElement) cardElement.classList.add('kanban-card-saving');

        try {
            const response = await fetch(updateUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ status_id: newStatusId })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: `Erro ${response.status}` }));
                throw new Error(errorData.detail || JSON.stringify(errorData));
            }

            console.log(`Status do candidato ${candidateId} atualizado com sucesso.`);
            // Opcional: Adicionar feedback visual de sucesso (ex: toastr)
            // toastr.success('Status atualizado!');

        } catch (error) {
            console.error(`Falha ao atualizar status do candidato ${candidateId}:`, error);
            // Opcional: Adicionar feedback visual de erro (ex: toastr)
            // toastr.error(`Erro ao atualizar status: ${error.message}`);
            alert(`Erro ao atualizar status: ${error.message}. A alteração visual pode não ter sido salva.`);
            // Considerar reverter a mudança visual aqui (mais complexo)
        } finally {
             // Remove o feedback visual do card
             if (cardElement) cardElement.classList.remove('kanban-card-saving');
        }
    }

    // --- Início da Lógica Principal ---
    console.log("Iniciando carregamento do Kanban dinâmico...");
    const kanbanContainer = document.querySelector(kanbanElementId);
    if (!kanbanContainer) {
        console.error(`Elemento Kanban "${kanbanElementId}" não encontrado no DOM.`);
        return;
    }
    // Adiciona um indicador de carregamento
    kanbanContainer.innerHTML = '<p>Carregando Kanban...</p>';

    // 1. Buscar Status (Colunas) e Candidatos (Itens) em paralelo
    const [statusesResponse, candidatesResponse] = await Promise.all([
        fetchData(statusesApiUrl),
        fetchData(candidatesApiUrl)
    ]);

    // Verifica se ambas as buscas foram bem-sucedidas
    if (!statusesResponse || !candidatesResponse) {
        console.error("Não foi possível carregar todos os dados necessários para o Kanban.");
        // Mensagem de erro já foi exibida por fetchData
        return;
    }

    // Limpa o indicador de carregamento
    kanbanContainer.innerHTML = '';

    // Assume que a resposta está em 'results' se for paginada, ou é o array direto
    const statuses = statusesResponse.results || statusesResponse;
    const candidates = candidatesResponse.results || candidatesResponse;

    if (!Array.isArray(statuses) || !Array.isArray(candidates)) {
         console.error("Formato inesperado dos dados recebidos da API.");
         kanbanContainer.innerHTML = '<p class="text-danger">Erro: Formato de dados inválido recebido da API.</p>';
         return;
    }

    console.log("Status recebidos:", statuses);
    console.log("Candidatos recebidos:", candidates);

    // 2. Preparar a estrutura de 'boards' para o jKanban
    const kanbanBoards = statuses.map(status => ({
        id: String(status.status_id),
        title: status.status_description || `Status ${status.status_id}`,
        class: status.corkankan || 'primary', // Classe CSS para cor da coluna
        item: []
    }));

    // 3. Distribuir os candidatos nas colunas corretas
    const candidatesByStatus = {}; // Objeto para agrupar candidatos por status_id
    statuses.forEach(status => {
        candidatesByStatus[String(status.status_id)] = []; // Inicializa array para cada status
    });

    candidates.forEach(candidate => {
        const statusIdStr = String(candidate.status_id);
        if (candidatesByStatus.hasOwnProperty(statusIdStr)) {
            candidatesByStatus[statusIdStr].push({
                id: String(candidate.candidate_id),
                title: createCandidateCardHtml(candidate),
                // candidateData: candidate // Opcional: guardar dados completos
            });
        } else {
            console.warn(`Status ID ${statusIdStr} do candidato ${candidate.candidate_id} não encontrado nas colunas. Candidato ignorado.`);
        }
    });

    // Adiciona os itens aos boards preparados
    kanbanBoards.forEach(board => {
        board.item = candidatesByStatus[board.id] || [];
    });


    console.log("Estrutura de Boards pronta para jKanban:", kanbanBoards);

    // 4. Inicializar o jKanban com os dados dinâmicos
    try {
        const kanbanInstance = new jKanban({
            element: kanbanElementId,
            gutter: "15px",
            widthBoard: "280px", // Ajuste a largura
            responsivePercentage: false,
            dragBoards: false, // Desabilitar arrastar colunas por padrão
            dragItems: true,
            boards: kanbanBoards,
            dropEl: function (el, target, source, sibling) {
                const candidateId = el.dataset.eid; // ID do candidato (card)
                const newStatusId = target?.parentElement?.dataset?.id; // ID da nova coluna (status)
                const oldStatusId = source?.parentElement?.dataset?.id; // ID da coluna antiga

                console.log("Drop Event:", { candidateId, newStatusId, oldStatusId });

                if (candidateId && newStatusId && newStatusId !== oldStatusId) {
                    // Encontrar informações do novo status (descrição e cor)
                    const newStatusInfo = kanbanBoards.find(board => board.id === newStatusId);

                    if (newStatusInfo) {
                        // Atualizar o badge dentro do card movido (el)
                        const badgeElement = el.querySelector('.badge.f-right');
                        if (badgeElement) {
                            console.log(`Atualizando badge para Status: ${newStatusInfo.title}, Cor: ${newStatusInfo.class}`);
                            badgeElement.textContent = newStatusInfo.title; // Atualiza o texto do status
                            badgeElement.style.backgroundColor = newStatusInfo.class; // Atualiza a cor de fundo
                        } else {
                            console.warn("Elemento .badge.f-right não encontrado no card:", el);
                        }
                    } else {
                        console.warn(`Informações para o novo status ID ${newStatusId} não encontradas em kanbanBoards.`);
                    }

                    // Chamar a função para atualizar o status no backend
                    updateCandidateStatus(candidateId, newStatusId);

                } else if (newStatusId === oldStatusId) {
                    console.log(`Card ${candidateId} solto na mesma coluna (${newStatusId}). Nenhuma atualização necessária.`);
                } else {
                    console.error("Não foi possível obter ID do candidato ou ID da nova/antiga coluna no drop.", { el, target, source });
                }
            },
            // click: function (el, event) { // Adiciona 'event' para verificar o target do clique
            //     const targetElement = event.target; // O elemento exato que foi clicado
            //     const candidateId = el.dataset.eid; // ID do candidato associado ao card (el)

                
            // },
        });
        console.log("Instância jKanban inicializada:", kanbanInstance);
        kanbanGlobalInstance = kanbanInstance; // Armazena a instância globalmente
        kanbanContainer.addEventListener('click', function(event) {
            const target = event.target;
            console.log("clicou", target);
            if (target) {
                const candidateId = target.dataset.candidateId;
                
                if (candidateId) {
                    event.preventDefault();
                    event.stopPropagation();
                    openEditModal(candidateId);
                } else {
                    // Comportamento ao clicar no card (não no botão editar)
                    console.log(`Card clicado: ${candidateId}`);
                }
            }
        });
    } catch(e) {
        console.error("Erro ao inicializar jKanban:", e);
        kanbanContainer.innerHTML = `<p class="text-danger">Erro ao inicializar o quadro Kanban.</p>`;
    }

})(); // Executa a função assíncrona imediatamente

function formatDateForInput(dateString) {
    if (!dateString) return "";
    try {
        // Cria objeto Date diretamente da string ISO 8601 (UTC)
        const date = new Date(dateString);
        
        if (isNaN(date.getTime())) {
            console.error("Formato de data inválido recebido:", dateString);
            return "";
        }

        // Extrai componentes UTC diretamente
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');

        // Formato ISO 8601 sem segundos e sem offset (YYYY-MM-DDTHH:mm)
        return `${year}-${month}-${day}T${hours}:${minutes}`;

    } catch (error) {
        console.error("Erro ao formatar data para input:", dateString, error);
        return "";
    }
}
// --- Funções para o Modal de Edição ---

// Função para buscar dados do candidato e abrir o modal
async function openEditModal(candidateId) {
    console.log(`Abrindo modal para editar candidato ID: ${candidateId}`);
    const modalElement = document.getElementById('editCandidateModalKanban');
    const modalForm = modalElement.querySelector('#edit-candidate-form-kanban');

    // Resetar formulário e mostrar loading (opcional, mas bom)
    modalForm.reset();
    // Limpar preview da imagem
    const photoPreview = document.getElementById('edit_photo_preview');
    if(photoPreview) {
        photoPreview.style.display = 'none';
        photoPreview.src = '#';
    }
    document.getElementById('edit_photo_candidate').value = ''; // Limpa seleção de arquivo

    modalForm.dataset.candidateId = ''; // Limpa o ID anterior
    // Adicionar um spinner ou texto de carregamento aqui, se desejar
    Swal.fire({
        title: 'Aguarde',
        text: 'Carregando...',
        showConfirmButton: false,
        willOpen: () => Swal.showLoading()
    });

    // Armazena o ID no formulário para uso posterior no save
    modalForm.dataset.candidateId = candidateId;

    // Buscar dados do candidato e opções dos selects em paralelo
    try {
        const [candidateResponse, _] = await Promise.all([
            fetch(`/pt/api/candidatos/${candidateId}/`, {
                 headers: {
                    'Accept': 'application/json',
                    ...(csrftoken && {'X-CSRFToken': csrftoken}) // Adiciona CSRF se necessário para GET
                }
            }),
            loadSelectOptions() // Carrega as opções enquanto busca os dados
        ]);

        if (!candidateResponse.ok) {
            throw new Error(`Erro ${candidateResponse.status} ao buscar dados do candidato.`);
        }
        const candidateData = await candidateResponse.json();
        console.log("Dados do candidato recebidos:", candidateData);

        // Preencher o formulário com os dados recebidos
        populateEditForm(candidateData);

        // Ajusta o título do modal
        modalElement.querySelector('.modal-title').textContent = `Editar Candidato: ${candidateData.candidate || 'ID ' + candidateId}`;
        Swal.close()

    } catch (error) {
        console.error("Falha ao carregar dados do candidato para edição:", error);
        Swal.fire("Erro", `Não foi possível carregar os dados do candidato: ${error.message}`, "error");
        modalElement.querySelector('.modal-title').textContent = "Erro ao carregar"; // Atualiza título em caso de erro
    } finally {
        // Remover spinner/loading aqui, se adicionado
    }
}

// Função para preencher o formulário do modal com os dados
function populateEditForm(data) {
    document.getElementById('edit_candidate_name').value = data.candidate || '';
    // Os selects serão preenchidos pelo loadSelectOptions, mas setamos o valor aqui
    // para que seja selecionado corretamente após as opções carregarem.
    document.getElementById('edit_status_id').value = data.status_id || '';
    document.getElementById('edit_sex').value = data.sex || '';
    document.getElementById('edit_phone').value = data.phone || '';
    document.getElementById('edit_email').value = data.email || '';
    document.getElementById('edit_cpf').value = data.cpf || '';
    document.getElementById('edit_unidade_id').value = data.unidade_id || '';
    document.getElementById('edit_job_id').value = data.job_id || '';
    document.getElementById('edit_recrutador_id').value = data.recrutador_id || '';
    document.getElementById('edit_dtiniciopreenchimento').value = formatDateForInput(data.dtiniciopreenchimento);
    document.getElementById('edit_dtenvioflow').value = formatDateForInput(data.dtenvioflow);
    document.getElementById('edit_tokencandidate').value = data.tokencandidate || '';
    document.getElementById('edit_notasinternas').value = data.notasinternas || '';

    // Lidar com a foto (mostrar preview se existir)
    const photoPreview = document.getElementById('edit_photo_preview');
    if (data.photo_candidate) {
        photoPreview.src = data.photo_candidate;
        photoPreview.style.display = 'block';
    } else {
        photoPreview.style.display = 'none';
        photoPreview.src = '#';
    }
     // Limpar o input de arquivo, pois não queremos reenviar a foto antiga por padrão
    document.getElementById('edit_photo_candidate').value = '';

    // Aplicar máscaras (precisa do Inputmask carregado)
    // Garante que Inputmask esteja disponível antes de usar
    if (typeof Inputmask !== 'undefined') {
        // Remove máscaras antigas antes de aplicar novas (caso o modal seja reutilizado)
        Inputmask.remove(document.getElementById('edit_cpf'));
        Inputmask.remove(document.getElementById('edit_phone'));

        Inputmask({ mask: '999.999.999-99', clearIncomplete: true }).mask(document.getElementById('edit_cpf'));
        Inputmask({ mask: '(99) 99999-9999', clearIncomplete: true }).mask(document.getElementById('edit_phone'));
    } else {
        console.warn("Inputmask não está definido. Máscaras não aplicadas no modal.");
    }

    // Tenta selecionar os valores nos selects novamente, caso as opções já tenham carregado
    document.getElementById('edit_status_id').value = data.status_id || '';
    document.getElementById('edit_unidade_id').value = data.unidade_id || '';
    document.getElementById('edit_job_id').value = data.job_id || '';
    document.getElementById('edit_recrutador_id').value = data.recrutador_id || '';
}

// Função para carregar opções dos selects
async function loadSelectOptions() {
    console.log("Carregando opções para selects...");
    const statusSelect = document.getElementById('edit_status_id');
    const unidadeSelect = document.getElementById('edit_unidade_id');
    const jobSelect = document.getElementById('edit_job_id');
    const recrutadorSelect = document.getElementById('edit_recrutador_id');

    // URLs das APIs (ajustar conforme necessário)
    const urls = {
        status: '/pt/api/statuscandidate/all/',
        unidade: '/api/unidades/all/', // Endpoint hipotético para unidades
        job: '/pt/api/vagas/all/',           // Endpoint hipotético para vagas
        recrutador: '/pt/auth/users/get_users/' // Endpoint hipotético para recrutadores
    };

    // Função auxiliar para limpar e preparar o select
    const prepareSelect = (select) => {
        const currentValue = select.value; // Guarda o valor atual (se houver)
        select.disabled = true;
        // Remove opções antigas, mantendo a primeira (placeholder)
        while (select.options.length > 1) {
            select.remove(1);
        }
        select.options[0].value = ""; // Garante que o placeholder tenha valor vazio
        select.options[0].textContent = "Carregando...";
        select.value = currentValue; // Tenta restaurar o valor (útil se chamado múltiplas vezes)
    };

    // Função auxiliar para popular um select com dados da API
    const populateSelect = async (select, url, valueField, textField) => {
        prepareSelect(select);
        try {
            const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
            if (!response.ok) {
                throw new Error(`Erro ${response.status}`);
            }
            const data = await response.json();
            const items = data.results || data; // Lida com paginação ou resposta direta

            if (Array.isArray(items)) {
                select.options[0].textContent = "Selecione"; // Muda placeholder
                items.forEach(item => {
                    // Verifica se o valor e o texto existem no item
                    const value = item[valueField];
                    const text = item[textField];
                    if (value !== undefined && text !== undefined) {
                        const option = new Option(text, value);
                        select.add(option);
                    } else {
                         console.warn(`Item inválido para ${select.id}:`, item);
                    }
                });
                select.disabled = false; // Habilita o select
                // Tenta restaurar o valor que foi setado em populateEditForm
                const formValue = document.getElementById(select.id).value;
                if(formValue) {
                    select.value = formValue;
                }

            } else {
                 throw new Error("Formato de resposta inesperado");
            }
        } catch (error) {
            console.error(`Erro ao carregar opções para ${select.id} de ${url}:`, error);
            select.options[0].textContent = "Erro ao carregar";
        }
    };

    // Carrega todos os selects em paralelo
    await Promise.all([
        populateSelect(statusSelect, urls.status, 'status_id', 'status_description'),
        populateSelect(unidadeSelect, urls.unidade, 'id', 'name'), // Ajustar campos se necessário
        populateSelect(jobSelect, urls.job, 'job_id', 'title'), // Ajustar campos se necessário
        populateSelect(recrutadorSelect, urls.recrutador, 'id', 'Nome') // Ajustar campos se necessário
    ]);
    console.log("Opções dos selects carregadas.");
}


// Função para salvar as alterações do candidato (similar a saveCandidate em candidatos.js)
async function saveCandidateKanban() {
    const modalForm = document.getElementById('edit-candidate-form-kanban');
    const candidateId = modalForm.dataset.candidateId;
    if (!candidateId) {
        console.error("ID do candidato não encontrado no formulário do modal.");
        Swal.fire("Erro", "Não foi possível identificar o candidato a ser editado.", "error");
        return;
    }

    // Validação de Datas (opcional, pode ser feita no backend)

    Swal.fire({
        title: 'Aguarde',
        text: 'Salvando alterações...',
        allowOutsideClick: false, // Impede fechar clicando fora
        showConfirmButton: false,
        willOpen: () => Swal.showLoading()
    });

    const formData = new FormData();
    // Adiciona campos ao FormData
    formData.append('candidate', document.getElementById('edit_candidate_name').value.trim());
    formData.append('status_id', document.getElementById('edit_status_id').value);
    formData.append('sex', document.getElementById('edit_sex').value);
    formData.append('phone', document.getElementById('edit_phone').value.trim());
    formData.append('email', document.getElementById('edit_email').value.trim());
    formData.append('cpf', document.getElementById('edit_cpf').value.trim());
    formData.append('unidade_id', document.getElementById('edit_unidade_id').value || null); // Envia null se vazio
    formData.append('job_id', document.getElementById('edit_job_id').value || null); // Envia null se vazio
    formData.append('recrutador_id', document.getElementById('edit_recrutador_id').value || null); // Envia null se vazio

    // Trata campos de data para enviar null se vazios ou inválidos
    const dtInicioValue = document.getElementById('edit_dtiniciopreenchimento').value;
    formData.append('dtiniciopreenchimento', dtInicioValue || null);
    const dtEnvioValue = document.getElementById('edit_dtenvioflow').value;
    formData.append('dtenvioflow', dtEnvioValue || null);

    // formData.append('tokencandidate', document.getElementById('edit_tokencandidate').value.trim()); // Token geralmente não é editável
    formData.append('notasinternas', document.getElementById('edit_notasinternas').value);
    const photoFile = document.getElementById('edit_photo_candidate').files[0];
    if (photoFile) {
        formData.append('photo_candidate', photoFile);
    } else if (document.getElementById('edit_photo_preview').src.startsWith('data:')) {
         // Não envia nada se a imagem não foi alterada (evita sobrescrever com null)
         // O backend deve tratar isso (não alterar se 'photo_candidate' não estiver no request)
    } else {
        // Se não há preview e nem arquivo novo, talvez enviar um indicativo para remover a foto?
        // Depende da lógica do backend. Por segurança, não enviamos nada.
    }


    // Validação básica de campos obrigatórios (ajustar conforme backend)
    if (!formData.get('candidate')) {
        Swal.fire("Erro", "O campo Candidato é obrigatório!", "error");
        return;
    }
     if (!formData.get('email')) {
        Swal.fire("Erro", "O campo Email é obrigatório!", "error");
        return;
    }
    // Adicionar outras validações se necessário


    try {
        const response = await fetch(`/pt/api/candidatos/${candidateId}/`, {
            method: 'PATCH',
            headers: {
                'X-CSRFToken': csrftoken,
                'Accept': 'application/json' // Informa que aceitamos JSON de volta
                // 'Content-Type' é definido automaticamente pelo browser para FormData
            },
            body: formData
        });

        if (response.ok) {
            const updatedData = await response.json(); // Pega os dados atualizados retornados pelo PATCH
            Swal.fire("Sucesso", "Candidato atualizado!", "success");
            const modalElement = document.getElementById('editCandidateModalKanban');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();

            // Atualizar o card no Kanban visualmente com os dados retornados
            updateKanbanCard(candidateId, updatedData);

        } else {
             // Tratar erro vindo do backend
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                // Se o erro não for JSON, usa o statusText
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            // Rejeita a promessa com os dados de erro formatados
            return Promise.reject(errorData);
        }

    } catch (error) {
         // Trata erros de rede ou erros rejeitados
        console.error('Erro ao salvar alterações do candidato:', error);
        let errorMessage = "Ocorreu um erro desconhecido.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null) {
            // Formata erros de validação do Django/DRF
            errorMessage = Object.entries(error).map(([field, messages]) =>
                // Mapeia nomes de campos para nomes mais amigáveis se necessário
                // Ex: 'status_id': 'Status'
                `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
            ).join('<br>');
        }
        Swal.fire({
            title: "Erro ao Salvar",
            html: errorMessage, // Usa html para permitir <br>
            icon: "error"
        });
    } finally {
         // Garante que o loading do Swal seja fechado
         if (Swal.isLoading()) {
             Swal.close();
         }
    }
}

// Função para atualizar o HTML de um card específico no Kanban
// Recebe o ID e os dados ATUALIZADOS (idealmente retornados pelo PATCH)
async function updateKanbanCard(candidateId, updatedData) {
    // Acessa a instância global do jKanban
    if (!kanbanGlobalInstance) {
        console.error("Instância global do jKanban (kanbanGlobalInstance) não encontrada ou não inicializada.");
        // Fallback: Informar o usuário ou tentar recarregar
        Swal.fire("Erro Interno", "A referência ao quadro Kanban foi perdida. Tente recarregar a página.", "error");
        return;
    }
    const kanbanInstance = kanbanGlobalInstance; // Usa a instância global

    // Encontra o elemento do card no DOM pelo data-eid que o jKanban usa
    const cardElement = document.querySelector(`[data-eid="${candidateId}"]`);

    if (cardElement) {
        console.log(`Atualizando card ${candidateId} no DOM.`);

        // **Estratégia: Buscar dados completos para garantir consistência**
        // Mesmo que o PATCH retorne dados, buscar a versão completa garante
        // que campos relacionados (status_description, job_desc, etc.) estejam corretos.
        try {
            const response = await fetch(`/pt/api/candidatos/${candidateId}/`);
            if (!response.ok) {
                throw new Error(`Erro ${response.status} ao buscar dados completos.`);
            }
            const fullData = await response.json();

            console.log("RESPONSE", fullData);

            // Recria o HTML interno do card com os dados completos e atualizados
            const cardLink = cardElement.querySelector('a.kanban-box');
            if (cardLink) {
                // Gera o novo HTML interno (extrai o conteúdo de dentro da tag <a>)
                const cardHtmlMatch = createCandidateCardHtml(fullData).match(/<a [^>]+>(.*)<\/a>/s);
                if (cardHtmlMatch && cardHtmlMatch[1]) {
                    cardLink.innerHTML = cardHtmlMatch[1]; // Substitui o conteúdo interno
                    console.log(`Card ${candidateId} atualizado visualmente com dados completos.`);

                    // **Importante:** Se o status mudou, precisamos mover o card para a coluna correta no jKanban.
                    const currentBoardId = cardElement.closest('.kanban-board')?.dataset.id;
                    const newBoardId = String(fullData.status_id); // Garante que seja string

                    if (currentBoardId && newBoardId && currentBoardId !== newBoardId) {
                        console.log(`Status alterado via modal. Movendo card ${candidateId} da coluna ${currentBoardId} para ${newBoardId}.`);
                        // Remove o elemento da instância jKanban (sem disparar dropEl)
                        kanbanInstance.removeElement(candidateId);
                        // Adiciona o elemento na nova coluna (board)
                        kanbanInstance.addElement(newBoardId, {
                            id: candidateId, // Usa o mesmo ID
                            title: cardLink.outerHTML // Adiciona o elemento <a> completo
                        });
                         console.log(`Card ${candidateId} movido para a coluna ${newBoardId}.`);
                    }

                } else {
                    console.error("Não foi possível extrair o HTML interno do card gerado.");
                }
            } else {
                console.error("Não foi possível encontrar o link interno (a.kanban-box) do card para atualização.");
            }
        } catch (err) {
            console.error(`Erro ao buscar dados completos para atualizar card ${candidateId}:`, err);
            // Mesmo com erro na busca, o backend foi atualizado. O card pode ficar inconsistente.
            // Poderia tentar atualizar parcialmente com 'updatedData' como fallback.
            // Ex: Atualizar nome, email, telefone que geralmente estão em 'updatedData'.
            const nameElement = cardElement.querySelector('h6');
            if (nameElement && updatedData.candidate) nameElement.textContent = updatedData.candidate;
            // ... outras atualizações parciais ...
            Swal.fire("Aviso", "Candidato salvo, mas houve um erro ao atualizar a visualização completa do card. Recarregue a página se necessário.", "warning");
        }

    } else {
        console.warn(`Card com ID ${candidateId} não encontrado no DOM para atualização visual. Pode ter sido movido ou removido.`);
        // Se o card não existe mais (ex: foi excluído em outra aba), não há o que fazer.
        // Se ele apenas mudou de coluna, a lógica acima de mover o card deve cuidar disso.
    }
}


// Adiciona os listeners após o DOM estar pronto
document.addEventListener('DOMContentLoaded', () => {
    // Listener para o botão salvar do modal
    const saveButton = document.getElementById('salvar_candidate_kanban');
    if (saveButton) {
        saveButton.addEventListener('click', saveCandidateKanban);
    } else {
        // Espera um pouco caso o modal seja adicionado dinamicamente mais tarde
        setTimeout(() => {
            const saveButtonRetry = document.getElementById('salvar_candidate_kanban');
            if (saveButtonRetry) {
                saveButtonRetry.addEventListener('click', saveCandidateKanban);
            } else {
                console.error("Botão #salvar_candidate_kanban não encontrado no DOM, mesmo após espera.");
            }
        }, 500);
    }

    // Listener para preview da imagem no input de foto
    const photoInput = document.getElementById('edit_photo_candidate');
    const photoPreview = document.getElementById('edit_photo_preview');
    if (photoInput && photoPreview) {
        photoInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    photoPreview.src = e.target.result;
                    photoPreview.style.display = 'block';
                }
                reader.readAsDataURL(this.files[0]);
            } else {
                 // Se o usuário cancelar a seleção, não faz nada (mantém a imagem atual ou nenhuma)
            }
        });
    }

    // Carrega as opções dos selects uma vez quando a página carrega
    // para que estejam prontas quando o modal for aberto pela primeira vez.
    // loadSelectOptions(); // Descomentar se quiser pré-carregar
});

// Adiciona um pouco de CSS para o feedback de salvamento (opcional)
const style = document.createElement('style');
style.textContent = `
.kanban-card-saving {
    opacity: 0.6;
    cursor: progress;
    transition: opacity 0.3s ease-in-out;
}
`;
document.head.appendChild(style);
