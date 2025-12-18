"use strict";
  // Encontra o cookie que contém o csrftoken do Django
  const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
  // Extrai o valor do csrftoken do cookie
  const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;
  
var historico = function(){
    let tabela_scroll;
    let btn_importa_csv;
    let currentPage = 1;
    let totalPages = 1;
    var init = function(){


      
      Dropzone.options.csvImportarquivo = {
        paramName: "csvImportarquivo",
        maxFiles: 10,
        maxFilesize: 5,
        acceptedFiles: ".csv", // Aceitar apenas arquivos de imagem
        autoProcessQueue: false, // Desativar o envio automático
        init: function() {
            this.on("success", function(file, response) {
            // Lógica a ser executada após o upload bem-sucedido, se necessário
            console.log('response', response);
            });
          
        },
        addRemoveLinks: true
        };

        // salva arquivo
        btn_importa_csv.addEventListener("click", function (e) {
          Swal.fire({
            title: 'Aguarde...',
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            showConfirmButton: false,
            onOpen: () => {
              swal.showLoading();
            }
          });

          const data = new FormData();
          const dropzone = Dropzone.forElement("#csvImportarquivo");
          const queuedFiles = dropzone.getQueuedFiles();

          if (queuedFiles.length > 0) {
              queuedFiles.forEach((arquivo, index) => {
                  data.append(`Caminho_${index}`, arquivo);
                  data.append(`NomeArquivo_${index}`, arquivo.name);
              });
          data.append("statusarquivo_id", 'S');
          }
          else {
            Swal.fire({
              text: "Nenhum Arquivo Importado!",
              icon: "error",
              buttonsStyling: false,
              confirmButtonText: "Ok",
              customClass: {
                confirmButton: "btn btn-primary"
              }
            });
            return;
          }

          fetch(`api/historico_vendas_import/`, {
            method: "POST",
            headers: {
              'X-CSRFToken': csrftoken,
            },
            body: data,
          })
            .then((response) => {
              swal.close();
              console.log(response.json())
              if (response.ok) {
                new swal({
                  icon: 'success',
                  title: 'Arquivo Importado Com sucesso!',
                  showConfirmButton: false,
                  timer: 1500
                })
              } else {
                new swal({
                  text: "Ocorreu um erro ao tentar salvar",
                  icon: "error",
                  buttonsStyling: false,
                  confirmButtonText: "Ok",
                  customClass: {
                    confirmButton: "btn btn-primary"
                  }
                });
              }
              
            })
          });

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

        // Faixa de valor
        $("#u-range-03").ionRangeSlider({
          type: "double",
          grid: true,
          min: 0,
          max: 10000,
          from: 0, 
          to: 10000,
          prefix: "$"
        })

        function ajusta_select_campanhas(){
          let select = document.getElementById('campanha')
          fetch('api/campanhas/')
          .then((res)=>res.json())
          .then(data=>{
            console.log(data)
            if(data.length > 0){
              for(let i = 0; i<data.length; i++){
                select.innerHTML += `<option value="${data[i].id}">${data[i].Campanha}</option>`
              }
            }
          })
        }  

        ajusta_select_campanhas()


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

          console.log(index)
          // Verifica se index é um objeto único e não um array, e o converte para um array
          if (!Array.isArray(index)) {
            index = [index];
          }


          console.log("length", index.length)

          for(let i = 0; i < index.length; i++){
            let tipo = index[i].boomerangue_status == 'X' ? 'Doação' : "Compra"
            let badge = index[i].boomerangue_status == 'X' ? 'badge badge-success' : "badge badge-info"
            rowsHTML += `
            <tr>
            <td>
              <div class="media">
                <div class="square-box me-2"><img class="img-fluid b-r-5"
                    src="/static/assets/images/dashboard/folder1.png" alt=""></div>
                <div class="media-body ps-2">
                  <div class="avatar-details"><a href="/entidade_consulta/${index[i].entidade}">
                      <h6>${index[i].entidade_nome}</h6>
                    </a><span>${formatarCPFouCNPJ(index[i].entidade_cnpj)}</span></div>
                </div>
              </div>
            </td>
            <td class="img-content-box">
              <h6>${formatarMoedaBrasil(index[i].valor)}</h6>
            </td>
            <td>
              <h6>${index[i].campanhaNome}</h6>
            </td>
            <td>
              <h6>${formatarData(index[i].data_tx)}</h6>
            </td>
            <td>
              <h6><span class="${badge} text-white">${tipo}</span></h6>
            </td>
            <td>
              <a href="/boomerangue_consulta/${index[i].boomerangue}" class="btn btn-primary">Ver</a>
            </td>
          </tr>
            `

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
          'valores': val
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

    carrega_itens(1)


    // export excel

    $("#export_btn").on('click', function(){
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
      let valores = $("#u-range-03").val()
      let val = valores.split(";");
      var data = {
          'periodo_inicial': $("#dt_inicio").val(),
          'periodo_final': $('#dt_fim').val(),
          'lead': $("#lead").val(),
          'campanha': $("#id_campanha").data('id'),
          'valores': val,
      }
      fetch(`api/pix_transaction/gerar_excel_historico/`, {  // Substitua pela URL da sua API
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
          a.download = 'historico_doações_dados.xlsx';
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


    }
    return {
        init: function() {
            btn_importa_csv = document.getElementById('new_csv')
            tabela_scroll = document.getElementById('div_scroll')
            init();
        }
    };
}()

historico.init()