function formatarDataArquivo(dataISO) {
    const data = new Date(dataISO);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0'); // Janeiro é 0!
    const ano = data.getFullYear();

    return `${dia}/${mes}/${ano}`;
}

function gera_tabela_arquivos(index){
    let rowsHTML = ''; // String para construir HTML
    let badge, badgeClass;
  
    // Verifica se index é um objeto único e não um array, e o converte para um array
    if (!Array.isArray(index)) {
      index = [index];
    }
  
    for(let i = 0; i < index.length; i++){
        if(index[i].statusarquivo_id === 'O'){
            badge = '<span class="badge badge-success text-white">Processado</span>'
        }
        else if(index[i].statusarquivo_id === 'S'){
            badge = '<span class="badge badge-info text-white">Aguardando</span>'
        }
        else{
            badge = '<span class="badge badge-danger text-white">Erro</span>'
        }
      rowsHTML += `
      <tr>
              <td>
                <div class="media">
                  <div class="square-box me-2"><i class="fa fa-file-excel-o txt-success"></i></div>
                  <div class="media-body ps-2">
                    <div class="avatar-details"><a href="${index[i].Caminho}">
                        <h6>${index[i].NomeArquivo}</h6>
                      </a><span>${index[i].tipo_arquivo}</span></div>
                  </div>
                </div>
              </td>
              <td class="img-content-box">
                <h6>${formatarDataArquivo(index[i].DataHora)}</h6>
              </td>
              <td>
                <h6>${badge}</h6>
              </td>
              <td>
                <h6>${index[i].retorno_arquivo}</h6>
              </td>
              <td>
                <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown"
                          aria-haspopup="true" aria-expanded="false">Opções</button>
                        <div class="dropdown-menu">
                          <a class="dropdown-item"
                            href="#" onclick="deleteArquivoCampanha(${index[i].id})">Excluir</a>
                            <a class="dropdown-item"
                            href="javascript:void(0)" onclick="reprocessar_arquivo_campanha(${index[i].id})">Reprocessar Arquivo</a>
                        </div>
              </td>
            </tr>`;
    }
    
    return rowsHTML; // Definir HTML de uma vez
}

let table_arquivos = document.getElementById('item-table-arquivos');
let loader_arquivos = document.getElementById('loader_arquivos');
let btn_importa_csv = document.getElementById("new_template_csv") 

function busca_dados_arquivos(){
    let tbody = table_arquivos.querySelector('tbody')
    tbody.innerHTML=''
    loader_arquivos.style.display = 'block'
    fetch(`/pt/api/importa_csv/?id=${$("#id_campanha").data('id')}`)
    .then(response => response.json())
    .then(data => {
        if(data.length>0){
            tbody.innerHTML = gera_tabela_arquivos(data)
            loader_arquivos.style.display = 'none';
        }
        else if(data.length==0){
            loader_arquivos.style.display = 'none';
        }
        else{
          new swal({
            text: "Ocorreu um erro ao tentar buscar os arquivos!" ,
            icon: "error",
            buttonsStyling: false,
            confirmButtonText: "Ok",
            customClass: {
                confirmButton: "btn btn-primary"
            }
        });
        loader_arquivos.style.display = 'none';
        }
      })
}

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
    new swal({
      title: 'Aguarde...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      showConfirmButton: false,
      onOpen: () => {
        swal.showLoading();
      }
    });
    var caminhoCompleto = window.location.pathname;

    // Divide o caminho usando '/' como separador e pega a primeira parte
    var partesDoCaminho = caminhoCompleto.split('/');
    var language = partesDoCaminho[1];
    console.log(language)
    const data = new FormData();
    data.append("campanha", $("#id_campanha").data('id'));
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
      new swal({
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
    console.log(data)
    fetch(`/${language}/api/importa_csv/importa_csv/`, {
      method: "POST",
      headers: {
        'X-CSRFToken': csrftoken,
      },
      body: data,
    })
      .then((response) => {
        swal.close();
        if (response.status === 201) {
          new swal({
            icon: 'success',
            title: 'Arquivo Importado Com sucesso!',
            showConfirmButton: false,
            timer: 1500
          })
          busca_dados_arquivos();
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
       console.log(response)
      })
    });



// deleta aqruivos campanha
function deleteArquivoCampanha(index){
    new swal({
        title: 'Aguarde...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        showConfirmButton: false,
        onOpen: () => {
          swal.showLoading();
        }
      });
    
    fetch(`/pt/api/importa_csv/${index}`,{
        method: 'DELETE',
        headers: {
            'X-CSRFToken': csrftoken,
          },
    })
    .then(response => {
    if (response.status === 204) {
        new swal({
          icon: 'success',
          title: 'Arquivo Excluido Com sucesso!',
          showConfirmButton: false,
          timer: 1500
        })
        busca_dados_arquivos();
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
}


function reprocessar_arquivo_campanha(index){
    new swal({
        title: "Tem certeza?",
        text: "Tem certeza que deseja reprocessar esse arquivo?",
        icon: "warning",
        buttons: true,
        dangerMode: true
      }).then((willDelete) => {
        if (willDelete) {
          const data = new FormData();
          data.append("statusarquivo_id", 'S');
          fetch(`/pt/api/importa_csv/${index}/`, {
            method: "PATCH",
            headers: {
              'X-CSRFToken': csrftoken,
            },
            body:data
          }).then(response => {
            console.log(response)
            if (response.status === 200) {
              new swal({
                icon: 'success',
                title: 'Status alterado!',
                buttons: false,
                timer: 1500
              })
              busca_dados_arquivos()
            }
            else {
              new swal({
                title: "Erro",
                text: "Houve um erro ao tentar alterar!",
                icon: "error",
                button: "OK",
              });
            }
          }).catch(error => {
            console.error('Erro ao enviar a solicitação:', error);
          });
    
        }
      })
}

function formatarMoedaBrasil(valor) {
  return parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

$(document).ready(function () {
  busca_dados_arquivos();
  busca_total_campanha()
});


function busca_total_campanha(){
  fetch('/pt/api/msg_message/retorna_total_campanha/',{
    method:'POST',
    headers: {
      'X-CSRFToken': csrftoken,
      "Content-Type": "application/json",
    },
    body:JSON.stringify({
      id:$("#id_campanha").data('id')
    })
  })
  .then(res=>res.json())
  .then(data=>{
    $("#total_campanha_valor").text(formatarMoedaBrasil(data.total))
  })
}

// Sistema Pesquisa
(function ($) {
    var bestPictures = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace("value"),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      prefetch: "",
      remote: {
        url: `/pt/api/importa_csv/?query=%QUERY&id=${$("#id_campanha").data('id')}`,
        wildcard: "%QUERY",
        filter: function (response) {
          console.log(response)
          return response; // Assumindo que a API retorna a lista diretamente
        }
      }
    });
  
    $("#remote-arquivos .typeahead").on('typeahead:asyncrequest', function () {
      // Mostrar indicador de carregamento
      $(".loading-indicator-arquivos").show();
    });
  
    $("#remote-arquivos .typeahead").on('typeahead:asyncreceive', function () {
      // Esconder indicador de carregamento
      $(".loading-indicator-arquivos").hide();
    });
  
    $("#remote-arquivos .typeahead").typeahead(null, {
      name: "NomeArquivo",
      limit: 10,
      display: 'NomeArquivo',
      source: bestPictures
    }).on('typeahead:selected', function (e, datum) {
      loader_arquivos.style.display='block';
      const tbody = table_arquivos.querySelector('tbody');
      tbody.innerHTML=''
      
      // Aqui você pode acessar o ID do item selecionado como datum.id
      var selectedId = datum.id;
      console.log(datum)
      fetch(`/pt/api/importa_csv/${selectedId}/`)
        .then(response => response.json())
        .then(data => {
          var rows = '<div>Não há resultados</div>'
          if(data.id){
            rows = gera_tabela_arquivos(data)
          }
          tbody.innerHTML = rows
          loader_arquivos.style.display = 'none';
          
        })
        .catch(error => {
          console.error('Erro ao buscar dados:', error);
        });
    })
  
    $("#remote-arquivos .typeahead").on('input', function() {
      if ($(this).val() === '') {
        $(".loading-indicator-arquivos").hide();
        loader_arquivos.style.display='block';
        var tbody = table_arquivos.querySelector('tbody');
        tbody.innerHTML=''
        
        // O campo de pesquisa foi apagado
      // Faça uma requisição para buscar as opções que estavam antes aqui
      fetch(`/pt/api/importa_csv/?id=${$("#id_campanha").data('id')}`)
      .then(response => response.json())
      .then(data => {
          var rows = '<div class="text-center">Não há resultados</div>'
          if(data){
            rows = gera_tabela_arquivos(data)
          }
          tbody.innerHTML = rows
          loader_arquivos.style.display='none';
      })
      .catch(error => {
        swal({
          text: "Ocorreu um erro ao tentar buscar dados!" ,
          icon: "error",
          buttonsStyling: false,
          confirmButtonText: "Ok",
          customClass: {
              confirmButton: "btn btn-primary"
          }
      });
      });
      }
    });
  
  })(jQuery);


// Gráfico indice de vendas
function CriaGrafico(){
    var optionsturnoverchart = {
      
      chart: {
        height: 320,
        type: "area",
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "straight",
      },
      fill: {
        colors: [zetaAdminConfig.primary],
        type: "gradient",
        gradient: {
          shade: "light",
          type: "vertical",
          shadeIntensity: 0.4,
          inverseColors: false,
          opacityFrom: 0.9,
          opacityTo: 0.8,
          stops: [0, 100],
        },
      },

      series: [
        {
          name: "Total em R$",
          data: series.monthDataSeries1.prices,
        },
        {
          name: "QTD",
          data: series.monthDataSeries1.qtd,
        },
      ],
      title: {
        text: "Vendas por dia",
        align: "left",
      },
      colors: [zetaAdminConfig.primary, zetaAdminConfig.secondary],
      labels: series.monthDataSeries1.dates,
      xaxis: {
        type: "datetime",
        labels: {
          format: 'dd/MM', // ou 'dd/MM/yyyy' para incluir o ano
        },
        title: {
          text: 'Data'
        }
      },
      yaxis: {
        opposite: false,
      },
      legend: {
        horizontalAlign: "left",
      },
    };

    var chartturnoverchart = new ApexCharts(
      document.querySelector("#chart-widget7"),
      optionsturnoverchart
    );
    chartturnoverchart.render()
}



function updateSeriesWithAPIData() {
  let id = $('#copiar').data('id')
  fetch(`/pt/api/indice_vendas_dia/?id=${id}`) // Substitua com a URL da sua API
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      console.log(data)
      // Aqui você processa os dados recebidos e atualiza a variável series
      // Exemplo: supondo que data seja um array de objetos com 'price' e 'date'
      series.monthDataSeries1.prices = data.map(item => item.total_vendas);
      series.monthDataSeries1.dates = data.map(item => item.data_tx);
      series.monthDataSeries1.qtd = data.map(item => item.total_boomerangues);

      console.log(series.monthDataSeries1)
      // Adicione também o mapeamento para 'qtd' se estiver disponível nos dados

      // Agora você pode usar a variável series para criar ou atualizar seu gráfico
    })
    .then(()=>{
      CriaGrafico()
    })
    .catch(error => {
      console.error('There was a problem with your fetch operation:', error);
    });
}

// Chamada da função para carregar os dados
updateSeriesWithAPIData();


// ##############################################################################

"use strict";
  // Encontra o cookie que contém o csrftoken do Django

var tabela_compras = function(){

    let btn_importa_csv;

    var init = function(){


        function ajusta_compras(){
          let tbody = document.getElementById('ultimas_venda_tb')
          tbody.innerHTML = ''
          fetch('/pt/api/pix_transaction/ultimas_compras/',{
            method:'POST',
            headers: {
              'X-CSRFToken': csrftoken,
              "Content-Type": "application/json",
            },
            body:JSON.stringify({id: $("#id_campanha").data('id')})
          })
          .then((res)=>res.json())
          .then(data=>{
            console.log(data)
            if(data.length > 0){
                tbody.innerHTML = gera_tabela_compras(data)
            }
            else{
              tbody.innerHTML = '<tr><td colspan="1">Não há dados</td></tr>';
            }
          })
          .catch(error=>{
            swal.fire({
              text: "Ocorreu um erro ao tentar buscar dados!"+ error ,
              icon: "error",
              buttonsStyling: false,
              confirmButtonText: "Ok",
              customClass: {
                  confirmButton: "btn btn-primary"
              }
          });
          })
        }  

        ajusta_compras()


        // $('#filtrar').on('click', function(){
        //   let tbody = document.getElementById('tbody');
        //   let loader = document.getElementById('loader');
        //   let cont = document.getElementById('cont');
        //   let soma = document.getElementById('soma')
        //   tbody.innerHTML = ''
        //   soma.innerHTML=''
        //   loader.style.display = 'block'
        //   cont.innerHTML = ''
        //   let valores = $("#u-range-03").val()
        //   let val = valores.split(";");
        //   var data = {
        //     'periodo_inicial': $("#dt_inicio").val(),
        //     'periodo_final': $('#dt_fim').val(),
        //     'lead': $("#lead").val(),
        //     'campanha':$("#campanha").val(),
        //     'valores': val
        //   }
        //   fetch('api/bmm_boomerangue/filtragem/', {  // Substitua pela URL da sua API
        //     method: 'POST',
        //     headers: {
        //   'Content-Type': 'application/json',
        //   'X-CSRFToken': csrftoken,
        //   },
        //     body: JSON.stringify(data)
        //   }).then(res=>res.json())
        //   .then(data=>{
        //     if(data){
        //       tbody.innerHTML = gera_tabela(data, soma)
        //       loader.style.display = 'none'
        //       cont.innerHTML = `(${contarTrs(tbody)})`

        //     }
        //     else{
        //       tbody.innerHTML='<tr><td>Não há dados</td></tr>'
        //       loader.style.display = 'none'
        //       cont.innerHTML = '(0)'
        //       soma.innerHTML = 'R$ 0,00'
        //     }
        //   })
        //   .catch(error=>{
        //     swal({
        //       text: "Ocorreu um erro ao tentar buscar dados!" ,
        //       icon: "error",
        //       buttonsStyling: false,
        //       confirmButtonText: "Ok",
        //       customClass: {
        //           confirmButton: "btn btn-primary"
        //       }
        //   });
        //   })
          
        // })


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


        function tempoAtras(data) {
          // Converte a data fornecida para o formato Date no fuso horário do Brasil
          const dataLocal = new Date(data);
      
          // Obtém a data e hora atual no fuso horário do Brasil
          const agora = new Date();
      
          // Diferença em milissegundos entre agora e a data passada
          const diferenca = agora - dataLocal;
      
          // Calcula os minutos, horas, dias e meses usando a diferença
          const minutosAtras = Math.floor(diferenca / (1000 * 60));
          const horasAtras = Math.floor(diferenca / (1000 * 60 * 60));
          const diasAtras = Math.floor(diferenca / (1000 * 60 * 60 * 24));
          const mesesAtras = Math.floor(diferenca / (1000 * 60 * 60 * 24 * 30));
      
          // Retorna a mensagem adequada com base no tempo decorrido
          if (minutosAtras < 60) {
              return `${minutosAtras} minutos atrás`;
          } else if (horasAtras < 24) {
              return `${horasAtras} horas atrás`;
          } else if (diasAtras < 30) {
              return `${diasAtras} dias atrás`;
          } else {
              return `${mesesAtras} meses atrás`;
          }
      }
      
      
      


        function gera_tabela_compras(index){
          let rowsHTML = ''; // String para construir HTM
          let somaTotal = 0
          // Verifica se index é um objeto único e não um array, e o converte para um array
          if (!Array.isArray(index)) {
            index = [index];
          }

          for(let i = 0; i < index.length; i++){
            rowsHTML += `
            <tr>
              <td>
                <div class="media"><img class="img-fluid me-3 b-r-5"
                    src="{% static 'assets/images/dashboard/rectangle-26.jpg' %}" alt="">
                  <div class="media-body"><a href="/boomerangue_consulta/${index[i].boomerangue}">
                      <h5>${index[i].entidadeNome}</h5>
                    </a>
                    <p>Campanha: ${index[i].campanhaNome}</p>
                    <p>Total: ${formatarMoedaBrasil(index[i].valor)}</p>
                  </div>
                </div>
              </td>
              <td><span class="badge badge-light-theme-light font-theme-light">${tempoAtras(index[i].data_tx)}</span></td>
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


    }
    return {
        init: function() {
            // btn_importa_csv = document.getElementById('new_csv')
            init();
        }
    };
}()

tabela_compras.init()








// ###################################################################################################################################
"use strict";
  // Encontra o cookie que contém o csrftoken do Django

var tabela_vendedores = function(){

    let btn_importa_csv;

    var init = function(){


        function ajusta_vendedores(){
          let tbody = document.getElementById('tb_vendedores')
          tbody.innerHTML = ''
          fetch('/pt/api/bmm_boomerangueitens/top_compradores/',{
            method:'POST',
            headers: {
              'X-CSRFToken': csrftoken,
              "Content-Type": "application/json",
            },
            body:JSON.stringify({campanha: $("#id_campanha").data('id')})
          })
          .then((res)=>res.json())
          .then(data=>{
            console.log(data)
            if(data.length > 0){
                tbody.innerHTML = gera_tabela(data)
            }
            else{
              tbody.innerHTML = '<tr><td colspan="1">Não há dados</td></tr>';
            }
          })
          .catch(error=>{
            swal.fire({
              text: "Ocorreu um erro ao tentar buscar dados!"+ error ,
              icon: "error",
              buttonsStyling: false,
              confirmButtonText: "Ok",
              customClass: {
                  confirmButton: "btn btn-primary"
              }
          });
          })
        }  

        ajusta_vendedores()



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



        function formatarMoedaBrasil(valor) {
            return parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }

        function gera_tabela(index){
          let rowsHTML = ''; // String para construir HTM
          let somaTotal = 0
          // Verifica se index é um objeto único e não um array, e o converte para um array
          if (!Array.isArray(index)) {
            index = [index];
          }

          for(let i = 0; i < index.length; i++){
            rowsHTML += `
            <tr>
              <td>
                <div class="media">
                  <div class="icon-wrappar"><i class="fa fa-trophy font-primary"> </i></div>
                  <div class="media-body"><a href="/entidade_consulta/${index[i].boomerangue__entidade__id}" style='cursor: default;'>
                      <h5>${index[i].boomerangue__entidade__Entidade}</h5>
                    </a>
                    <p>Total: ${formatarMoedaBrasil(index[i].total_comprado)}</p>
                  </div>
                </div>
              </td>
              <td><span class="badge badge-light-theme-light font-theme-light">#${i+1}</span></td>
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


    }
    return {
        init: function() {
            // btn_importa_csv = document.getElementById('new_csv')
            init();
        }
    };
}()

tabela_vendedores.init()
