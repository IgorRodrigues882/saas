var std = (function(){
  let tabela_scroll;
  let btn_importa_csv;
  let currentPage = 1;
  let totalPages = 1;
  let editar_std = false;
  let id_std = 0;
  let loading_history = false;

  // Função principal para carregar os itens
  function carrega_itens(page){
      let tbody = document.getElementById('tbody-std');
      let loader = document.getElementById('loader-std');
      tbody.innerHTML = '';
      loader.style.display = 'block';
      
      fetch(`api/std/filtragem_std/?page=${page}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrftoken,
          },
          body: JSON.stringify({})
      })
      .then(res => res.json())
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
          console.error('Erro:', error);
          loader.style.display = 'none';
      });
  }

  // Função para gerar a tabela HTML
  function gera_tabela(index){
      let rowsHTML = '';
      if (!Array.isArray(index)) index = [index];

      if(index.length > 0){
          for(let i = 0; i < index.length; i++){
              rowsHTML += `
              <tr>
                  <td>
                      <div class="media">
                          <div class="square-box me-2">
                              <img class="img-fluid b-r-5" src="/static/assets/images/dashboard/folder1.png" alt="">
                          </div>
                          <div class="media-body ps-2">
                              <div class="avatar-details">
                                  <a href="javascript:void(0)">
                                      <h6>${index[i].document_type_std}</h6>
                                  </a>
                                  <span>${index[i].document_type_std_id}</span>
                              </div>
                          </div>
                      </div>
                  </td>
                  <td>
                      <h6>${index[i].processo}</h6>
                  </td>
                  <td>
                      <button class="btn btn-primary dropdown-toggle" type="button" 
                          data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                          Opções
                      </button>
                      <div class="dropdown-menu">
                          <a class="dropdown-item" href="javascript:void(0)" 
                              onclick="std.deletestd(${index[i].document_type_std_id})">
                              Excluir
                          </a>
                          <a class="dropdown-item" href="javascript:void(0)" 
                              data-bs-toggle="modal" data-bs-target="#addstd" 
                              onclick="std.editarstd(${index[i].document_type_std_id})">
                              Editar
                          </a>
                      </div>
                  </td>
              </tr>`;
          }
      } else {
          rowsHTML = '<tr><td colspan="3" style="text-align: center;">Nenhum dado encontrado</td></tr>';
      }
      return rowsHTML;
  }

  // Função de paginação
  function updatePagination(count) {
      totalPages = Math.ceil(count / 5);
      const pagination = document.getElementById('pagination-std');
      
      while (pagination.children.length > 2) {
          pagination.removeChild(pagination.children[1]);
      }
      
      for (let i = 1; i <= totalPages; i++) {
          const li = document.createElement('li');
          li.className = 'page-item' + (i === currentPage ? ' active' : '');
          const a = document.createElement('a');
          a.className = 'page-link';
          a.href = 'javascript:void(0)';
          a.textContent = i;
          a.addEventListener('click', () => loadPage(i));
          li.appendChild(a);
          pagination.insertBefore(li, document.getElementById('next-page-std'));
      }
      
      document.getElementById('previous-page-std').classList.toggle('disabled', currentPage === 1);
      document.getElementById('next-page-std').classList.toggle('disabled', currentPage === totalPages);
  }

  // Função para carregar página específica
  function loadPage(page) {
      currentPage = page;
      carrega_itens(page);
  }

  // Função de inicialização
  function init(){
      // Configuração do typeahead
    //   (function ($) {
    //       var bestPictures = new Bloodhound({
    //           datumTokenizer: Bloodhound.tokenizers.obj.whitespace("value"),
    //           queryTokenizer: Bloodhound.tokenizers.whitespace,
    //           prefetch: "",
    //           remote: {
    //               url: `api/std/busca/?query=%QUERY`,
    //               wildcard: "%QUERY",
    //               filter: function (response) { return response; }
    //           }
    //       });

    //       $(".faq-form .typeahead")
    //           .on('typeahead:asyncrequest', () => $(".loading-indicator-itens").show())
    //           .on('typeahead:asyncreceive', () => $(".loading-indicator-itens").hide())
    //           .typeahead(null, {
    //               name: "document_reasons",
    //               display: 'document_reasons',
    //               limit: 15,
    //               source: bestPictures
    //           })
    //           .on('input', function() {
    //               if ($(this).val() === '') $(".loading-indicator-itens").hide();
    //           });
    //   })(jQuery);

      // Eventos
      $('#filtrar').on('click', () => {
          currentPage = 1;
          carrega_itens(currentPage);
      });

      document.getElementById('previous-page-std').addEventListener('click', () => {
          if (currentPage > 1) loadPage(currentPage - 1);
      });

      document.getElementById('next-page-std').addEventListener('click', () => {
          if (currentPage < totalPages) loadPage(currentPage + 1);
      });

      // Evento de salvar
      $("#salvar_std").on("click", function(){
          Swal.fire({
              title: 'Aguarde',
              text: 'Por favor, espere...',
              icon: 'info',
              allowOutsideClick: false,
              showConfirmButton: false,
              willOpen: () => Swal.showLoading()
          });

          const url = editar_std ? `api/std/${id_std}/` : "api/std/";
          const method = editar_std ? 'PATCH' : 'POST';
          const document_type_std = $("#document_type_std").val();
          const processo = $("#processo").val();

          if (!document_type_std || !processo) {
              Swal.fire({
                  text: 'Preencha todos os campos obrigatórios!',
                  icon: "error",
                  confirmButtonText: "Ok",
                  customClass: { confirmButton: "btn btn-primary" }
              });
              return;
          }

          const formData = new FormData();
          formData.append('document_type_std', document_type_std);
          formData.append('processo', processo);

          fetch(url, {
              method: method,
              headers: { 'X-CSRFToken': csrftoken },
              body: formData
          })
          .then(response => response.json())
          .then(data => {
              if(data.document_type_std_id) {
                  Swal.fire({
                      text: "Salvo com sucesso!",
                      icon: "success",
                      confirmButtonText: "Ok",
                      customClass: { confirmButton: "btn btn-primary" }
                  });
                  carrega_itens(1);
              } else {
                  Swal.fire({
                      text: "Ocorreu um erro",
                      icon: "error",
                      confirmButtonText: "Ok",
                      customClass: { confirmButton: "btn btn-primary" }
                  });
              }
          })
          .finally(() => Swal.close());
      });

      // Exportar dados
      $("#export_btn_grupodoc").on('click', function(){
        Swal.fire({
            title: 'Aguarde',
            text: 'Preparando exportação...', // Mensagem mais genérica
            showConfirmButton: false,
            willOpen: () => Swal.showLoading()
        });

        // 1. Definir os parâmetros para o endpoint universal
        const exportFormat = $("#export_format_grupodoc").val()?.toLowerCase().trim() || 'csv';
        const modelName = 'recrutamento.DocumentTypeStd';

        // Define os campos TÉCNICOS que você quer exportar
        const fieldsToExport = [
            'document_type_std_id',
            'document_type_std',
            'processo',
            'dtcadastro',
        ];

        // Define o mapeamento de nomes técnicos para nomes amigáveis (Labels)
        // Use os nomes exibidos no cabeçalho da tabela HTML
        const fieldLabels = {
            'document_type_std_id': 'ID', // Label para ID (não está na tabela, mas pode ser útil)
            'document_type_std': 'Grupo doc',
            'processo': 'Processo', // Label para o campo corrigido
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

      // Carregar dados iniciais
      carrega_itens(1);
  }

  // Função de exclusão
  function deletestd(id) {
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
              fetch(`api/std/${id}/`, {
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

  // Função de edição
  function editarstd(id){
      editar_std = true;
      id_std = id;
      Swal.fire({
          title: 'Carregando...',
          showConfirmButton: false,
          willOpen: () => Swal.showLoading()
      });

      fetch(`api/std/${id}/`)
          .then(response => response.json())
          .then(data => {
              $("#document_type_std").val(data.document_type_std);
              $("#processo").val(data.processo).trigger('change');
          })
          .catch(() => Swal.fire('Erro!', 'Falha ao carregar dados', 'error'))
          .finally(() => Swal.close());
  }

  // Nova entrada
  function newVaga(){
      editar_std = false;
      id_std = 0;
      $("#document_type_std").val('');
      $("#processo").val("").trigger('change');
  }

  return {
      init: init,
      deletestd: deletestd,
      editarstd: editarstd,
      newVaga: newVaga,
      carrega_itens: carrega_itens
  };
})();

std.init();