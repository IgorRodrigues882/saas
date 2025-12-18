"use strict";
  // Encontra o cookie que contém o csrftoken do Django
  const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
  // Extrai o valor do csrftoken do cookie
  const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;
  
var unidades = function(){
    let tabela_scroll;
    let btn_importa_csv;
    let currentPage = 1;
    let totalPages = 1;
    let editar_unidade = false;
    let id_unidade = 0;
    var init = function(){

        // Sistema de pesquisa
        (function ($) {
            var bestPictures = new Bloodhound({
              datumTokenizer: Bloodhound.tokenizers.obj.whitespace("value"),
              queryTokenizer: Bloodhound.tokenizers.whitespace,
              prefetch: "",
              remote: {
                url: `api/unidades/busca/?query=%QUERY`,
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
              name: "name",
              display: 'name',
              limit: 15,
              source: bestPictures
            })
          
            $(".faq-form .typeahead").on('input', function() {
              if ($(this).val() === '') {
                $(".loading-indicator-itens").hide();
              }
            })
          })(jQuery);
        }

        $('#filtrar').on('click', function(){
          currentPage = 1
          carrega_itens(currentPage)
        })


        function formatarData(dataString) {
          // Criar um objeto Date a partir da string de data ISO (que está em UTC por padrão)
          const data = new Date(dataString);
      
          // Opções de formatação no fuso horário do Brasil
          const opcoes = {
              timeZone: 'America/Sao_Paulo',  // Define o fuso horário
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
          };
      
          // Formatar a data diretamente no fuso horário do Brasil
          const dataFormatada = new Intl.DateTimeFormat('pt-BR', opcoes).format(data);
      
          return dataFormatada;
      }


        function formatarMoedaBrasil(valor) {
            return parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }


        function formatarCPFouCNPJ(valor) {
          // Verifica se valor é undefined ou null e retorna uma string vazia se for o caso
          if (valor === undefined || valor === null) {
            return '';
          }
        
          // Remove qualquer coisa que não seja número
          valor = valor.toString().replace(/\D/g, '');
        
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

        function gera_tabela(index){
          let rowsHTML = ''; // String para construir HTML
          // Verifica se index é um objeto único e não um array, e o converte para um array
          if (!Array.isArray(index)) {
            index = [index];
          }

          if(index.length>0){
            for(let i = 0; i < index.length; i++){
                // let badge = index[i].jobstatus == 'A' ? '<span class = "badge badge-success text-white">Ativa</span>' : '<span class = "badge badge-danger text-white">Cancelada</span>';
                rowsHTML += `
                <tr>
                <td>
                <div class="media">
                    <div class="square-box me-2"><img class="img-fluid b-r-5"
                        src="/static/assets/images/dashboard/folder1.png" alt=""></div>
                    <div class="media-body ps-2">
                    <div class="avatar-details"><a href="#">
                        <h6>${index[i].name}</h6>
                        </a><span>${index[i].id}</span></div>
                    </div>
                </div>
                </td>
                <td>
                <h6 class="descricao" title="${index[i].cnpj}">${index[i].cnpj}</h6>
                </td>
                <td>
                <h6 class="descricao" title="${index[i].cadastro_dt}">${formatarData(index[i].cadastro_dt)}</h6>
                </td>
                <td>
                  <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown"
                        aria-haspopup="true" aria-expanded="false">Opções</button>
                  <div class="dropdown-menu">
                      <a class="dropdown-item"
                        href="javascript:void(0)" onclick="unidades.deleteUnidade(${index[i].id})">Excluir</a>
                      <a class="dropdown-item"
                        href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#addunidades" onclick="unidades.editarUnidade(${index[i].id})">Editar</a>
                  </div>
                </td>
            </tr>
                `
            }

          }
          else{
            rowsHTML = '<tr><td colspan="4" style="text-align: center;">Nenhum dado encontrado</td></tr>'
          }

          return rowsHTML
        }
        
      function contarTrs(tbodyId) {
          var tbody = tbodyId;
          var trs = tbody.getElementsByTagName('tr');
          return trs.length;
      }

      function loadPage(page) {
        currentPage = page;
        carrega_itens(page);
      }


      function updatePagination(count) {
        totalPages = Math.ceil(count / 25);
        const pagination = document.getElementById('pagination');
        
        // Remove existing page items except previous and next buttons
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
      let loading_history = false; // Flag para evitar solicitações simultâneas

      function carrega_itens(page){
        let tbody = document.getElementById('tbody');
        let loader = document.getElementById('loader');
        let cont = document.getElementById('cont');
        tbody.innerHTML = ''
        loader.style.display = 'block'
        cont.innerHTML = ''
        var data = {
            "search-unidades": $("#search_unidades").val(),
        }
        fetch(`api/unidades/filtragem_unidades/?page=${page}`, {  // Substitua pela URL da sua API
          method: 'POST',
          headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken,
        },
          body: JSON.stringify(data)
        }).then(res=>res.json())
        .then(data=>{
          if(data){
            tbody.innerHTML = gera_tabela(data.results)
            loader.style.display = 'none'
            cont.innerHTML = `(${data.count})`
            updatePagination(data.count)
          }
        })
              .catch(error => {
                  console.error('Erro ao carregar mais logs:', error);
              }).finally(() => {
                  // Marcar que terminamos de carregar
                  loading_history = false;
                  loader.style.display = 'none';
              });
      }

    carrega_itens(1)

      $("#salvar_unidade").on("click", function(){
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
    
        let url = (editar_unidade) ? `api/unidades/${id_unidade}/` : "api/unidades/";
        let method = (editar_unidade) ? 'PATCH' : 'POST';
        // Coleta de valores
        let name = document.getElementById('name').value.trim();
        
        let cnpj = document.getElementById('cnpj').value.trim();
       

        // Validação dos campos obrigatórios
        if (!name) {
            showError("Preencha o campo Unidade!");
            return;
        }

        const data = new FormData();
        data.append('name', name);
        data.append('cnpj', cnpj);

        fetch(url, {
            method: method,
            headers: {
                'X-CSRFToken': csrftoken,
            },
            body: data
        })
        .then(response => response.json())
        .then(data => {
          // Verifica se foi um erroc
          console.log("data", data)
            if(data.id){
                showSuccess();
                carrega_itens(1);
            } else{
                showError("Ocorreu um erro");
            }
        })
        .catch(() => showError("Ocorreu um erro"));
    });
    
    function showError(message) {
        Swal.fire({
            text: message,
            icon: "error",
            buttonsStyling: false,
            confirmButtonText: "Ok",
            customClass: { confirmButton: "btn btn-primary" }
        });
    }
    
    function showSuccess() {
        Swal.fire({
            text: "Salvo com sucesso!",
            icon: "success",
            buttonsStyling: false,
            confirmButtonText: "Ok",
            customClass: { confirmButton: "btn btn-primary" }
        });
    }

    function deleteUnidade(id) {
      Swal.fire({
          title: 'Tem certeza?',
          text: "Tem certeza que deseja excluir essa Unidade?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sim, excluir!',
          cancelButtonText: 'Não, cancelar!'
      }).then((result) => { // Alterado para "result"
          if (result.isConfirmed) { // Verificação correta
              fetch(`api/unidades/${id}/`, {
                  method: "DELETE",
                  headers: {
                      'Content-Type': 'application/json',
                      'X-CSRFToken': csrftoken,
                  },
              }).then(response => {
                  if (response.status === 204) {
                      new Swal({
                          icon: 'success',
                          title: 'Unidade Excluida!',
                          buttons: false,
                          timer: 1500
                      }).then(() => {
                          carrega_itens(1);
                      });
                  } else {
                      new Swal({
                          title: "Erro",
                          text: "Houve um erro ao tentar excluir!",
                          icon: "error",
                          button: "OK",
                      });
                  }
              }).catch(error => {
                  console.error('Erro ao enviar a solicitação:', error);
              });
          }
      });
  }

    function editarUnidade(id){
      editar_unidade = true
      id_unidade = id

      Swal.fire({
        title: 'Aguarde',
        text: 'Carregando dados',
        icon: 'info',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
            Swal.showLoading()
        }
    });

      fetch(`api/unidades/${id}/`, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
    }).then(response => response.json())
    .then(data => {
      document.getElementById('name').value = data.name;
      document.getElementById('cnpj').value = data.cnpj;
      Swal.close();
    });
  }

    function newUnidade(){
      editar_unidade = false
      document.getElementById('name').value = '';
      document.getElementById('cnpj').value = '';
    }

    $("#export_btn").on('click', function(){
        Swal.fire({
            title: 'Aguarde',
            text: 'Preparando exportação...', // Mensagem mais genérica
            showConfirmButton: false,
            willOpen: () => Swal.showLoading()
        });

        // 1. Definir os parâmetros para o endpoint universal
        const exportFormat = $("#export_format").val()?.toLowerCase().trim() || 'csv';
        const modelName = 'ger_empresas.ger_unidade'; // CORREÇÃO: Usar formato app_label.ModelName

        // Define os campos TÉCNICOS que você quer exportar
        const fieldsToExport = [
            'id',
            'name',
            'cnpj',
            'cadastro_dt',
        ];

        // Define o mapeamento de nomes técnicos para nomes amigáveis (Labels)
        // Use os nomes exibidos no cabeçalho da tabela HTML
        const fieldLabels = {
            'id': 'ID', // Label para ID (não está na tabela, mas pode ser útil)
            'name': 'Nome',
            'cnpj': 'CNPJ',
            'cadastro_dt': 'Data cadastro',
        };

        // 2. Coletar filtros (opcional)
        const filters = {
          'name':$("#search_unidades").val()
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
            // Exibe a mensagem de erro específica, se disponível, caso contrário, uma mensagem genérica.
            const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
            Swal.fire("Erro", `Falha ao exportar: ${errorMessage}`, "error");
        })
        .finally(() => {
             // Garante que o loading seja fechado em caso de sucesso ou erro
             // Nota: Se o download iniciar corretamente, o Swal já foi fechado no .then()
             // Isso garante o fechamento se ocorrer um erro antes do download.
             if (Swal.isLoading()) {
                 Swal.close();
             }
        });
    });

  return {
      init: function(){
        init();
      },
      deleteUnidade:deleteUnidade,
      editarUnidade:editarUnidade,
      newUnidade:newUnidade,
      carrega_itens:carrega_itens
  };
  
}()
unidades.init();
