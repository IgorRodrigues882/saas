// Tabela logs
function formatarData(dataString) {
    // Criar um objeto Date a partir da string de data ISO
    var data = new Date(dataString);

    // Obter os componentes da data
    var dia = data.getDate().toString().padStart(2, '0');
    var mes = (data.getMonth() + 1).toString().padStart(2, '0'); // getMonth() retorna um valor de 0 a 11
    var ano = data.getFullYear();

    var horas = data.getHours().toString().padStart(2, '0');
    var minutos = data.getMinutes().toString().padStart(2, '0');
    var segundos = data.getSeconds().toString().padStart(2, '0');

    // Montar a string formatada
    return `${dia}/${mes}/${ano} ${horas}:${minutos}:${segundos}`;
}

function gera_tabela_logs(index){
    let rowsHTML = ''; // String para construir HTML
    console.log(index)
    // Verifica se index é um objeto único e não um array, e o converte para um array
    if (!Array.isArray(index)) {
      index = [index];
    }
  
    for(let i = 0; i < index.length; i++){
  
      rowsHTML += `
      <tr>
      <td>
        <div class="media">
          <div class="square-box me-2"><i class="fa fa-file-text-o txt-info"></i></div>
          <div class="media-body ps-2">
            <div class="avatar-details"><a href="#">
                <h6>${index[i].titulo_boomerangue}</h6>
              </a><span>#${index[i].id}</span></div>
          </div>
        </div>
      </td>
      <td>
        <h6>${index[i].tipolog_id}</h6>
      </td>
      <td>
        <h6>${index[i].origemlog_id}</h6>
      </td>
      <td>
        <h6>${index[i].Descricao}</h6>
      </td>
      <td>
        <h6>${index[i].boomerangueimportacao_id}</h6>
      </td>
      <td style="min-width: 150px;">
        <h6>${index[i].entidade}</h6>
        <span>#${index[i].entidade_id}</span>
      </td>
      <td>
        <h6>${index[i].acao_id}</h6>
      </td>
      <td>
        <h6>${index[i].acaoenviada_id}</h6>
      </td>
      <td>
        <h6>${index[i].Token}</h6>
      </td>
      <td>
        <h6>${index[i].Template}</h6>
      </td>
      <td style="min-width: 100px;">
        <h6>${formatarData(index[i].DataLog)}</h6>
      </td>
      <td>
        <h6>${index[i].TempoLog}</h6>
      </td>
      <td>
        <h6>${index[i].VerApiLog}</h6>
      </td>
      <td>
        <h6>${index[i].Complemento1}</h6>
      </td>
    </tr>`;
    }
    

    return rowsHTML; // Definir HTML de uma vez
  }
  
  var loader_logs = document.getElementById('loader_logs');
  const table_logs = document.getElementById('item-table-logs');
  var recarrega_logs = true;
  var page_logs = 2;
  (function ($) {
    var bestPictures = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace("value"),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      prefetch: "",
      remote: {
        url: `/pt/api/logs_api/?query=%QUERY&id=${$("#id_campanha").data('id')}`,
        wildcard: "%QUERY",
        filter: function (response) {
          console.log(response)
          return response; // Assumindo que a API retorna a lista diretamente
        }
      }
    });
  
    $("#remote-logs .typeahead").on('typeahead:asyncrequest', function () {
      // Mostrar indicador de carregamento
      $(".loading-indicator-logs").show();
    });
  
    $("#remote-logs .typeahead").on('typeahead:asyncreceive', function () {
      // Esconder indicador de carregamento
      $(".loading-indicator-logs").hide();
    });
  
    $("#remote-logs .typeahead").typeahead(null, {
      name: "entidade",
      limit: 10,
      display: 'Entidade',
      source: bestPictures
    }).on('typeahead:selected', function (e, datum) {
      loader_logs.style.display='block';
      const tbody = table_logs.querySelector('tbody');
      tbody.innerHTML=''
      
      // Aqui você pode acessar o ID do item selecionado como datum.id
      var selectedId = datum.id;
      console.log(datum)
      fetch(`/pt/api/logs_api/${selectedId}/`)
        .then(response => response.json())
        .then(data => {
          var rows = '<div>Não há resultados</div>'
          if(data.id){
            rows = gera_tabela_logs(data)
          }
          tbody.innerHTML = rows
          loader_logs.style.display = 'none';
          recarrega_logs = false;
          
        })
        .catch(error => {
          console.error('Erro ao buscar dados:', error);
        });
    })
  
    $("#remote-logs .typeahead").on('input', function() {
      if ($(this).val() === '') {
        $(".loading-indicator-logs").hide();
        loader_logs.style.display='block';
        var tbody = table_logs.querySelector('tbody');
        tbody.innerHTML=''
        
        // O campo de pesquisa foi apagado
      // Faça uma requisição para buscar as opções que estavam antes aqui
      fetch(`/pt/api/logs_api/?id=${$("#id_campanha").data('id')}`)
      .then(response => response.json())
      .then(data => {
          var rows = '<div class="text-center">Não há resultados</div>'
          if(data){
            rows = gera_tabela_logs(data)
          }
          tbody.innerHTML = rows
          loader_logs.style.display='none';
          recarrega_logs = true
          page_logs = 2;
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
  
  let loading_logs = false; // Flag para evitar solicitações simultâneas
      function loadMoreItems_logs() {
          if (loading_logs){
              loader_logs.style.display = 'block';
              return; // Evitar solicitações simultâneas
          }
  
          loader_logs.style.display = 'none'
          // Marcar que estamos carregando logs
          loading_logs = true;
          let tbody = table_logs.querySelector('tbody');
          fetch(`/pt/load_more_logs_campanhas/?page=${page_logs}&id=${$("#id_campanha").data('id')}`)
              .then(response => response.json())
              .then(data => {

                  console.log(data)
                  if (data.itens.length>0) {
                    var rows = ''
                    rows = gera_tabela_logs(data.itens)
                    console.log(rows)
                    tbody.innerHTML += rows
                    page_logs++;
                  }
              })
              .catch(error => {
                  console.error('Erro ao carregar mais logs:', error);
              }).finally(() => {
                  // Marcar que terminamos de carregar
                  loading_logs = false;
                  loader_logs.style.display = 'none';
              });
      }
  
      window.addEventListener('scroll', () => {
          if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && recarrega_logs && verifica_pagina == 'Logs') {
              loadMoreItems_logs();
          }
      });




$(document).ready(function() {
        var pressed = false; // Flag para verificar se o mouse está pressionado
        var startX; // Posição inicial do mouse
        var scrollX; // Posição inicial de rolagem
    
        $("#tabela_logs_div").mousedown(function(e) {
            // Quando o botão do mouse é pressionado
            pressed = true;
            startX = e.pageX - $(this).offset().left; // Define a posição inicial do mouse
            scrollX = $(this).scrollLeft(); // Define a posição inicial de rolagem
            $(this).css('cursor', 'grabbing');
        });
    
        $(document).mouseup(function() {
            // Quando o botão do mouse é solto
            pressed = false;
            $("#tabela_logs_div").css('cursor', 'grab');
        });
    
        $("#tabela_logs_div").mousemove(function(e) {
            // Quando o mouse se move
            if (pressed) {
                e.preventDefault(); // Previne qualquer seleção de texto durante o arrasto
                var x = e.pageX - $(this).offset().left; // Posição atual do mouse
                var scroll = scrollX - (x - startX); // Calcula a nova posição de rolagem
                $(this).scrollLeft(scroll); // Aplica a nova posição de rolagem
            }
        });
    });
    