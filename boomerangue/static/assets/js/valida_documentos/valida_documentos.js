
"use strict";
  // Encontra o cookie que contém o csrftoken do Django
  const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
  // Extrai o valor do csrftoken do cookie
  const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;


var valida_documentos = function(){
    let tabela_scroll;
    let btn_importa_csv;
    let currentPage = 1;
    let totalPages = 1;
    var init = function(){
                // Configuração do Dropzone para planilha Excel
        Dropzone.options.excelUpload = {
            paramName: "excelFile",
            maxFiles: 1,
            maxFilesize: 5,
            acceptedFiles: ".xlsx,.xls",
            autoProcessQueue: false,
            init: function() {
                this.on("success", function(file, response) {
                    console.log('Excel upload response:', response);
                });
            },
            addRemoveLinks: true
        };

        // Configuração do Dropzone para documentos
        Dropzone.options.documentUpload = {
            paramName: "documentFile",
            maxFiles: 10, // Permite até 10 arquivos
            maxFilesize: 10,
            acceptedFiles: ".pdf,.jpg,.jpeg,.png",
            autoProcessQueue: false,
            init: function() {
                this.on("success", function(file, response) {
                    console.log('Document upload response:', response);
                });
            },
            addRemoveLinks: true
        };

        // Função para enviar arquivos e validar
        async function validateDocuments() {
            const excelDropzone = Dropzone.forElement("#excelUpload");
            const documentDropzone = Dropzone.forElement("#documentUpload");
            
            const excelFiles = excelDropzone.getQueuedFiles();
            const documentFiles = documentDropzone.getQueuedFiles();

            // Verificar se os arquivos foram selecionados
            if (excelFiles.length === 0) {
                Swal.fire({
                    text: "Por favor, selecione a planilha Excel!",
                    icon: "error",
                    buttonsStyling: false,
                    confirmButtonText: "Ok",
                    customClass: {
                        confirmButton: "btn btn-primary"
                    }
                });
                return;
            }

            if (documentFiles.length === 0) {
                Swal.fire({
                    text: "Por favor, selecione pelo menos um documento para validação!",
                    icon: "error",
                    buttonsStyling: false,
                    confirmButtonText: "Ok",
                    customClass: {
                        confirmButton: "btn btn-primary"
                    }
                });
                return;
            }

            // Mostrar loading
            // Swal.fire({
            //     title: 'Aguarde...',
            //     text: 'Enviando arquivos e realizando validação...',
            //     allowOutsideClick: false,
            //     allowEscapeKey: false,
            //     allowEnterKey: false,
            //     showConfirmButton: false,
            //     didOpen: () => {
            //         Swal.showLoading();
            //     }
            // });

            try {
              // Preparar FormData
              const data = new FormData();
              
              // Adicionar planilha Excel
              data.append('excel_file', excelFiles[0]);
              
              // Adicionar documentos (usando a nomenclatura document_file_0, document_file_1, etc.)
              documentFiles.forEach((doc, index) => {
                  data.append(`document_file_${index}`, doc);
              });
              let div = document.getElementById("analise_div")
                  div.style.display='block'
              // Fazer requisição para a API
              fetch('api/validacao_documentos/validate_documents/', {
                  method: 'POST',
                  headers: {
                      'X-CSRFToken': csrftoken,
                  },
                  body: data
              })
              .then(res=>res.json())
              .then(data => {
                console.log(data)
                if(data.success){
                  var notify = $.notify('<i class="fa fa-bell-o"></i><strong>Loading</strong> page Do not close this page...', {
                      type: 'theme',
                      allow_dismiss: true,
                      delay: 2000,
                      showProgressbar: true,
                      timer: 300,
                      animate:{
                          enter:'animated fadeInDown',
                          exit:'animated fadeOutUp'
                      }
                  });

                  setTimeout(function() {
                      notify.update('message', '<i class="fa fa-bell-o"></i><strong>Loading</strong> Inner Data.');
                  }, 1000);

                }
                else{
                  console.log("Erro ao iniciar a validação dos documentos", data.error)
                }
              })
          } catch (error) {
              Swal.fire({
                  icon: 'error',
                  title: 'Erro',
                  text: error.message,
                  confirmButtonText: 'Ok',
                  customClass: {
                      confirmButton: "btn btn-primary"
                  }
              });
          }
        
        }

        // Sistema de pesquisa
        (function ($) {
            var bestPictures = new Bloodhound({
              datumTokenizer: Bloodhound.tokenizers.obj.whitespace("value"),
              queryTokenizer: Bloodhound.tokenizers.whitespace,
              prefetch: "",
              remote: {
                url: `api/create-entidade/busca/?query=%QUERY`,
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
              name: "Entidade",
              display: 'Entidade',
              limit: 15,
              source: bestPictures
            })
          
            $(".faq-form .typeahead").on('input', function() {
              if ($(this).val() === '') {
                $(".loading-indicator-itens").hide();
              }
            })
          })(jQuery);

          $('#filtrar').on('click', function(){
            currentPage = 1
            carrega_itens(currentPage)
          })

          function formatarData(dataString) {
            // Criar um objeto Date a partir da string de data ISO
            var data = new Date(dataString);
        
            // Obter os componentes da data
            var dia = data.getDate().toString().padStart(2, '0');
            var mes = (data.getMonth() + 1).toString().padStart(2, '0'); // getMonth() retorna um valor de 0 a 11
            var ano = data.getFullYear();
        
        
            // Montar a string formatada
            return `${dia}/${mes}/${ano}`;
          }
  
  
          function dataformat2(dataString) {
            // Converter para um objeto Date
            const data = new Date(dataString);
        
            // Opções de formatação no fuso horário do Brasil
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
        
            // Formatar a data no fuso horário do Brasil
            const dataFormatada = new Intl.DateTimeFormat('pt-BR', opcoes).format(data);
        
            return dataFormatada;
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
  
            console.log(index)
            // Verifica se index é um objeto único e não um array, e o converte para um array
            if (!Array.isArray(index)) {
              index = [index];
            }
  
  
            console.log("length", index.length)
  
            for(let i = 0; i < index.length; i++){
              let tipo = index[i].status
              let badge = ''
              let exp;
              if(index[i].documento_valido == 'S'){
                  badge = 'badge badge-success'
              }
              else{
                  badge = 'badge badge-warning'
                  exp = 1
              }
              rowsHTML += `
              <tr>
              <td>
                <div class="media">
                  <div class="square-box me-2"><img class="img-fluid b-r-5"
                      src="/static/assets/images/dashboard/folder1.png" alt=""></div>
                  <div class="media-body ps-2">
                    <div class="avatar-details"><a href="#">
                        <h6>${index[i].nome}</h6>
                      </a><span>${formatarCPFouCNPJ(index[i].cpf)}</span></div>
                  </div>
                </div>
              </td>
              <td class="img-content-box">
                <h6>${index[i].sexo}</h6>
              </td>
              <td>
                <h6>${index[i].data_nascimento }</h6>
              </td>
              <td>
                <h6>${index[i].brasileiro_naturalizado}</h6>
              </td>
              <td>
                <a href="#" class="btn btn-primary">Ver</a>
              </td>
            </tr>
              `
  
            }
  
            return rowsHTML
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
            let soma = document.getElementById('soma')
            tbody.innerHTML = ''
            soma.innerHTML=''
            loader.style.display = 'block'
            cont.innerHTML = ''
            let valores = $("#u-range-03").val()
            let val = valores.split(";");
            var data = {
              'periodo_inicial': $("#dt_inicio").val(),
              'periodo_final': $('#dt_fim').val(),
              'lead': $("#lead").val(),
              'campanha':$("#campanha").val(),
              'valores': val,
              'pix_gerados':true,
              'status': $("#status").val()
            }
            fetch(`api/pix_transaction/filtragem_historico/?page=${page}`, {  // Substitua pela URL da sua API
              method: 'POST',
              headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
            },
              body: JSON.stringify(data)
            }).then(res=>res.json())
            .then(data=>{
              console.log("DADOSSOOSOSOSO", data)
              if(data){
                tbody.innerHTML = gera_tabela(data.results)
                loader.style.display = 'none'
                cont.innerHTML = `(${data.count})`
                soma.innerHTML = formatarMoedaBrasil(data.results[0].total_somado.total)
                updatePagination(data.count)
              }
              else{
                tbody.innerHTML='<tr><td>Não há dados</td></tr>'
                loader.style.display = 'none'
                cont.innerHTML = '(0)'
                soma.innerHTML = 'R$ 0,00'
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
    
        // carrega_itens(1)

        $("#btn_validar_documentos").on('click', function(){
            validateDocuments()
        })
    
    }
    return {
        init: function() {
            btn_importa_csv = document.getElementById('new_csv')
            tabela_scroll = document.getElementById('div_scroll')
            init();
        }
    };
}()
valida_documentos.init()