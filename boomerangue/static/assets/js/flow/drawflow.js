const drawflowContainer = document.getElementById("drawflow");
        const editor = new Drawflow(drawflowContainer);
        editor.reroute = true;
        editor.reroute_fix_curvature = true;
        editor.force_first_input = false;

        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        let availableVariables = [ // Variáveis de exemplo - Idealmente viriam do backend
            { name: 'contato.nome', description: 'Nome do contato' },
            { name: 'contato.telefone', description: 'Telefone do contato (WhatsApp ID)' },
            { name: 'contato.email', description: 'Email do contato' },
            { name: 'variavel.customizada', description: 'Exemplo de variável definida no fluxo' },
            { name: 'sistema.data_hora', description: 'Data e hora atuais' },
            { name: 'sistema.fluxo_id', description: 'ID do fluxo atual' },
            { name: 'api_response.status', description: 'Status da última chamada de API' },
            { name: 'user_response', description: 'Última resposta do usuário (Aguardar Resposta)' },
        ];
        let variableSelectorElement = null; // Referência ao dropdown de variáveis

        editor.start();
        Drawflow.prototype.updateNodeElements = function(nodeId) {
            const cleanId = nodeId.replace('node-', '');
            const node = this.getNodeFromId(cleanId);
            
            if (node) {
                // Garante que elements seja um objeto
                if (!this.elements) this.elements = {}; 
                
                // Usa ID limpo (sem 'node-') se necessário
                this.elements[cleanId] = document.getElementById(nodeId); 
                
                // Mantém compatibilidade com estrutura interna do Drawflow
                this.updateConnectionNodes(nodeId); 
            }
        };
        // --- Funções Auxiliares ---
        function escapeHTML(str) { const d = document.createElement('div'); d.appendChild(document.createTextNode(str || '')); return d.innerHTML; }
        function generateUniqueId(prefix = 'id') { return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`; }

        // --- Renderização Visual do Nó (GERA o HTML) ---
        // --- Geração APENAS do CONTEÚDO INTERNO do Nó ---
        function generateNodeInnerContentHTML(nodeId, nodeData) {
            // Tenta obter o nó interno para pegar nome/classe se não vier em nodeData
            const nodeElement = editor.drawflow.drawflow[editor.module]?.data[nodeId];
            const nodeName = nodeElement?.name || nodeData?.name || 'desconhecido'; // Usa nome interno como fallback

            let contentHTML = '';
            // Título e Ícone não são mais necessários aqui, pois esta função
            // retorna apenas o conteúdo interno para a div.box

            // --- Conteúdo Específico por Tipo ---
            // Lógica de geração de conteúdo permanece a mesma, mas sem definir title/iconClass
            if (nodeName === 'enviar_mensagem') {
                let mediaPreviewHTML = '';
                if (nodeData.mediaPreviewUrl) {
                    mediaPreviewHTML += '<div class="media-preview">';
                    if (nodeData.messageType === 'image') {
                        mediaPreviewHTML += `<img src="${escapeHTML(nodeData.mediaPreviewUrl)}" alt="Preview">`;
                    } else if (['video', 'audio', 'document'].includes(nodeData.messageType)) {
                        let fileIconClass = 'fa-file';
                        if (nodeData.messageType === 'video') fileIconClass = 'fa-file-video';
                        else if (nodeData.messageType === 'audio') fileIconClass = 'fa-file-audio';
                        mediaPreviewHTML += `<i class="fas ${fileIconClass} file-icon"></i>`;
                        if(nodeData.mediaFileName) mediaPreviewHTML += `<br><small>${escapeHTML(nodeData.mediaFileName)}</small>`;
                    }
                    mediaPreviewHTML += '</div>';
                } else if (nodeData.mediaUrl) {
                     mediaPreviewHTML += `<div class="media-preview"><small>URL: ${escapeHTML(nodeData.mediaUrl)}</small></div>`;
                }
                const messageTextHTML = `<div class="message-content">${escapeHTML(nodeData.text || '')}</div>`;
                // Passa o nodeId para renderDynamicButtonsHTML poder gerar IDs de output fixos
                const buttonsHTML = renderDynamicButtonsHTML(nodeId, nodeData.dynamicButtons);
                // Ordem correta: Mídia primeiro, depois texto, depois botões
                contentHTML = mediaPreviewHTML + messageTextHTML + buttonsHTML;
            } else if (nodeName === 'aguardar_resposta') {
                contentHTML = `<p>${escapeHTML(nodeData.promptMessage || 'Solicitar input...')}</p><small>Salvar em: ${escapeHTML(nodeData.variableName || 'indefinido')}</small>`;
            } else if (nodeName === 'condicao') {
                contentHTML = `<p>Se ${escapeHTML(nodeData.variable || '?')} ${escapeHTML(nodeData.operator || '?')} ${escapeHTML(nodeData.value || '?')}...</p>`;
            } else if (nodeName === 'inicio') {
                 contentHTML = '<p>Gatilho inicial do fluxo.</p>';
            } else if (nodeName === 'definir_variavel') {
                 contentHTML = `<p>Definir ${escapeHTML(nodeData.variableName || '?')} = ...</p>`;
            } else if (nodeName === 'chamada_api') {
                 // Aplica estilo para quebrar a URL se for muito longa
                 contentHTML = `<p style="overflow-wrap: break-word; white-space: normal; word-break: break-all;">Chamar ${escapeHTML(nodeData.method || '?')} ${escapeHTML(nodeData.url || '?')}...</p>`;
            } else if (nodeName === 'atraso') {
                 contentHTML = `<p>Aguardar ${escapeHTML(nodeData.delayTime || '?')} ${escapeHTML(nodeData.delayUnit || '?')}...</p>`;
            } else if (nodeName === 'fim') {
                 contentHTML = '<p>Fim do caminho do fluxo.</p>';
            }
            else {
                 contentHTML = `<p>Configurar ${nodeName}...</p>`;
                 // Não precisamos mais buscar title/icon aqui
            }

            // Retorna APENAS o HTML do conteúdo interno
            return contentHTML;
        }

        // --- Renderização Visual COMPLETA do Nó (para addNode e nodeInternals.html) ---
        function generateNodeHTMLVisuals(nodeId, nodeData) {
             const nodeElement = editor.drawflow.drawflow[editor.module]?.data[nodeId];
             const nodeName = nodeElement?.name || nodeData?.name || 'desconhecido';

             // Determina Título e Ícone (lógica movida para cá)
             let title = nodeName;
             let iconClass = 'fas fa-question-circle';
             switch(nodeName) {
                 case 'enviar_mensagem': title = 'Enviar Mensagem'; iconClass = 'fas fa-paper-plane'; break;
                 case 'aguardar_resposta': title = 'Aguardar Resposta'; iconClass = 'fas fa-clock'; break;
                 case 'condicao': title = 'Condição'; iconClass = 'fas fa-code-branch'; break;
                 case 'inicio': title = 'Início'; iconClass = 'fas fa-play-circle'; break;
                 case 'definir_variavel': title = 'Definir Variável'; iconClass = 'fas fa-tags'; break;
                 case 'chamada_api': title = 'Chamada de API'; iconClass = 'fas fa-network-wired'; break;
                 case 'atraso': title = 'Atraso (Delay)'; iconClass = 'fas fa-hourglass-half'; break;
                 case 'fim': title = 'Fim'; iconClass = 'fas fa-stop-circle'; break;
                 default:
                     const nodeOption = document.querySelector(`.drag-drawflow[data-node="${nodeName}"] span`);
                     if (nodeOption) title = nodeOption.textContent.trim();
                     const iconOption = document.querySelector(`.drag-drawflow[data-node="${nodeName}"] i`);
                     if (iconOption) iconClass = iconOption.className;
             }

             // Gera o conteúdo interno chamando a função auxiliar
             const innerContentHTML = generateNodeInnerContentHTML(nodeId, nodeData);

             // Monta o HTML completo envolvendo o conteúdo interno
             const finalHTML = `
                 <div>
                   <div class="title-box"><i class="${iconClass}"></i> ${title}</div>
                   <div class="box">${innerContentHTML}</div>
                 </div>`;
             return finalHTML; // Retorna o HTML completo
        }

        // Modificado para sempre gerar 3 slots de botão e usar IDs de output fixos
        // Modificado para renderizar APENAS os botões, sem outputs internos
        function renderDynamicButtonsHTML(nodeId, buttonsData = []) {
            let buttonsHTML = '<div class="buttons-container">';
            const existingButtons = Array.isArray(buttonsData) ? buttonsData : [];

            existingButtons.forEach(button => {
                const isUrlButton = button.type === 'url';
                // Adiciona classe 'url-button' apenas se for URL para possível estilo específico
                const itemClass = isUrlButton ? 'message-button url-button' : 'message-button';
                buttonsHTML += `
                    <div class="${itemClass}" id="${escapeHTML(button.id)}" data-button-id="${escapeHTML(button.id)}">
                        <span>${escapeHTML(button.text)}</span>
                        ${isUrlButton ? '<span class="url-indicator">🔗</span>' : ''}
                        <!-- Output removido daqui -->
                    </div>`;
            });

            buttonsHTML += '</div>';
            return buttonsHTML;
        }


        // --- Importação ---
        if (flowData) {
            if (typeof flowData === 'object' && flowData !== null && flowData.drawflow) {
                 try {
                    editor.import(flowData);
                    console.log("Fluxo importado com sucesso.");
                    // Pós-importação: Atualiza o HTML visual e garante estrutura de dados
                    const nodes = editor.export().drawflow[editor.module].data;
                     for (const nodeId in nodes) {
                         const node = nodes[nodeId];
                         const nodeInternals = editor.drawflow.drawflow[editor.module].data[nodeId]; // Nó interno

                         // Garante que dynamicButtons seja um array
                         if (node.name === 'enviar_mensagem') {
                              if (!Array.isArray(node.data.dynamicButtons)) {
                                   node.data.dynamicButtons = [];
                              }
                              // Garante a estrutura de outputs pré-definida pós-importação
                              const expectedOutputs = {
                                  'output_1': nodeInternals.outputs?.output_1 || { connections: [] }
                              };
                              for (let i = 0; i < 3; i++) {
                                  const btnOutputId = `output_btn_${i}`;
                                  expectedOutputs[btnOutputId] = nodeInternals.outputs?.[btnOutputId] || { connections: [] };
                              }
                              nodeInternals.outputs = expectedOutputs;
                              console.log(`Estrutura de outputs garantida para nó ${nodeId} pós-import.`);
                         }

                         // Gera o HTML COMPLETO correto com base nos dados importados
                         const correctHTML = generateNodeHTMLVisuals(nodeId, node.data); // Usa a função que retorna o HTML completo
                         // Atualiza o HTML COMPLETO interno do nó no Drawflow para persistência/exportação
                         nodeInternals.html = correctHTML;
                         // Força o Drawflow a redesenhar o nó
                         editor.updateConnectionNodes('node-'+nodeId);
                     }
                 } catch (importError) { console.error("Erro ao importar:", importError); Swal.fire('Erro', 'Não foi possível carregar fluxo.', 'error'); }
            } else { console.warn("Dados do fluxo inválidos."); Swal.fire('Aviso', 'Dados da estrutura do fluxo inválidos.', 'warning'); }
        } else if (flowId) { console.warn("Fluxo ID presente, mas sem dados."); }


        // --- Definição dos Nós (addNodeToDrawFlow) ---
        function addNodeToDrawFlow(name, pos_x, pos_y) {
            // Adiciona verificação para garantir que 'editor' está inicializado
            if (!editor) {
                console.error("Erro: Tentativa de adicionar nó antes da inicialização do editor.");
                return false;
            }
            if (editor.editor_mode === 'fixed') return false;
            pos_x = pos_x * (editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom)) - (editor.precanvas.getBoundingClientRect().x * (editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom)));
            pos_y = pos_y * (editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom)) - (editor.precanvas.getBoundingClientRect().y * (editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom)));

            let nodeData = {};
            let inputs = 1;
            let outputs = 1; // Padrão
            let nodeClass = name;

            // Define dados padrão e I/O
            switch (name) {
                case 'inicio': inputs = 0; outputs = 1; nodeData = {}; break;
                // Nó 'enviar_mensagem' volta a ter apenas 1 output padrão inicial
                case 'enviar_mensagem': inputs = 1; outputs = 1; nodeData = { messageType: 'text', text: '', mediaUrl: '', mediaFileName: '', mediaPreviewUrl: '', dynamicButtons: [] }; break;
                case 'aguardar_resposta': inputs = 1; outputs = 1; nodeData = { promptMessage: 'Digite sua resposta:', expectedType: 'any', variableName: 'user_response', timeoutSeconds: 300 }; break;
                // Nó 'condicao' tem 2 outputs fixos (true/false)
                case 'condicao': inputs = 1; outputs = 2; nodeData = { variable: '', operator: '==', value: '' }; break;
                case 'definir_variavel': inputs = 1; outputs = 1; nodeData = { variableName: 'my_var', variableValue: '' }; break;
                // Adiciona responseMappings ao nodeData padrão da API
                case 'chamada_api': inputs = 1; outputs = 1; nodeData = { url: '', method: 'GET', headers: '{}', body: '{}', responseVariable: 'api_response', responseMappings: [] }; break;
                case 'atraso': inputs = 1; outputs = 1; nodeData = { delayTime: 5, delayUnit: 'seconds' }; break;
                case 'fim': inputs = 1; outputs = 0; nodeData = {}; break; // Nó 'fim' tem entrada, mas não saída
                default: console.warn("Tipo de nó desconhecido:", name); return;
            }

            // Gera o HTML inicial usando a função
            const tempIdForHTML = generateUniqueId('temp'); // ID temporário só para gerar HTML
            const initialHTML = generateNodeHTMLVisuals(tempIdForHTML, { ...nodeData, name: name }); // Passa nome também

            // Adiciona o nó com o HTML correto
            const newNodeId = editor.addNode(name, inputs, outputs, pos_x, pos_y, nodeClass, nodeData, initialHTML);
            console.log(`Nó ${name} (ID: ${newNodeId}) adicionado.`);

            // Ajuste pós-criação APENAS para 'condicao'
            if (name === 'condicao') {
                const nodeInternals = editor.drawflow.drawflow[editor.module].data[newNodeId];
                if (nodeInternals && nodeInternals.outputs) {
                    const outputKeys = Object.keys(nodeInternals.outputs);
                    if (outputKeys.length === 2) { // Se Drawflow criou 2 saídas padrão
                        const oldOutput1 = nodeInternals.outputs[outputKeys[0]];
                        const oldOutput2 = nodeInternals.outputs[outputKeys[1]];
                        delete nodeInternals.outputs[outputKeys[0]];
                        delete nodeInternals.outputs[outputKeys[1]];
                        nodeInternals.outputs['output_true'] = oldOutput1; // Renomeia a primeira para true
                        nodeInternals.outputs['output_false'] = oldOutput2; // Renomeia a segunda para false
                        editor.updateConnectionNodes('node-'+newNodeId); // Força atualização
                        console.log(`Outputs do nó ${newNodeId} (condicao) renomeados para true/false.`);
                    }
                }
            }
            // Não precisamos mais ajustar outputs do 'enviar_mensagem' aqui
            editor.dispatch('nodeCreated', newNodeId);
        }

        // --- Painel de Propriedades ---

        editor.on('nodeSelected', function(id) {
            selectedNodeId = id;
            const node = editor.getNodeFromId(id);
            if (!node) return;

            // Clona os dados REAIS para edição temporária
            tempNodeData = JSON.parse(JSON.stringify(node.data || {}));
            // Garante que dynamicButtons seja um array em tempNodeData
            if (node.name === 'enviar_mensagem' && !Array.isArray(tempNodeData.dynamicButtons)) {
                tempNodeData.dynamicButtons = [];
            }
            // Garante que responseMappings seja um array em tempNodeData para API
            if (node.name === 'chamada_api' && !Array.isArray(tempNodeData.responseMappings)) {
                tempNodeData.responseMappings = [];
            }
            delete tempNodeData.mediaFile; // Garante que não haja File object persistido em tempNodeData

            propertiesPanel.classList.add('visible');
            applyChangesButton.style.display = 'block';
            propertiesContent.innerHTML = ''; // Limpa conteúdo anterior

            // Define o título do painel
            try {
                 // Tenta pegar o título do HTML renderizado no nó
                 const tempDiv = document.createElement('div'); tempDiv.innerHTML = node.html;
                 const titleBox = tempDiv.querySelector('.title-box');
                 propertiesTitle.textContent = `Propriedades: ${titleBox ? titleBox.innerText.trim() : node.name} (ID: ${id})`;
            } catch (e) { propertiesTitle.textContent = `Propriedades: ${node.name} (ID: ${id})`; }

            generatePropertyFields(node, id); // Gera campos com base nos dados TEMPORÁRIOS
        });

        editor.on('nodeUnselected', function() {
            // Poderia perguntar se quer descartar alterações não salvas aqui
            selectedNodeId = null;
            tempNodeData = {}; // Limpa dados temporários
            propertiesPanel.classList.remove('visible');
            applyChangesButton.style.display = 'none';
        });


        // --- Geração dos Campos do Painel ---
        function generatePropertyFields(node, nodeId) {
            const data = tempNodeData; // Usa dados temporários
            const form = document.createElement('form');
            form.id = `node-${nodeId}-form`;
            // Adiciona listeners para atualizar tempNodeData em tempo real
            form.addEventListener('change', handleFormChange);
            form.addEventListener('input', handleFormChange);
            // Previne submit padrão do form
            form.addEventListener('submit', (e) => e.preventDefault());

            switch (node.name) {
                case 'enviar_mensagem':
                    const msgSection = document.createElement('div'); msgSection.className = 'form-section';
                    msgSection.appendChild(createSelectField('Tipo Mensagem', 'messageType', data.messageType, [ { value: 'text', text: 'Texto' }, { value: 'image', text: 'Imagem' }, { value: 'video', text: 'Vídeo' }, { value: 'audio', text: 'Áudio' }, { value: 'document', text: 'Documento' }, ], nodeId));
                    msgSection.appendChild(createTextareaField('Texto da Mensagem', 'text', data.text, true, nodeId)); // Passa nodeId

                    const mediaUploadDiv = document.createElement('div'); mediaUploadDiv.id = `media-upload-div-${nodeId}`; mediaUploadDiv.style.display = ['image', 'video', 'audio', 'document'].includes(data.messageType) ? 'block' : 'none';
                    mediaUploadDiv.appendChild(createInputField('Arquivo de Mídia', 'mediaFile', '', 'file', false, nodeId)); // Passa nodeId
                    const mediaPreviewProp = document.createElement('div'); mediaPreviewProp.className = 'media-preview-prop'; mediaPreviewProp.id = `media-preview-prop-${nodeId}`;
                    // Mostra preview/nome do arquivo/URL atual ao carregar o painel
                    if (data.mediaPreviewUrl && data.messageType === 'image') { mediaPreviewProp.innerHTML = `<img src="${escapeHTML(data.mediaPreviewUrl)}" alt="Preview">`; }
                    else if (data.mediaFileName && ['video', 'audio', 'document'].includes(data.messageType)) { mediaPreviewProp.innerHTML = `<small>Arquivo atual: ${escapeHTML(data.mediaFileName)}</small>`; }
                    else if (data.mediaUrl && !data.mediaFileName) { mediaPreviewProp.innerHTML = `<small>URL atual: ${escapeHTML(data.mediaUrl)}</small>`; }
                    mediaUploadDiv.appendChild(mediaPreviewProp);
                    msgSection.appendChild(mediaUploadDiv);

                    msgSection.appendChild(createInputField('URL da Mídia (Opcional/Alternativa)', 'mediaUrl', data.mediaUrl, 'url', true, nodeId)); // Passa nodeId
                    form.appendChild(msgSection);

                    // Seção de Botões Dinâmicos
                    const btnSection = document.createElement('div'); btnSection.className = 'form-section'; btnSection.innerHTML = '<h4>Botões Dinâmicos</h4>';
                    const addBtnArea = document.createElement('div'); addBtnArea.className = 'button-config-area';
                    // Usar IDs únicos baseados no nodeId para evitar conflitos se múltiplos painéis existissem (não é o caso aqui, mas boa prática)
                    addBtnArea.innerHTML = `
                        <div class="button-type-selector">
                            <label><input type="radio" name="newButtonType_${nodeId}" value="reply" checked> Resposta Rápida</label>
                            <label><input type="radio" name="newButtonType_${nodeId}" value="url"> URL</label>
                        </div>
                        ${createInputField('Texto do Botão', `newButtonText`, '', 'text', false, nodeId).innerHTML}
                        <div id="newButtonUrlDiv_${nodeId}" style="display: none;">
                            ${createInputField('URL do Botão', `newButtonUrl`, '', 'url', false, nodeId).innerHTML} 
                        </div>
                    `;
                    const addButton = document.createElement('button'); addButton.type = 'button'; addButton.textContent = 'Adicionar Botão'; addButton.className = 'control-button add-button'; // Adiciona classe
                    addButton.onclick = () => addDynamicButtonHandler(nodeId); // Chama handler
                    addBtnArea.appendChild(addButton); btnSection.appendChild(addBtnArea);
                    // Listener para mostrar/esconder campo URL
                    addBtnArea.querySelectorAll(`input[name="newButtonType_${nodeId}"]`).forEach(radio => {
                        radio.addEventListener('change', (e) => {
                            document.getElementById(`newButtonUrlDiv_${nodeId}`).style.display = e.target.value === 'url' ? 'block' : 'none';
                        });
                    });

                    // Lista de botões existentes
                    const currentButtonsDiv = document.createElement('div'); currentButtonsDiv.className = 'existing-buttons-list'; currentButtonsDiv.style.marginTop = '15px'; currentButtonsDiv.id = `existing-buttons-${nodeId}`;
                    (data.dynamicButtons || []).forEach(button => {
                        currentButtonsDiv.appendChild(createButtonListItem(nodeId, button)); // Cria item da lista
                    });
                    btnSection.appendChild(currentButtonsDiv);
                    form.appendChild(btnSection);
                    break;

                // Cases para outros nós (sem alterações significativas)
                case 'aguardar_resposta':
                    form.appendChild(createTextareaField('Mensagem de Solicitação', 'promptMessage', data.promptMessage, true, nodeId));
                    form.appendChild(createSelectField('Tipo Esperado', 'expectedType', data.expectedType, [ { value: 'any', text: 'Qualquer' }, { value: 'text', text: 'Texto' }, { value: 'number', text: 'Número' }, { value: 'email', text: 'Email' }, { value: 'cnpj', text: 'CNPJ (Apenas Exemplo)' } ], nodeId));
                    form.appendChild(createInputField('Nome da Variável para Salvar', 'variableName', data.variableName, 'text', false, nodeId));
                    form.appendChild(createInputField('Timeout (segundos)', 'timeoutSeconds', data.timeoutSeconds, 'number', false, nodeId));
                    break;
                case 'condicao':
                    form.appendChild(createInputField('Variável', 'variable', data.variable, 'text', true, nodeId));
                    form.appendChild(createSelectField('Operador', 'operator', data.operator, [ { value: '==', text: 'Igual (==)' }, { value: '!=', text: 'Diferente (!=)' }, { value: '>', text: 'Maior que (>)' }, { value: '<', text: 'Menor que (<)' }, { value: '>=', text: 'Maior ou Igual (>=)' }, { value: '<=', text: 'Menor ou Igual (<=)' }, { value: 'contains', text: 'Contém' }, { value: 'startsWith', text: 'Começa com' }, { value: 'endsWith', text: 'Termina com' } ], nodeId));
                    form.appendChild(createInputField('Valor para Comparar', 'value', data.value, 'text', true, nodeId));
                    const outputLabels = document.createElement('div');
                    // Referencia as saídas nomeadas 'output_true' e 'output_false'
                    outputLabels.innerHTML = `<small>Saída 1 (Superior): Verdadeiro (True)<br>Saída 2 (Inferior): Falso (False)</small>`;
                    outputLabels.style.marginTop = '10px'; outputLabels.style.color = '#555'; form.appendChild(outputLabels);
                    break;
                case 'definir_variavel':
                    form.appendChild(createInputField('Nome da Variável', 'variableName', data.variableName, 'text', false, nodeId));
                    form.appendChild(createTextareaField('Valor da Variável', 'variableValue', data.variableValue, true, nodeId));
                    break;
                case 'chamada_api':
                    form.appendChild(createInputField('URL', 'url', data.url, 'text', true, nodeId));
                     form.appendChild(createSelectField('Método HTTP', 'method', data.method, [ { value: 'GET', text: 'GET' }, { value: 'POST', text: 'POST' }, { value: 'PUT', text: 'PUT' }, { value: 'PATCH', text: 'PATCH' }, { value: 'DELETE', text: 'DELETE' } ], nodeId));
                    form.appendChild(createTextareaField('Cabeçalhos (JSON)', 'headers', data.headers, true, nodeId));
                    form.appendChild(createTextareaField('Corpo da Requisição (JSON)', 'body', data.body, true, nodeId)); // Permite variáveis
                    form.appendChild(createInputField('Nome da Variável para Salvar Resposta', 'responseVariable', data.responseVariable, 'text', false, nodeId)); // Não permite variáveis no nome

                    // Botão Testar Requisição
                    const testButtonContainer = document.createElement('div');
                    testButtonContainer.style.marginTop = '15px';
                    const testButton = document.createElement('button');
                    testButton.type = 'button';
                    testButton.textContent = 'Testar Requisição';
                    testButton.className = 'control-button test-api-button';
                    testButton.onclick = () => testApiCall(nodeId);
                    testButtonContainer.appendChild(testButton);
                    form.appendChild(testButtonContainer);

                    // Área para exibir resultado do teste
                    const testResultArea = document.createElement('div');
                    testResultArea.id = `api-test-result-${nodeId}`;
                    testResultArea.className = 'api-test-result-area';
                    testResultArea.style.marginTop = '10px';
                    testResultArea.style.padding = '10px';
                    testResultArea.style.border = '1px dashed #ccc';
                    testResultArea.style.display = 'none'; // Começa escondido
                    testResultArea.innerHTML = `
                        <div class="api-test-tabs">
                            <button type="button" class="tab-button active" onclick="showApiResultTab(this, 'response-body-${nodeId}')">Resposta</button>
                            <button type="button" class="tab-button" onclick="showApiResultTab(this, 'response-headers-${nodeId}')">Cabeçalhos</button>
                        </div>
                        <div id="response-body-${nodeId}" class="tab-content active">
                            <h5>Corpo da Resposta:</h5>
                            <pre></pre>
                        </div>
                        <div id="response-headers-${nodeId}" class="tab-content" style="display: none;">
                            <h5>Cabeçalhos da Resposta:</h5>
                            <pre></pre>
                        </div>
                    `;
                    testSection.appendChild(testResultArea);
                    form.appendChild(testSection);

                    // --- Seção de Mapeamento de Resposta ---
                    const mappingSection = document.createElement('div');
                    mappingSection.className = 'form-section response-mapping-section';
                    mappingSection.style.borderTop = '1px solid #eee';
                    mappingSection.style.marginTop = '15px';
                    mappingSection.style.paddingTop = '15px';
                    mappingSection.innerHTML = '<h4>Mapeamento da Resposta JSON</h4>';

                    const mappingHelp = document.createElement('p');
                    mappingHelp.innerHTML = '<small>Extraia valores da resposta JSON e salve em variáveis. Use a sintaxe <a href="https://goessner.net/articles/JsonPath/" target="_blank" title="Documentação JSONPath">JSONPath</a> (ex: <code>$.data.user.name</code> ou <code>$.items[0].id</code>).</small>';
                    mappingSection.appendChild(mappingHelp);

                    const mappingListDiv = document.createElement('div');
                    mappingListDiv.id = `response-mappings-list-${nodeId}`;
                    mappingListDiv.className = 'response-mappings-list';
                    mappingSection.appendChild(mappingListDiv);

                    const addMappingButton = document.createElement('button');
                    addMappingButton.type = 'button';
                    addMappingButton.innerHTML = '<i class="fas fa-plus"></i> Adicionar Mapeamento';
                    addMappingButton.className = 'control-button add-mapping-button';
                    addMappingButton.style.marginTop = '10px';
                    addMappingButton.onclick = () => addResponseMappingRow(nodeId);
                    mappingSection.appendChild(addMappingButton);

                    form.appendChild(mappingSection);

                    // Renderiza mapeamentos existentes ao carregar o painel
                    renderResponseMappings(nodeId, data.responseMappings || []);

                    break; // Fim do case 'chamada_api'

                // Cases para outros nós (sem alterações significativas)
                case 'atraso':
                    form.appendChild(createInputField('Tempo de Atraso', 'delayTime', data.delayTime, 'number', false, nodeId));
                    form.appendChild(createSelectField('Unidade de Tempo', 'delayUnit', data.delayUnit, [ { value: 'seconds', text: 'Segundos' }, { value: 'minutes', text: 'Minutos' }, { value: 'hours', text: 'Horas' } ], nodeId));
                    break;
                case 'inicio': case 'fim':
                    form.innerHTML = '<p>Este nó não possui propriedades configuráveis.</p>'; break;
                default:
                     form.innerHTML = `<p>Configuração não disponível para o nó '${node.name}'.</p>`;
            }
            propertiesContent.appendChild(form);
        }

        // Cria item da lista de botões no painel de propriedades
        function createButtonListItem(nodeId, button) {
             const btnItem = document.createElement('div');
             btnItem.className = 'button-item';
             btnItem.dataset.buttonId = button.id; // Armazena o ID único do botão
             const buttonTypeText = button.type === 'url' ? 'URL' : 'Resposta';
             const outputInfo = button.type === 'reply' ? `(Saída: ${button.outputId})` : ''; // Mostra ID da saída
             const urlInfo = button.type === 'url' ? `- ${escapeHTML(button.url || '')}` : '';
             btnItem.innerHTML = `
                 <span>${escapeHTML(button.text)} (${buttonTypeText}) ${outputInfo} ${urlInfo}</span>
                 <button type="button" class="remove-button" title="Remover Botão" onclick="removeDynamicButtonHandler('${nodeId}', '${button.id}')">X</button>
             `;
             return btnItem;
        }

        // --- Handler para Mudanças no Formulário do Painel ---
        function handleFormChange(event) {
            const target = event.target;
            // Usa dataset.baseName se existir, senão o nome completo
            const name = target.dataset.baseName || target.name;
            const value = target.type === 'file' ? target.files[0] : target.value;
            const nodeId = selectedNodeId; // Pega o ID do nó selecionado globalmente

            if (name && nodeId && tempNodeData) {
                // Ignora campos de adicionar botão ou mapeamento (tratados por data-index)
                if (name.startsWith('newButton') || target.closest('.response-mapping-item')) return;

                tempNodeData[name] = value;
                console.log("Temp data updated (direct):", name, value);

                // Lógica específica para campos
                if (name === 'messageType') {
                    const mediaDiv = document.getElementById(`media-upload-div-${nodeId}`);
                    if (mediaDiv) mediaDiv.style.display = ['image', 'video', 'audio', 'document'].includes(value) ? 'block' : 'none';
                    // Se mudar para texto, limpa dados de mídia temporários
                    if (value === 'text') {
                        delete tempNodeData.mediaFile;
                        delete tempNodeData.mediaPreviewUrl;
                        delete tempNodeData.mediaFileName;
                        // Limpa também o input file e o preview no painel
                        const fileInput = document.querySelector(`input[data-base-name="mediaFile"][id^="prop-${nodeId}"]`);
                        if(fileInput) fileInput.value = null;
                        const previewProp = document.getElementById(`media-preview-prop-${nodeId}`);
                        if(previewProp) previewProp.innerHTML = '';
                    } else if (target.closest('.response-mapping-item')) {
                        // --- Tratamento para campos de Mapeamento de Resposta ---
                        const mappingItem = target.closest('.response-mapping-item');
                        const index = parseInt(mappingItem.dataset.index, 10);
                        const mappingName = target.dataset.mappingName; // 'jsonPath' ou 'variableName'
        
                        if (!isNaN(index) && mappingName && tempNodeData.responseMappings && tempNodeData.responseMappings[index]) {
                            tempNodeData.responseMappings[index][mappingName] = value;
                            console.log(`Temp data updated (mapping ${index}):`, mappingName, value);
                        } else if (target.closest('.response-mapping-item')) {
                            // --- Tratamento para campos de Mapeamento de Resposta ---
                            const mappingItem = target.closest('.response-mapping-item');
                            const index = parseInt(mappingItem.dataset.index, 10);
                            const mappingName = target.dataset.mappingName; // 'jsonPath' ou 'variableName'
            
                            if (!isNaN(index) && mappingName && tempNodeData.responseMappings && tempNodeData.responseMappings[index]) {
                                tempNodeData.responseMappings[index][mappingName] = value;
                                console.log(`Temp data updated (mapping ${index}):`, mappingName, value);
                            } else if (target.closest('.response-mapping-item')) {
                                // --- Tratamento para campos de Mapeamento de Resposta ---
                                const mappingItem = target.closest('.response-mapping-item');
                                const index = parseInt(mappingItem.dataset.index, 10);
                                const mappingName = target.dataset.mappingName; // 'jsonPath' ou 'variableName'
                
                                if (!isNaN(index) && mappingName && tempNodeData.responseMappings && tempNodeData.responseMappings[index]) {
                                    tempNodeData.responseMappings[index][mappingName] = value;
                                    console.log(`Temp data updated (mapping ${index}):`, mappingName, value);
                                }
                            }
                        }
                    }
                    // Re-renderiza o preview no painel ao mudar tipo
                    const previewProp = document.getElementById(`media-preview-prop-${nodeId}`);
                    if(previewProp) previewProp.innerHTML = ''; // Limpa preview antigo
                }
                else if (name === 'mediaFile' && value instanceof File) {
                     const reader = new FileReader();
                     reader.onload = (e) => {
                         tempNodeData['mediaPreviewUrl'] = e.target.result; // Guarda Data URL para preview
                         tempNodeData['mediaFileName'] = value.name; // Guarda nome original
                         console.log("Media preview URL generated for", value.name);
                         // Atualiza preview no painel IMEDIATAMENTE
                         const previewProp = document.getElementById(`media-preview-prop-${nodeId}`);
                         if(previewProp && tempNodeData.messageType === 'image') {
                             previewProp.innerHTML = `<img src="${escapeHTML(e.target.result)}" alt="Preview">`;
                         } else if (previewProp) {
                             previewProp.innerHTML = `<small>Arquivo selecionado: ${escapeHTML(value.name)}</small>`;
                         }
                     };
                     reader.onerror = (e) => {
                         console.error("FileReader error:", e);
                         delete tempNodeData.mediaFile; // Remove o arquivo problemático
                         Swal.fire('Erro', 'Não foi possível ler o arquivo selecionado.', 'error');
                         // Limpa preview no painel
                         const previewProp = document.getElementById(`media-preview-prop-${nodeId}`);
                         if(previewProp) previewProp.innerHTML = '<small style="color: red;">Erro ao ler arquivo.</small>';
                     };

                     // Lê como Data URL apenas para imagens (para preview)
                     if (value.type.startsWith('image/')) {
                         reader.readAsDataURL(value);
                     }
                     // Para outros tipos, apenas guarda o nome e indica seleção
                     else if (['video', 'audio'].some(t => value.type.startsWith(t+'/')) || value.type.includes('pdf') || value.type.includes('document') || value.type.includes('sheet') || value.type.includes('presentation')) {
                         tempNodeData['mediaPreviewUrl'] = null; // Não gera preview Data URL
                         tempNodeData['mediaFileName'] = value.name;
                         console.log("Stored filename for", value.name);
                         const previewProp = document.getElementById(`media-preview-prop-${nodeId}`);
                         if(previewProp) previewProp.innerHTML = `<small>Arquivo selecionado: ${escapeHTML(value.name)}</small>`;
                     } else {
                          console.warn("Tipo de arquivo não suportado:", value.type);
                          target.value = null; // Limpa o input file
                          delete tempNodeData.mediaFile; // Remove do temp data
                          Swal.fire('Aviso', 'Tipo de arquivo não suportado para upload direto. Considere usar a opção de URL.', 'warning');
                          const previewProp = document.getElementById(`media-preview-prop-${nodeId}`);
                          if(previewProp) previewProp.innerHTML = '<small style="color: orange;">Tipo não suportado.</small>';
                          return; // Interrompe processamento adicional para este arquivo
                     }
                     // Ao selecionar um arquivo, limpa a URL alternativa e seu input
                     tempNodeData.mediaUrl = '';
                     const urlInput = document.querySelector(`input[data-base-name="mediaUrl"][id^="prop-${nodeId}"]`);
                     if(urlInput) urlInput.value = '';
                } else if (name === 'mediaUrl' && value) {
                     // Ao digitar uma URL, limpa dados do arquivo selecionado
                     delete tempNodeData.mediaFile;
                     delete tempNodeData.mediaPreviewUrl;
                     delete tempNodeData.mediaFileName;
                     const fileInput = document.querySelector(`input[data-base-name="mediaFile"][id^="prop-${nodeId}"]`);
                     if(fileInput) fileInput.value = null;
                     // Atualiza preview no painel para mostrar a URL
                     const previewProp = document.getElementById(`media-preview-prop-${nodeId}`);
                     if(previewProp) previewProp.innerHTML = `<small>URL: ${escapeHTML(value)}</small>`;
                }
            } else if (target.closest('.response-mapping-item')) {
                // --- Tratamento para campos de Mapeamento de Resposta ---
                const mappingItem = target.closest('.response-mapping-item');
                const index = parseInt(mappingItem.dataset.index, 10);
                const mappingName = target.dataset.mappingName; // 'jsonPath' ou 'variableName'

                if (!isNaN(index) && mappingName && tempNodeData.responseMappings && tempNodeData.responseMappings[index]) {
                    tempNodeData.responseMappings[index][mappingName] = value;
                    console.log(`Temp data updated (mapping ${index}):`, mappingName, value);
                }
            }
        }

        // --- Handler para Botão "Aplicar Alterações" ---
        function applyNodeChanges() {
            if (!selectedNodeId || !tempNodeData) {
                console.error("Nenhum nó selecionado ou dados temporários ausentes.");
                return;
            }
            console.log("Aplicando alterações para nó:", selectedNodeId);

            const nodeInternals = editor.drawflow.drawflow[editor.module].data[selectedNodeId];
            if (!nodeInternals) {
                console.error("Nó interno não encontrado para ID:", selectedNodeId);
                return;
            }

            // 1. Cria cópia final dos dados temporários
            const finalNodeData = JSON.parse(JSON.stringify(tempNodeData));
            delete finalNodeData.mediaFile; // Remove File object
            console.log("Dados finais a serem aplicados:", finalNodeData);

            // 2. Garante a preservação do Input padrão ('input_1') - SEM ALTERAÇÕES
            if (!nodeInternals.inputs || !nodeInternals.inputs['input_1']) {
                 console.warn(`Input 'input_1' ausente no nó ${selectedNodeId}. Recriando.`);
                 const existingInputConnections = (nodeInternals.inputs && nodeInternals.inputs['input_1'] && Array.isArray(nodeInternals.inputs['input_1'].connections)) ? nodeInternals.inputs['input_1'].connections : [];
                 if (typeof nodeInternals.inputs !== 'object' || nodeInternals.inputs === null) { nodeInternals.inputs = {}; }
                 nodeInternals.inputs['input_1'] = { connections: existingInputConnections };
            } else {
                 if (!Array.isArray(nodeInternals.inputs['input_1'].connections)) {
                      console.warn(`Propriedade connections ausente ou inválida em input_1 do nó ${selectedNodeId}. Corrigindo.`);
                      nodeInternals.inputs['input_1'].connections = [];
                 }
            }

            // 3. Sincroniza as Saídas (Outputs) VISUAIS com os Botões usando add/removeNodeOutput
            if (nodeInternals.name === 'enviar_mensagem') {
                // Pega os IDs reais das saídas VISUAIS atuais (exceto output_1)
                const currentVisualOutputs = Array.from(document.querySelectorAll(`#node-${selectedNodeId} .outputs .output:not(.output_1)`))
                                                .map(el => el.classList[el.classList.length - 1]); // Assume ID é a última classe
                const currentVisualOutputCount = currentVisualOutputs.length;

                const desiredReplyButtons = (finalNodeData.dynamicButtons || []).filter(b => b.type === 'reply');
                const desiredOutputCount = desiredReplyButtons.length;

                console.log(`Sincronizando outputs visuais: Desejados=${desiredOutputCount}, Atuais=${currentVisualOutputCount}`);

                // Adiciona saídas visuais se necessário
                if (desiredOutputCount > currentVisualOutputCount) {
                    const outputsToAdd = desiredOutputCount - currentVisualOutputCount;
                    console.log(`Adicionando ${outputsToAdd} output(s) visual(is)`);
                    for (let i = 0; i < outputsToAdd; i++) {
                        try {
                            editor.addNodeOutput(selectedNodeId);
                        } catch (e) {
                            console.error("Erro ao adicionar output visual:", e);
                        }
                    }
                }
                // Remove saídas visuais se necessário
                else if (currentVisualOutputCount > desiredOutputCount) {
                    const outputsToRemove = currentVisualOutputCount - desiredOutputCount;
                    console.log(`Removendo ${outputsToRemove} output(s) visual(is)`);
                    // Remove as últimas saídas visuais adicionadas
                    for (let i = 0; i < outputsToRemove; i++) {
                        const outputIdToRemove = currentVisualOutputs[currentVisualOutputs.length - 1 - i]; // Pega o último ID visual
                        if (outputIdToRemove && outputIdToRemove !== 'output_1') {
                            console.log(`Removendo output visual: ${outputIdToRemove}`);
                            try {
                                editor.removeNodeOutput(selectedNodeId, outputIdToRemove);
                            } catch (e) {
                                console.error(`Erro ao remover output visual ${outputIdToRemove}:`, e);
                            }
                        }
                    }
                }

                // ATUALIZA nodeInternals.outputs para refletir o estado REAL após add/remove
                // É crucial ler do editor DEPOIS das modificações visuais
                nodeInternals.outputs = { ...editor.getNodeFromId(selectedNodeId).outputs };
                console.log("Outputs internos atualizados após add/remove:", nodeInternals.outputs);

                // Mapeia os outputIds GERADOS pelo Drawflow (output_2, output_3...) para os botões
                // Isso é necessário para a exportação/importação correta
                const finalVisualOutputs = Object.keys(nodeInternals.outputs).filter(id => id !== 'output_1');
                desiredReplyButtons.forEach((button, index) => {
                    if (finalVisualOutputs[index]) {
                        // Associa o ID gerado pelo Drawflow (ex: 'output_2') ao botão correspondente nos dados
                        button.outputId = finalVisualOutputs[index];
                        console.log(`Mapeado botão ${index} (ID: ${button.id}) para output: ${button.outputId}`);
                    } else {
                        console.error(`Erro de mapeamento: Não há output visual para o botão ${index} (ID: ${button.id})`);
                        // Remove o outputId do botão se não houver correspondência visual
                        delete button.outputId;
                    }
                });
            }

            // 4. Atualiza os dados internos do nó no Drawflow (AGORA com os outputIds mapeados)
            editor.updateNodeDataFromId(selectedNodeId, finalNodeData);
            console.log("Dados internos do nó atualizados (com outputIds mapeados):", finalNodeData);

            // 5. Gera o HTML de CONTEÚDO INTERNO atualizado (sem outputs internos)
            const innerContentHTML = generateNodeInnerContentHTML(selectedNodeId, finalNodeData);
            console.log("HTML Conteúdo Interno:", innerContentHTML);

            // 6. Atualiza o visual do nó (o conteúdo da div.box)
            const nodeElement = document.querySelector(`#node-${selectedNodeId}`);
            const contentArea = nodeElement?.querySelector('.box');
            if (contentArea) {
                console.log("Atualizando área de conteúdo '.box'.");
                contentArea.innerHTML = innerContentHTML; // Atualiza o visual
            } else {
                console.warn("Área de conteúdo '.box' não encontrada no nó:", selectedNodeId);
            }

            // 7. Atualiza o HTML completo armazenado internamente (para exportação)
            const completeHTML = generateNodeHTMLVisuals(selectedNodeId, finalNodeData); // Gera HTML completo (sem outputs internos)
            nodeInternals.html = completeHTML;
            console.log("HTML completo interno atualizado.");

            // 8. NÃO chamamos updateConnectionNodes aqui. add/removeNodeOutput cuidam da visualização.
 
            // 9. Observa as mudanças no DOM e reposiciona as saídas quando estiverem prontas
            observeAndRepositionOutputs(selectedNodeId);
 
            Swal.fire({ icon: 'success', title: 'Alterações aplicadas!', showConfirmButton: false, timer: 1200 });
        }

        // Função para observar mudanças no DOM e chamar o reposicionamento
        function observeAndRepositionOutputs(nodeId) {
            const nodeElement = document.querySelector(`#node-${nodeId}`);
            const outputsContainer = nodeElement?.querySelector('.outputs');
            const nodeData = editor.getNodeFromId(nodeId)?.data;
            const nodeInternals = editor.getNodeFromId(nodeId); // Pega o nó interno
 
            if (!outputsContainer || !nodeData || nodeInternals?.name !== 'enviar_mensagem') {
                console.warn(`Observer: Container de outputs ou dados do nó ${nodeId} inválidos.`);
                return;
            }
 
            const expectedReplyButtons = (nodeData.dynamicButtons || []).filter(b => b.type === 'reply');
            const expectedOutputCount = expectedReplyButtons.length;
 
            console.log(`Observer: Iniciando para nó ${nodeId}. Esperando ${expectedOutputCount} outputs visuais.`);
 
            // Verifica se já está no estado correto (caso add/remove não tenham sido chamados)
            const initialOutputElements = outputsContainer.querySelectorAll('.output:not(.output_1)');
            if (initialOutputElements.length === expectedOutputCount) {
                 console.log(`Observer: Estado inicial já corresponde. Chamando repositionButtonOutputs imediatamente.`);
                 repositionButtonOutputs(nodeId);
                 return; // Não precisa observar
            }
 
            const observer = new MutationObserver((mutationsList, observerInstance) => {
                // Verifica se o número de outputs visuais agora corresponde ao esperado
                const currentOutputElements = outputsContainer.querySelectorAll('.output:not(.output_1)');
                console.log(`Observer: Mutação detectada. Outputs visuais atuais: ${currentOutputElements.length}`);
 
                if (currentOutputElements.length === expectedOutputCount) {
                    console.log(`Observer: Número esperado de outputs (${expectedOutputCount}) alcançado. Agendando repositionButtonOutputs.`);
                    requestAnimationFrame(() => repositionButtonOutputs(nodeId));
                    observerInstance.disconnect(); // Para de observar após sucesso
                    clearTimeout(observerTimeout); // Limpa o timeout de segurança
                }
            });
 
            // Timeout de segurança para evitar que o observer fique ativo indefinidamente
            const observerTimeout = setTimeout(() => {
                console.warn(`Observer: Timeout atingido para nó ${nodeId}. Desconectando observer.`);
                observer.disconnect();
            }, 1000); // Timeout de 1 segundo
 
            // Inicia a observação no container de outputs, focado em mudanças na lista de filhos
            observer.observe(outputsContainer, { childList: true });
        }
 
        // Função para reposicionar as saídas dos botões (baseada em índice e outputs visuais reais)
        function repositionButtonOutputs(nodeId) {
            const nodeElement = document.querySelector(`#node-${nodeId}`);
            const nodeData = editor.getNodeFromId(nodeId)?.data; // Pega dados atualizados
            if (!nodeElement || !nodeData || editor.getNodeFromId(nodeId)?.name !== 'enviar_mensagem') return;

            const buttonsContainer = nodeElement.querySelector('.buttons-container');
            const outputsContainer = nodeElement.querySelector('.outputs'); // Container onde Drawflow desenha as saídas
            if (!buttonsContainer || !outputsContainer) {
                 console.warn("Container de botões ou saídas não encontrado no nó:", nodeId);
                 return;
            }

            const replyButtons = (nodeData.dynamicButtons || []).filter(b => b.type === 'reply');

            // Pega todos os elementos de saída desenhados pelo Drawflow, exceto output_1
            // Não precisamos mais coletar e ordenar os outputs visualmente.
            // Vamos selecioná-los diretamente pelo nome esperado (output_2, output_3, ...)

            console.log(`Tentando reposicionar ${replyButtons.length} botões de resposta.`);

            replyButtons.forEach((buttonData, index) => {
                const buttonElement = buttonsContainer.querySelector(`.message-button[data-button-id="${buttonData.id}"]`);
                console.log("button element", buttonElement);

                // Mapeia o botão ao output correspondente pela convenção de nomenclatura (output_2, output_3, ...)
                // O primeiro botão (index 0) corresponde a output_2, o segundo (index 1) a output_3, etc.
                const outputIndex = index + 2;
                const targetOutputElement = outputsContainer.querySelector(`.output_${outputIndex}`);

                if (buttonElement && targetOutputElement) {
                    // Calcular posições relativas à viewport
                    const buttonRect = buttonElement.getBoundingClientRect();
                    const outputsContainerRect = outputsContainer.getBoundingClientRect();
                    const outputRect = targetOutputElement.getBoundingClientRect();
                    
                    // Calcula a posição do centro do botão
                    const buttonCenterY = buttonRect.top + (buttonRect.height / 2);
                    
                    // Calcula a posição para alinhar o centro do output com o centro do botão
                    // Subtrai metade da altura do output para centralizá-lo
                    let offsetY = 25;
                    if(index==1){
                        offsetY = 50;
                    }
                    if(index==2){
                        offsetY = 75;
                    }
                    const newTop = (buttonCenterY - outputsContainerRect.top) - (outputRect.height / 2) - offsetY;
                    
                    console.log(`Reposicionando para top: ${newTop}px (Alinhando centro do output com centro do botão ${buttonData.id || 'sem ID'})`);
                    targetOutputElement.style.top = `${newTop}px`;
                } else {
                     console.warn(`Não foi possível encontrar o botão ou a saída correspondente para o botão ${index} (ID: ${buttonData.id}).`);
                     if (!buttonElement) console.warn(`   -> Botão com ID ${buttonData.id} não encontrado no DOM.`);
                     if (!targetOutputElement) console.warn(`   -> Output no índice ${index} não encontrado na lista de outputs visuais (Total: ${outputElements.length}).`);
                }
            });
        }


        // --- Handlers para Adicionar/Remover Botões (Modificam tempNodeData) ---
        function addDynamicButtonHandler(nodeId) {
            const form = document.getElementById(`node-${nodeId}-form`); 
            if (!form) return;
            const buttonType = form.querySelector(`input[name="newButtonType_${nodeId}"]:checked`)?.value;
            const buttonTextInput = form.querySelector(`input[data-base-name="newButtonText"]`);
            const buttonUrlInput = form.querySelector(`input[data-base-name="newButtonUrl"]`);
            const buttonText = buttonTextInput?.value.trim();
            const buttonUrl = buttonUrlInput?.value.trim();

            if (!buttonType || !buttonText) { 
                Swal.fire('Atenção', 'Selecione o tipo e digite o texto do botão.', 'warning'); 
                return; 
            }
            if (buttonType === 'url' && !buttonUrl) { 
                Swal.fire('Atenção', 'A URL é obrigatória para botões do tipo URL.', 'warning'); 
                return; 
            }
            if (buttonType === 'url') { 
                try { new URL(buttonUrl); } 
                catch (_) { 
                    Swal.fire('Atenção', 'URL inválida.', 'warning'); 
                    return; 
                } 
            }

            if (!tempNodeData.dynamicButtons) tempNodeData.dynamicButtons = [];
            if (tempNodeData.dynamicButtons.length >= 3) { 
                Swal.fire('Limite Atingido', 'Máximo de 3 botões.', 'warning'); 
                return; 
            }

            const buttonId = generateUniqueId('btn');
            const newButton = { id: buttonId, text: buttonText, type: buttonType };
            
            if (buttonType === 'reply') {
                // Gera ID único para a saída, mas não a adiciona ainda
                newButton.outputId = `output_btn_${buttonId}`; // Usa ID do botão para garantir unicidade
            } else {
                newButton.url = buttonUrl;
            }

            tempNodeData.dynamicButtons.push(newButton);
            console.log("Botão adicionado (temporário):", newButton);

            // Limpa campos e atualiza lista no painel
            if (buttonTextInput) buttonTextInput.value = '';
            if (buttonUrlInput) buttonUrlInput.value = '';
            const replyRadio = form.querySelector(`input[name="newButtonType_${nodeId}"][value="reply"]`);
            if (replyRadio) replyRadio.checked = true;
            const urlDiv = document.getElementById(`newButtonUrlDiv_${nodeId}`);
            if (urlDiv) urlDiv.style.display = 'none';
            
            // Atualiza a lista visual de botões no painel
            const listDiv = document.getElementById(`existing-buttons-${nodeId}`);
            if(listDiv) listDiv.appendChild(createButtonListItem(nodeId, newButton));
        }

        function removeDynamicButtonHandler(nodeId, buttonIdToRemove) {
             if (!tempNodeData || !tempNodeData.dynamicButtons) return;
             const buttonIndex = tempNodeData.dynamicButtons.findIndex(b => b.id === buttonIdToRemove);
             if (buttonIndex === -1) return;
             const removedButton = tempNodeData.dynamicButtons.splice(buttonIndex, 1)[0]; // Remove do temp data
             console.log("Botão removido (temporário):", removedButton);
             // Remove o item da lista visual no painel
             const listItem = document.querySelector(`#existing-buttons-${nodeId} .button-item[data-button-id="${buttonIdToRemove}"]`);
             if(listItem) listItem.remove();
        }


        // --- Funções Auxiliares de Criação de Campos ---
        function createInputField(labelText, name, value, type = 'text', allowVariables = false, nodeId = null) {
            const baseName = name; // Guarda o nome base
            const uniqueIdPart = nodeId ? `${baseName}-${nodeId}` : generateUniqueId('field');
            const id = `prop-${uniqueIdPart}`; // ID único para label e input
            const div = document.createElement('div'); div.className = 'form-group';
            const label = document.createElement('label'); label.textContent = labelText + ':'; label.htmlFor = id;
            const input = document.createElement('input'); input.type = type; input.id = id;
            // Usa ID único como nome para evitar conflitos no form, mas guarda nome base
            input.name = id;
            input.dataset.baseName = baseName;
            if (type !== 'file') input.value = value || '';
            input.className = 'form-control'; // Adiciona classe Bootstrap-like
            if (type === 'file') {
                // Define os tipos aceitos de forma mais explícita
                input.accept = "image/jpeg, image/png, image/gif, video/mp4, video/quicktime, audio/mpeg, audio/ogg, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation";
            }
            div.appendChild(label);
            const inputWrapper = document.createElement('div'); // Wrapper para input e ícone
            inputWrapper.style.position = 'relative'; // Necessário para posicionar o ícone
            inputWrapper.appendChild(input);

            if (allowVariables) {
                const variableIcon = document.createElement('i');
                variableIcon.className = 'fas fa-tags variable-inserter-icon';
                variableIcon.title = 'Inserir Variável';
                variableIcon.style.position = 'absolute';
                variableIcon.style.right = '10px';
                variableIcon.style.top = '50%';
                variableIcon.style.transform = 'translateY(-50%)';
                variableIcon.style.cursor = 'pointer';
                variableIcon.style.color = '#007bff';
                variableIcon.onclick = (event) => {
                    event.stopPropagation(); // Evita que o clique feche um seletor já aberto
                    showVariableSelector(input);
                };
                inputWrapper.appendChild(variableIcon);
                // Adiciona a dica abaixo do campo
                const help = document.createElement('span');
                help.className = 'help-text';
                help.textContent = 'Use {{variavel}} ou clique no ícone.';
                div.appendChild(inputWrapper); // Adiciona o wrapper em vez do input direto
                div.appendChild(help);
            } else {
                div.appendChild(inputWrapper); // Adiciona o wrapper mesmo sem ícone para consistência
            }
            return div;
        }
        function createTextareaField(labelText, name, value, allowVariables = false, nodeId = null) {
            const baseName = name;
            const uniqueIdPart = nodeId ? `${baseName}-${nodeId}` : generateUniqueId('field');
            const id = `prop-${uniqueIdPart}`;
            const div = document.createElement('div'); div.className = 'form-group';
            const label = document.createElement('label'); label.textContent = labelText + ':'; label.htmlFor = id;
            const textarea = document.createElement('textarea'); textarea.id = id;
            textarea.name = id; textarea.dataset.baseName = baseName;
            textarea.value = value || ''; textarea.rows = 3; textarea.className = 'form-control';
            div.appendChild(label);
            const textareaWrapper = document.createElement('div');
            textareaWrapper.style.position = 'relative';
            textareaWrapper.appendChild(textarea);

            if (allowVariables) {
                const variableIcon = document.createElement('i');
                variableIcon.className = 'fas fa-tags variable-inserter-icon';
                variableIcon.title = 'Inserir Variável';
                variableIcon.style.position = 'absolute';
                variableIcon.style.right = '10px';
                variableIcon.style.top = '10px'; // Ajustado para textarea
                variableIcon.style.cursor = 'pointer';
                variableIcon.style.color = '#007bff';
                variableIcon.onclick = (event) => {
                    event.stopPropagation();
                    showVariableSelector(textarea);
                };
                textareaWrapper.appendChild(variableIcon);
                const help = document.createElement('span');
                help.className = 'help-text';
                help.textContent = 'Use {{variavel}} ou clique no ícone.';
                div.appendChild(textareaWrapper);
                div.appendChild(help);
            } else {
                div.appendChild(textareaWrapper);
            }
            return div;
        }
        function createSelectField(labelText, name, value, options, nodeId = null) {
            const baseName = name;
            const uniqueIdPart = nodeId ? `${baseName}-${nodeId}` : generateUniqueId('field');
            const id = `prop-${uniqueIdPart}`;
            const div = document.createElement('div'); div.className = 'form-group';
            const label = document.createElement('label'); label.textContent = labelText + ':'; label.htmlFor = id;
            const select = document.createElement('select'); select.id = id;
            select.name = id; select.dataset.baseName = baseName;
            select.className = 'form-control';
            options.forEach(opt => { const option = document.createElement('option'); option.value = opt.value; option.textContent = opt.text; if (opt.value === value) { option.selected = true; } select.appendChild(option); });
            div.appendChild(label); div.appendChild(select);
            return div;
        }


        // --- Drag and Drop, Validação Conexão, Auxiliares (Export, Clear, Mode), Salvar Fluxo ---
        var elements = document.getElementsByClassName('drag-drawflow'); for (var i = 0; i < elements.length; i++) { elements[i].addEventListener('touchend', drop, false); elements[i].addEventListener('touchmove', positionMobile, false); elements[i].addEventListener('touchstart', drag, false ); } var mobile_item_selec = ''; var mobile_last_move = null; function positionMobile(ev) { mobile_last_move = ev; } function allowDrop(ev) { ev.preventDefault(); } function drag(ev) { if (ev.type === "touchstart") { mobile_item_selec = ev.target.closest(".drag-drawflow").getAttribute('data-node'); } else { ev.dataTransfer.setData("node", ev.target.getAttribute('data-node')); } } function drop(ev) { let nodeName, clientX, clientY; if (ev.type === "touchend") { if (!mobile_item_selec || !mobile_last_move) return; var parentdrawflow = document.elementFromPoint( mobile_last_move.touches[0].clientX, mobile_last_move.touches[0].clientY).closest("#drawflow"); if(parentdrawflow != null) { nodeName = mobile_item_selec; clientX = mobile_last_move.touches[0].clientX; clientY = mobile_last_move.touches[0].clientY; addNodeToDrawFlow(nodeName, clientX, clientY); } mobile_item_selec = ''; mobile_last_move = null; } else { ev.preventDefault(); nodeName = ev.dataTransfer.getData("node"); clientX = ev.clientX; clientY = ev.clientY; addNodeToDrawFlow(nodeName, clientX, clientY); } }
        editor.on('connectionCreated', function(connection) { console.log('Connection created:', connection); const outputNodeId = connection.output_id; const outputNode = editor.getNodeFromId(outputNodeId); if (outputNode && outputNode.name === 'inicio') { const outputConnections = editor.getNodeFromId(outputNodeId).outputs.output_1.connections; if (outputConnections.length > 1) { console.warn("Nó 'inicio' só pode ter uma conexão de saída."); editor.removeSingleConnection(connection.output_id, connection.input_id, connection.output_class, connection.input_class); Swal.fire('Aviso', 'O nó "Início" só pode ter uma conexão de saída.', 'warning'); } } }); editor.on('connectionRemoved', function(connection) { console.log('Connection removed', connection); });
        function exportFlowData() { const exportedData = editor.export(); console.log(exportedData); const dataString = JSON.stringify(exportedData, null, 2); Swal.fire({ title: 'Dados Exportados (JSON)', html: `<pre><code style="text-align: left; display: block; white-space: pre-wrap;">${escapeHTML(dataString)}</code></pre>`, confirmButtonText: 'Fechar' }); } function clearFlow() { Swal.fire({ title: 'Limpar Fluxo?', text: "Remover todos os nós e conexões?", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Sim, limpar!', cancelButtonText: 'Cancelar' }).then((result) => { if (result.isConfirmed) { editor.clearModuleSelected(); propertiesPanel.classList.remove('visible'); applyChangesButton.style.display = 'none'; selectedNodeId = null; tempNodeData = {}; Swal.fire('Limpo!', 'O fluxo foi limpo.', 'success'); } }); } function changeMode(option) { editor.editor_mode = option; const lockIcon = document.getElementById('lock'); const unlockIcon = document.getElementById('unlock'); if(option == 'fixed') { lockIcon.style.display = 'none'; unlockIcon.style.display = 'block'; propertiesPanel.classList.remove('visible'); applyChangesButton.style.display = 'none'; } else { lockIcon.style.display = 'block'; unlockIcon.style.display = 'none'; } }
        async function saveFlow() { const title = flowTitleInput.value.trim(); const description = flowDescriptionInput.value.trim(); const flowJsonData = editor.export(); if (!title) { Swal.fire('Erro', 'O título do fluxo é obrigatório.', 'error'); return; } let hasStartNode = false; const nodes = flowJsonData.drawflow[editor.module].data; for (const nodeId in nodes) { if (nodes[nodeId].name === 'inicio') { hasStartNode = true; break; } } if (!hasStartNode) { Swal.fire('Erro', 'O fluxo deve conter pelo menos um nó "Início".', 'error'); return; } const cleanedFlowData = JSON.parse(JSON.stringify(flowJsonData)); for (const nodeId in cleanedFlowData.drawflow[editor.module].data) { const nodeData = cleanedFlowData.drawflow[editor.module].data[nodeId].data; if (nodeData && nodeData.mediaPreviewUrl && nodeData.mediaPreviewUrl.startsWith('data:')) { delete nodeData.mediaPreviewUrl; } } const payload = { title: title, description: description, data: JSON.stringify(cleanedFlowData) }; let url = '/api/flows/'; let method = 'POST'; if (flowId) { url = `/api/flows/${flowId}/`; method = 'PATCH'; } console.log(`Salvando fluxo... Método: ${method}, URL: ${url}`); Swal.fire({ title: 'Salvando...', text: 'Aguarde...', didOpen: () => { Swal.showLoading() }, allowOutsideClick: false }); try { const response = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken }, body: JSON.stringify(payload) }); if (response.ok) { const result = await response.json(); console.log("Resposta da API:", result); Swal.close(); Swal.fire('Sucesso!', 'Fluxo salvo com sucesso!', 'success'); if (method === 'POST' && result.id) { flowId = result.id; console.log("Novo flowId definido:", flowId); } } else { const errorData = await response.json().catch(() => ({ detail: `Erro ${response.status}: ${response.statusText}` })); console.error('Erro ao salvar fluxo:', response.status, errorData); Swal.close(); let errorMessage = `Erro ${response.status} ao salvar.`; if (errorData && typeof errorData === 'object') { errorMessage += '<br><br>Detalhes:<br><ul style="text-align: left;">'; for (const key in errorData) { errorMessage += `<li><strong>${escapeHTML(key)}:</strong> ${escapeHTML(JSON.stringify(errorData[key]))}</li>`; } errorMessage += '</ul>'; } Swal.fire('Erro ao Salvar', errorMessage, 'error'); } } catch (error) { console.error('Erro de rede/JS:', error); Swal.close(); Swal.fire('Erro', 'Erro de comunicação ao salvar.', 'error'); } }

        // Inicializa modo edição por padrão
        changeMode('edit');
         function showApiResultTab(buttonElement, tabIdToShow) {
             const resultArea = buttonElement.closest('.api-test-result-area');
             if (!resultArea) return;
             // Esconde todos os conteúdos das tabs
             resultArea.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none');
             // Remove classe 'active' de todos os botões
             resultArea.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
             // Mostra o conteúdo da tab selecionada
             const tabContent = resultArea.querySelector(`#${tabIdToShow}`);
             if (tabContent) tabContent.style.display = 'block';
             // Adiciona classe 'active' ao botão clicado
             buttonElement.classList.add('active');
         }
 
         // --- Funções para Mapeamento de Resposta da API ---
 
         function renderResponseMappings(nodeId, mappings = []) {
             const listDiv = document.getElementById(`response-mappings-list-${nodeId}`);
             if (!listDiv) return;
             listDiv.innerHTML = ''; // Limpa lista atual
 
             mappings.forEach((mapping, index) => {
                 const itemDiv = document.createElement('div');
                 itemDiv.className = 'response-mapping-item';
                 itemDiv.dataset.index = index; // Guarda o índice para referência
                 itemDiv.style.display = 'flex';
                 itemDiv.style.alignItems = 'center';
                 itemDiv.style.marginBottom = '8px';
                 itemDiv.style.gap = '8px'; // Espaçamento entre elementos
 
                 // Input para JSONPath
                 const pathInput = document.createElement('input');
                 pathInput.type = 'text';
                 pathInput.placeholder = 'Caminho JSON (ex: $.data.id)';
                 pathInput.value = mapping.jsonPath || '';
                 pathInput.className = 'form-control';
                 pathInput.dataset.mappingName = 'jsonPath'; // Identifica o campo
                 pathInput.style.flexGrow = '1'; // Ocupa espaço disponível
                 pathInput.addEventListener('input', handleFormChange); // Usa o handler geral
 
                 // Select para Variável de Destino
                 const variableSelect = document.createElement('select');
                 variableSelect.className = 'form-control';
                 variableSelect.dataset.mappingName = 'variableName'; // Identifica o campo
                 variableSelect.style.minWidth = '150px'; // Largura mínima
                 variableSelect.addEventListener('change', handleFormChange); // Usa o handler geral
 
                 // Opção padrão
                 const defaultOption = document.createElement('option');
                 defaultOption.value = '';
                 defaultOption.textContent = 'Selecione Variável...';
                 variableSelect.appendChild(defaultOption);
 
                 // Popula com variáveis disponíveis
                 availableVariables.forEach(v => {
                     const option = document.createElement('option');
                     option.value = v.name; // Salva o nome da variável
                     option.textContent = `{{${v.name}}}`; // Mostra no formato {{var}}
                     if (v.name === mapping.variableName) {
                         option.selected = true;
                     }
                     variableSelect.appendChild(option);
                 });
 
                 // Botão Remover
                 const removeButton = document.createElement('button');
                 removeButton.type = 'button';
                 removeButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
                 removeButton.className = 'control-button remove-button small-button'; // Classe para botão pequeno
                 removeButton.title = 'Remover Mapeamento';
                 removeButton.onclick = () => removeResponseMappingRow(nodeId, index);
 
                 itemDiv.appendChild(pathInput);
                 itemDiv.appendChild(document.createTextNode(' → ')); // Seta indicativa
                 itemDiv.appendChild(variableSelect);
                 itemDiv.appendChild(removeButton);
 
                 listDiv.appendChild(itemDiv);
             });
         }
 
         function addResponseMappingRow(nodeId) {
             if (!tempNodeData.responseMappings) {
                 tempNodeData.responseMappings = [];
             }
             // Adiciona um mapeamento vazio ao array temporário
             tempNodeData.responseMappings.push({ jsonPath: '', variableName: '' });
             // Re-renderiza a lista no painel
             renderResponseMappings(nodeId, tempNodeData.responseMappings);
             console.log("Linha de mapeamento adicionada (temporário).");
         }
 
         function removeResponseMappingRow(nodeId, indexToRemove) {
             if (!tempNodeData.responseMappings || indexToRemove < 0 || indexToRemove >= tempNodeData.responseMappings.length) {
                 return;
             }
             // Remove o mapeamento do array temporário pelo índice
             const removed = tempNodeData.responseMappings.splice(indexToRemove, 1);
             // Re-renderiza a lista no painel
             renderResponseMappings(nodeId, tempNodeData.responseMappings);
             console.log("Linha de mapeamento removida (temporário):", removed);
         }

        // --- Funções para Seleção de Variáveis ---
        function showVariableSelector(targetInputElement) {
            // Remove seletor anterior, se existir
            if (variableSelectorElement) {
                variableSelectorElement.remove();
                variableSelectorElement = null;
            }

            variableSelectorElement = document.createElement('div');
            variableSelectorElement.className = 'variable-selector-dropdown';
            // Estilos básicos (podem ser movidos para CSS)
            variableSelectorElement.style.position = 'absolute';
            variableSelectorElement.style.backgroundColor = 'white';
            variableSelectorElement.style.border = '1px solid #ccc';
            variableSelectorElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            variableSelectorElement.style.maxHeight = '200px';
            variableSelectorElement.style.overflowY = 'auto';
            variableSelectorElement.style.zIndex = '1050'; // Acima de outros elementos

            const inputRect = targetInputElement.getBoundingClientRect();
            variableSelectorElement.style.top = `${inputRect.bottom + window.scrollY}px`;
            variableSelectorElement.style.left = `${inputRect.left + window.scrollX}px`;
            variableSelectorElement.style.minWidth = `${inputRect.width}px`;

            const list = document.createElement('ul');
            list.style.listStyle = 'none';
            list.style.padding = '5px 0';
            list.style.margin = '0';

            availableVariables.forEach(variable => {
                const listItem = document.createElement('li');
                listItem.style.padding = '5px 10px';
                listItem.style.cursor = 'pointer';
                listItem.innerHTML = `<strong>${variable.name}</strong><br><small>${variable.description}</small>`;
                listItem.onmouseover = () => listItem.style.backgroundColor = '#f0f0f0';
                listItem.onmouseout = () => listItem.style.backgroundColor = 'white';
                listItem.onclick = () => {
                    insertVariable(targetInputElement, variable.name);
                    if (variableSelectorElement) variableSelectorElement.remove();
                    variableSelectorElement = null;
                };
                list.appendChild(listItem);
            });

            variableSelectorElement.appendChild(list);
            document.body.appendChild(variableSelectorElement);

            // Adiciona listener para fechar ao clicar fora
            setTimeout(() => { // Timeout para evitar fechar imediatamente no clique do ícone
                document.addEventListener('click', closeVariableSelectorOnClickOutside, { once: true });
            }, 0);
        }

        function closeVariableSelectorOnClickOutside(event) {
            if (variableSelectorElement && !variableSelectorElement.contains(event.target) && !event.target.classList.contains('variable-inserter-icon')) {
                variableSelectorElement.remove();
                variableSelectorElement = null;
            } else if (variableSelectorElement) {
                // Se clicou dentro ou no ícone, re-adiciona o listener para o próximo clique
                document.addEventListener('click', closeVariableSelectorOnClickOutside, { once: true });
            }
        }

        function insertVariable(targetInputElement, variableName) {
            const variableText = `${variableName}`;
            const start = targetInputElement.selectionStart;
            const end = targetInputElement.selectionEnd;
            const currentValue = targetInputElement.value;
            const newValue = currentValue.substring(0, start) + variableText + currentValue.substring(end);

            targetInputElement.value = newValue;

            // Atualiza tempNodeData (simula evento 'input')
            const event = new Event('input', { bubbles: true });
            targetInputElement.dispatchEvent(event);

            // Reposiciona o cursor após a variável inserida
            targetInputElement.focus();
            targetInputElement.selectionStart = targetInputElement.selectionEnd = start + variableText.length;
        }

        // --- Função para Teste de Chamada de API ---
        async function testApiCall(nodeId) {
            if (!selectedNodeId || selectedNodeId !== nodeId || !tempNodeData) {
                Swal.fire('Erro', 'Selecione o nó de API e configure-o antes de testar.', 'error');
                return;
            }

            const { url, method, headers, body } = tempNodeData; // Pega dados atuais do painel
            const resultArea = document.getElementById(`api-test-result-${nodeId}`);
            const responseBodyPre = resultArea?.querySelector(`#response-body-${nodeId} pre`);
            const responseHeadersPre = resultArea?.querySelector(`#response-headers-${nodeId} pre`);

            if (!url || !method) {
                Swal.fire('Erro', 'URL e Método HTTP são obrigatórios para testar.', 'error');
                return;
            }
            if (!resultArea || !responseBodyPre || !responseHeadersPre) {
                 console.error("Elementos da área de resultado do teste não encontrados:", `api-test-result-${nodeId}`);
                 Swal.fire('Erro Interno', 'Não foi possível encontrar os elementos para exibir o resultado.', 'error');
                 return;
            }

            resultArea.style.display = 'block'; // Mostra a área de resultado
            responseBodyPre.textContent = 'Testando...';
            responseHeadersPre.textContent = 'Aguardando...';
            // Garante que a tab de Resposta esteja ativa ao iniciar
            showApiResultTab(resultArea.querySelector('.tab-button'), `response-body-${nodeId}`);

            Swal.fire({
                title: 'Testando API...',
                text: 'Aguarde enquanto a requisição é feita.',
                didOpen: () => { Swal.showLoading() },
                allowOutsideClick: false
            });

            let parsedHeaders = {};
            try {
                parsedHeaders = headers ? JSON.parse(headers) : {};
                if (typeof parsedHeaders !== 'object' || parsedHeaders === null) throw new Error("Headers must be a JSON object.");
            } catch (e) {
                Swal.close();
                responseBodyPre.textContent = `Erro ao processar Cabeçalhos (Headers):\n${e.message}\n\nVerifique se é um JSON válido. Ex: {"Content-Type": "application/json"}`;
                responseHeadersPre.textContent = '-';
                Swal.fire('Erro nos Cabeçalhos', 'Verifique o formato JSON dos cabeçalhos.', 'error');
                return;
            }

            let parsedBody = null;
            if (method !== 'GET' && method !== 'HEAD' && body) {
                try {
                    parsedBody = JSON.parse(body);
                    // Não precisa stringify aqui, fetch faz isso se Content-Type for json
                } catch (e) {
                    Swal.close();
                    responseBodyPre.textContent = `Erro ao processar Corpo (Body):\n${e.message}\n\nVerifique se é um JSON válido.`;
                    responseHeadersPre.textContent = '-';
                    Swal.fire('Erro no Corpo', 'Verifique o formato JSON do corpo da requisição.', 'error');
                    return;
                }
            }

            // Adiciona Content-Type se não existir e o corpo for JSON
            if (parsedBody && !parsedHeaders['Content-Type'] && !parsedHeaders['content-type']) {
                parsedHeaders['Content-Type'] = 'application/json';
            }

            // Aviso sobre variáveis
            const hasVariables = (url + headers + body).includes('{{');
            if (hasVariables) {
                console.warn("Teste de API: Variáveis encontradas. Serão enviadas literalmente.");
                // Poderia adicionar um aviso mais proeminente se desejado
            }

            try {
                const startTime = performance.now();
                const response = await fetch(url, {
                    method: method,
                    headers: parsedHeaders,
                    body: (parsedBody && method !== 'GET' && method !== 'HEAD') ? JSON.stringify(parsedBody) : undefined, // Stringify aqui
                    mode: 'cors' // Tenta CORS, pode falhar dependendo do servidor de destino
                });
                const endTime = performance.now();
                const duration = (endTime - startTime).toFixed(2);

                const responseBodyText = await response.text(); // Lê como texto primeiro
                let responseBodyFormatted = responseBodyText;
                let responseHeaders = {};
                response.headers.forEach((value, key) => { responseHeaders[key] = value; });

                // Tenta formatar como JSON se for o caso
                try {
                    const jsonBody = JSON.parse(responseBodyText);
                    responseBodyFormatted = JSON.stringify(jsonBody, null, 2);
                } catch (e) { /* Não é JSON, mantém como texto */ }

                // Exibe nos <pre> corretos
                responseBodyPre.textContent = responseBodyFormatted;
                responseHeadersPre.textContent = JSON.stringify(responseHeaders, null, 2);

                Swal.close();
                Swal.fire('Teste Concluído', `Status: ${response.status}`, response.ok ? 'success' : 'warning');

            } catch (error) {
                const endTime = performance.now();
                // const duration = (endTime - startTime).toFixed(2); // startTime não definido aqui
                console.error("Erro no Teste de API:", error);
                Swal.close();
                let errorDetails = `Erro: ${error.message}\n\n`;
                if (error.cause) {
                    errorDetails += `Causa: ${error.cause}\n\n`;
                }
                errorDetails += `Verifique a URL, a configuração de CORS no servidor de destino ou a conectividade de rede.`;
                responseBodyPre.textContent = errorDetails;
                responseHeadersPre.textContent = '-';
                Swal.fire('Erro no Teste', 'Não foi possível completar a requisição.', 'error');
            }
        }
            if (!resultArea || !resultPre) {
                 console.error("Área de resultado do teste não encontrada:", `api-test-result-${nodeId}`);
                 Swal.fire('Erro Interno', 'Não foi possível encontrar a área para exibir o resultado.', 'error');
                 return;
            }

            resultArea.style.display = 'block';
            resultPre.textContent = 'Testando...';
            Swal.fire({
                title: 'Testando API...',
                text: 'Aguarde enquanto a requisição é feita.',
                didOpen: () => { Swal.showLoading() },
                allowOutsideClick: false
            });

            let parsedHeaders = {};
            try {
                parsedHeaders = headers ? JSON.parse(headers) : {};
                if (typeof parsedHeaders !== 'object' || parsedHeaders === null) throw new Error("Headers must be a JSON object.");
            } catch (e) {
                Swal.close();
                resultPre.textContent = `Erro ao processar Cabeçalhos (Headers):\n${e.message}\n\nVerifique se é um JSON válido. Ex: {"Content-Type": "application/json"}`;
                Swal.fire('Erro nos Cabeçalhos', 'Verifique o formato JSON dos cabeçalhos.', 'error');
                return;
            }

            let parsedBody = null;
            if (method !== 'GET' && method !== 'HEAD' && body) {
                try {
                    parsedBody = JSON.parse(body);
                    // Não precisa stringify aqui, fetch faz isso se Content-Type for json
                } catch (e) {
                    Swal.close();
                    resultPre.textContent = `Erro ao processar Corpo (Body):\n${e.message}\n\nVerifique se é um JSON válido.`;
                    Swal.fire('Erro no Corpo', 'Verifique o formato JSON do corpo da requisição.', 'error');
                    return;
                }
            }

            // Adiciona Content-Type se não existir e o corpo for JSON
            if (parsedBody && !parsedHeaders['Content-Type'] && !parsedHeaders['content-type']) {
                parsedHeaders['Content-Type'] = 'application/json';
            }

            // Aviso sobre variáveis
            const hasVariables = (url + headers + body).includes('{{');
            if (hasVariables) {
                console.warn("Teste de API: Variáveis encontradas. Serão enviadas literalmente.");
                // Poderia adicionar um aviso mais proeminente se desejado
            }

            try {
                const startTime = performance.now();
                const response = await fetch(url, {
                    method: method,
                    headers: parsedHeaders,
                    body: (parsedBody && method !== 'GET' && method !== 'HEAD') ? JSON.stringify(parsedBody) : undefined, // Stringify aqui
                    mode: 'cors' // Tenta CORS, pode falhar dependendo do servidor de destino
                });
                const endTime = performance.now();
                const duration = (endTime - startTime).toFixed(2);

                const responseBodyText = await response.text(); // Lê como texto primeiro
                let responseBodyFormatted = responseBodyText;
                let responseHeaders = {};
                response.headers.forEach((value, key) => { responseHeaders[key] = value; });

                // Tenta formatar como JSON se for o caso
                try {
                    const jsonBody = JSON.parse(responseBodyText);
                    responseBodyFormatted = JSON.stringify(jsonBody, null, 2);
                } catch (e) { /* Não é JSON, mantém como texto */ }

                const resultText = `--- Status: ${response.status} ${response.statusText} (${duration} ms) ---\n\n` +
                                   `--- Cabeçalhos da Resposta ---\n${JSON.stringify(responseHeaders, null, 2)}\n\n` +
                                   `--- Corpo da Resposta ---\n${responseBodyFormatted}`;

                resultPre.textContent = resultText;
                Swal.close();
                Swal.fire('Teste Concluído', `Status: ${response.status}`, response.ok ? 'success' : 'warning');

            } catch (error) {
                const endTime = performance.now();
                // const duration = (endTime - startTime).toFixed(2); // startTime não definido aqui
                console.error("Erro no Teste de API:", error);
                Swal.close();
                let errorDetails = `Erro: ${error.message}\n\n`;
                if (error.cause) {
                    errorDetails += `Causa: ${error.cause}\n\n`;
                }
                errorDetails += `Verifique a URL, a configuração de CORS no servidor de destino ou a conectividade de rede.`;
                resultPre.textContent = errorDetails;
                Swal.fire('Erro no Teste', 'Não foi possível completar a requisição.', 'error');
            }