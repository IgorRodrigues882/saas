

function gera_tabela_eventos(index){
  let rowsHTML = ''; // String para construir HTML
  console.log(index)
  // Verifica se index é um objeto único e não um array, e o converte para um array
  if (!Array.isArray(index)) {
      index = [index];
  }
  
  for(let i = 0; i < index.length; i++){
      let evento = index[i]; // Objeto de evento atual

      rowsHTML += `
      <tr>
          <td>
              <div class="media">
                  <div class="square-box me-2"><i class="fa fa-calendar text-success"></i></div>
                  <div class="media-body ps-2">
                      <div class="avatar-details"><a href="#">
                          <h6>${evento.tipoevento_id}</h6>
                      </a><span>${evento.id}</span></div>
                  </div>
              </div>
          </td>
          <td>
              <h6>${evento.origemevento_id}</h6>
          </td>
          <td>
              <h6>${formatDate(evento.DataGeracao)}</h6>
          </td>
          <td>
              <h6>${evento.ProtocoloGeracao}</h6>
          </td>
          <td>
              <h6>${formatDateTime(evento.DataProgramada)}</h6>
          </td>
          <td>
              <h6>${evento.statusevento_id}</h6>
          </td>
          <td>
              <h6>${evento.ChaveBot}</h6>
          </td>
          <td>
              <h6>${evento.NomeBot}</h6>
          </td>
          <td>
              <h6>${evento.DataBot}</h6>
          </td>
      </tr>
      `;
  }

  return rowsHTML; // Retorna HTML construído
}

// Funções auxiliares para formatação de data e data/hora
function formatDate(dateString) {
  let date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth()+1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

function formatDateTime(dateTimeString) {
  let date = new Date(dateTimeString);
  return `${formatDate(dateTimeString)} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
}
  
  var loader_eventos = document.getElementById('loader_eventos');
  const table_eventos = document.getElementById('item-table-eventos');
  var recarrega_eventos = true;
  var page_eventos = 2;
  
  $("#filtro_evento").on('change', function(e){
    const tbody = table_eventos.querySelector('tbody')
    tbody.innerHTML=''
    loader_eventos.style.display = 'block';
    if(e.target.value){
      recarrega_eventos = false
    }
    else{
      recarrega_eventos = true
    }
    fetch(`/pt/api/filtro_eventos/?query=${e.target.value}&id=${$("#id_campanha").data('id')}`)
    .then(response => response.json())
    .then(data => {
        let rows='<div>Não Há Dados</div>'
        if(data){
            rows = gera_tabela_eventos(data)
            loader_eventos.style.display = 'none';
        }
        tbody.innerHTML = rows

    })
  })
  
  let loading_eventos = false; // Flag para evitar solicitações simultâneas
      function loadMoreItems_eventos() {
          if (loading_eventos){
              loader_eventos.style.display = 'block';
              return; // Evitar solicitações simultâneas
          }
  
          loader_eventos.style.display = 'none'
          // Marcar que estamos carregando eventos
          loading_eventos = true;
          let tbody = table_eventos.querySelector('tbody');
          fetch(`/pt/load_more_eventos_campanhas/?page=${page_eventos}&id=${$("#id_campanha").data('id')}`)
              .then(response => response.json())
              .then(data => {

                  console.log(data)
                  if (data.itens.length>0) {
                    var rows = ''
                    rows = gera_tabela_eventos(data.itens)
                    console.log(rows)
                    tbody.innerHTML += rows
                    page_eventos++;
                  }
              })
              .catch(error => {
                  console.error('Erro ao carregar mais eventos:', error);
              }).finally(() => {
                  // Marcar que terminamos de carregar
                  loading_eventos = false;
                  loader_eventos.style.display = 'none';
              });
      }
  
      window.addEventListener('scroll', () => {
          if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && recarrega_eventos && verifica_pagina == 'Eventos') {
              loadMoreItems_eventos();
          }
      });

      

