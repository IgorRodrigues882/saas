const emojiButton = document.getElementById('emoji-button');
const messageInput = document.getElementById('status_description');
let ajustadesc = '';

// Cria o Emoji Mart picker
const picker = new EmojiMart.Picker({
  onEmojiSelect: (emoji) => {
    ajustadesc = emoji.native + messageInput.value;
    messageInput.value = ajustadesc;  // Adiciona o emoji ao campo de texto
  },
  theme: 'light',
});

// Variável para controlar se o picker está visível
let pickerVisible = false;

// Função para exibir o picker
function showPicker() {
  if (!pickerVisible) {
    document.body.appendChild(picker);  // Adiciona o picker ao corpo da página
    
    // Posiciona o picker abaixo do botão
    const buttonRect = emojiButton.getBoundingClientRect();
    
    // Definir estilo do picker para garantir que fique visível sobre o modal
    picker.style.position = 'fixed'; // Usamos fixed em vez de absolute
    picker.style.top = `${buttonRect.bottom + 5}px`; // 5px abaixo do botão
    picker.style.left = `${buttonRect.left}px`;
    picker.style.zIndex = '9999'; // z-index alto para ficar acima do modal
    
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

var statuscandidate = (function(){
    let tabela_scroll;
    let btn_importa_csv;
    let currentPage = 1;
    let totalPages = 1;
    let editar_vaga = false;
    let id_statuscandidate = 0;
    let loading_history = false; // Movido para o escopo do módulo


    // Selecionar os elementos necessários
    const colorInput = document.getElementById('corkankan');
    const statusInput = document.getElementById('status_description');

    // Adicionar um evento de mudança e input ao seletor de cor
    // Usamos ambos os eventos para capturar tanto mudanças finais quanto durante a seleção
    colorInput.addEventListener('change', updateTextColor);
    colorInput.addEventListener('input', updateTextColor);

    // Função para atualizar a cor do texto
    function updateTextColor() {
    // Obter a cor selecionada do input de cor
    const selectedColor = colorInput.value;
    
    // Aplicar a cor ao texto do input de status
    statusInput.style.color = selectedColor;
    }

    // Executar uma vez para aplicar qualquer cor inicial
    updateTextColor();
    
    // Função para carregar os itens (antes estava dentro do init)
    function carrega_itens(page){
        let tbody = document.getElementById('tbody-statuscandidate');
        let loader = document.getElementById('loader-statuscandidate');
        tbody.innerHTML = '';
        loader.style.display = 'block';
        var data = {
            // Parâmetros de filtro podem ser adicionados aqui
        }
        fetch(`api/statuscandidate/filtragem_statuscandidate/?page=${page}`, {  
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
          },
          body: JSON.stringify(data)
        }).then(res => res.json())
        .then(data => {
          if(data){
            tbody.innerHTML = gera_tabela(data.results);
            loader.style.display = 'none';
            updatePagination(data.count);
          }
          else{
            tbody.innerHTML = '<tr><td>Não há dados</td></tr>';
            loader.style.display = 'none';
          }
        })
        .catch(error => {
            console.error('Erro ao carregar mais logs:', error);
        }).finally(() => {
            loading_history = false;
            loader.style.display = 'none';
        });
    }

    // Outras funções que são utilizadas em carrega_itens ou na renderização da tabela
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
                      <div class="square-box me-2"><img class="img-fluid b-r-5"
                          src="" alt=""></div>
                      <div class="media-body ps-2">
                        <div class="avatar-details"><a href="javascript:void(0)">
                            <h6 style="color:${index[i].corkankan};">${index[i].status_description}</h6>
                          </a><span>${index[i].status_id}</span></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <h6>${index[i].status_agrupado}</h6>
                  </td>
                  <td>
                    <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown"
                          aria-haspopup="true" aria-expanded="false">Opções</button>
                    <div class="dropdown-menu">
                        <a class="dropdown-item"
                          href="javascript:void(0)" onclick="statuscandidate.deletestatuscandidate(${index[i].status_id})">Excluir</a>
                        <a class="dropdown-item"
                          href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#addstatuscandidate" onclick="statuscandidate.editarstatuscandidate(${index[i].status_id})">Editar</a>
                    </div>
                  </td>
                </tr>
                `;
            }
        } else {
            rowsHTML = '<tr><td colspan="3" style="text-align: center;">Nenhum dado encontrado</td></tr>';
        }
        return rowsHTML;
    }

    function updatePagination(count) {
        totalPages = Math.ceil(count / 5);
        const pagination = document.getElementById('pagination-statuscandidate');
        
        // Remove itens existentes de paginação (exceto os botões de anterior e próximo)
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
            pagination.insertBefore(li, document.getElementById('next-page-statuscandidate'));
        }
        
        document.getElementById('previous-page-statuscandidate').classList.toggle('disabled', currentPage === 1);
        document.getElementById('next-page-statuscandidate').classList.toggle('disabled', currentPage === totalPages);
    }

    function loadPage(page) {
        currentPage = page;
        carrega_itens(page);
    }

    // Função init para configurar os eventos e outras inicializações
    function init(){
        // Exemplo de configuração de elementos
        btn_importa_csv = document.getElementById('new_csv');
        tabela_scroll = document.getElementById('div_scroll');

        // Configuração do sistema de pesquisa com typeahead
        // (function ($) {
        //     var bestPictures = new Bloodhound({
        //       datumTokenizer: Bloodhound.tokenizers.obj.whitespace("value"),
        //       queryTokenizer: Bloodhound.tokenizers.whitespace,
        //       prefetch: "",
        //       remote: {
        //         url: `api/statuscandidate/busca/?query=%QUERY`,
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

        // Evento para filtrar itens
        $('#filtrar').on('click', function(){
          currentPage = 1;
          carrega_itens(currentPage);
        });

        // Eventos para paginação
        document.getElementById('previous-page-statuscandidate').addEventListener('click', () => {
          if (currentPage > 1) {
              loadPage(currentPage - 1);
          }
        });
      
        document.getElementById('next-page-statuscandidate').addEventListener('click', () => {
            if (currentPage < totalPages) {
                loadPage(currentPage + 1);
            }
        });

        // Carrega os itens iniciais
        carrega_itens(1);

        // Configuração para salvar/exportar, etc.
        $("#salvar_statuscandidate").on("click", function(){
            Swal.fire({
              title: 'Aguarde',
              text: 'Por favor, espere...',
              icon: 'info',
              allowOutsideClick: false,
              showConfirmButton: false,
              willOpen: () => {
                  Swal.showLoading();
              }
          });
            let url = (editar_vaga) ? `api/statuscandidate/${id_statuscandidate}/`: "api/statuscandidate/";
            let method = (editar_vaga) ? 'PATCH' : 'POST';
            let status_description = $("#status_description").val();
            let status_description_short = $("#status_description_short").val();
            let status_agrupado = $("#status_agrupado").val();
            let corkankan = $("#corkankan").val();
            let erro = '';
            if (status_description == ''){
                erro = 'O campo "Status documento" é obrigatório';
            }
            if (status_description_short == ''){
                erro = 'O campo "Status reduzido" é obrigatório';
            }
            if(status_agrupado == ''){
                erro = 'O campo "Status agrupado" é obrigatório';
            }
            if (erro != ''){
                Swal.fire({
                    text: erro,
                    icon: "error",
                    buttonsStyling: false,
                    confirmButtonText: "Ok",
                    customClass: {
                      confirmButton: "btn btn-primary"
                    }
                  });
                  return;
            }
            const formData = new FormData();
            formData.append('status_description', status_description);
            formData.append('status_description_short', status_description_short);
            formData.append('status_agrupado', status_agrupado);
            formData.append('corkankan', corkankan);
            fetch(url,{
                method: method,
                headers: {
                    'X-CSRFToken': csrftoken,
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if(data.status_id){
                    Swal.fire({
                        text: "Salvo com sucesso!",
                        icon: "success",
                        buttonsStyling: false,
                        confirmButtonText: "Ok",
                        customClass: {
                            confirmButton: "btn btn-primary"
                        }
                    });
                    carrega_itens(1);
                }
                else{
                    Swal.fire({
                        text: "Ocorreu um erro",
                        icon: "error",
                        buttonsStyling: false,
                        confirmButtonText: "Ok",
                        customClass: {
                          confirmButton: "btn btn-primary"
                        }
                      });
                }
            });
        });

        // Exportar usando o endpoint universal
        $("#export_btn_statuscandidate").on('click', function(){
          Swal.fire({
              title: 'Aguarde',
              text: 'Preparando exportação...', // Mensagem mais genérica
              showConfirmButton: false,
              willOpen: () => Swal.showLoading()
          });

          // 1. Definir os parâmetros para o endpoint universal
          const exportFormat = $("#export_format_statuscandidate").val()?.toLowerCase().trim() || 'csv';
          const modelName = 'recrutamento.CandidateStatus';

          // Define os campos TÉCNICOS que você quer exportar
          const fieldsToExport = [
              'status_id',
              'status_description',
              'status_description_short',
              'status_agrupado',
              'dtcadastro', // CORRIGIDO: Campo técnico para Processo
          ];

          // Define o mapeamento de nomes técnicos para nomes amigáveis (Labels)
          // Use os nomes exibidos no cabeçalho da tabela HTML
          const fieldLabels = {
              'status_id': 'ID', // Label para ID (não está na tabela, mas pode ser útil)
              'status_description': 'Status',
              'status_description_short': 'Descrição curta', // Label para o campo corrigido
              'status_agrupado': 'Status agrupado',
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

    function deletestatuscandidate(id) {
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
              fetch(`api/statuscandidate/${id}/`, {
                  method: "DELETE",
                  headers: {
                      'Content-Type': 'application/json',
                      'X-CSRFToken': csrftoken,
                  },
              }).then(response => {
                  if (response.status === 204) {
                      Swal.fire({
                          icon: 'success',
                          title: 'Item Excluído!',
                          showConfirmButton: false,
                          timer: 1500
                      });
                      // Agora chama a função carrega_itens que está no escopo do módulo
                      carrega_itens(1);
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

    function editarstatuscandidate(id){
      editar_vaga = true;
      id_statuscandidate = id;
      Swal.fire({
        title: 'Aguarde',
        text: 'Carregando dados',
        icon: 'info',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
            Swal.showLoading();
        }
      });
      fetch(`api/statuscandidate/${id}/`)
      .then(response => response.json())
      .then(data => {
        $("#status_description").val(data.status_description);
        $("#status_description_short").val(data.status_description_short);
        $("#status_agrupado").val(data.status_agrupado);
        $("#corkankan").val(data.corkankan);
        statusInput.style.color = data.corkankan;
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

    function newVaga(){
      editar_vaga = false;
      id_statuscandidate = 0;
      ajustadesc=''
      $("#status_description").val('');
      $("#status_description_short").val('');
      $("#status_agrupado").val('');
      $("#corkankan").val('&000000');
      statusInput.style.color = '#000000';
    }

    return {
        init: init,
        deletestatuscandidate: deletestatuscandidate,
        editarstatuscandidate: editarstatuscandidate,
        newVaga: newVaga,
        // Se necessário, você também pode expor carrega_itens:
        carrega_itens: carrega_itens
    };
})();

statuscandidate.init();
