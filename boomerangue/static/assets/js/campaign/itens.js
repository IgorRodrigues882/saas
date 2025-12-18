function formatNumber(num) {
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}


console.log("Numero_formatado", formatNumber(42.000000))
// Tabela itens

function gera_tabela_itens(index){
    let rowsHTML = ''; // String para construir HTML
    let badge, badgeClass;
  
    // Verifica se index é um objeto único e não um array, e o converte para um array
    if (!Array.isArray(index)) {
      index = [index];
    }
  
    for(let i = 0; i < index.length; i++){
      badge = index[i].produto_bloqueado === 'N' ? 'success' : 'danger';
      badgeClass = `badge badge-${badge} text-white`;
      let foto = index[i].foto != '' ? `<img src="${index[i].foto}"  style="width: 100%; height: 100%; object-fit: contain;"></img>` : `<i class="fa fa-shopping-bag txt-info"></i>`
      rowsHTML += `
      <tr>
        <td>
          <div class="media">
            <div class="square-box me-2">${foto}</div>
            <div class="media-body ps-2">
              <div class="avatar-details"><a href="/">
                  <h6>${index[i].descricao}</h6>
                </a><span>${index[i].id}</span></div>
            </div>
          </div>
        </td>
        <td class="img-content-box"><h6>${formatNumber(index[i].valor_atacado)}</h6></td>
        <td><h6>${formatNumber(index[i].valor_unitario)}</h6></td>
        <td style="width: 100px;"><h6>${formatNumber(index[i].valor_total_item)}</h6></td>
        <td><h6>${index[i].unidade_caixa}</h6></td>
        <td><h6>${index[i].unidade_venda}</h6></td>
        <td><h6><span class="${badgeClass}">${index[i].produto_bloqueado}</span></h6></td>
        <td><h6>${index[i].arquivo_import}</h6></td>
        <td>
              <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown"
                      aria-haspopup="true" aria-expanded="false">Opções</button>
                    <div class="dropdown-menu">
                      <a class="dropdown-item"
                        href="#" onclick="deleteitem(${index[i].id})">Desativar item</a>
                        <a class="dropdown-item"
                        href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#editar_item" onclick="editaritem(${index[i].id})">Editar</a>
                    </div>
            </td>
      </tr>`;
    }
    
    return rowsHTML; // Definir HTML de uma vez
  }
  
  var loader_itens = document.getElementById('loader_itens');
  const table_itens = document.getElementById('item-table-itens');
  var recarrega_itens = true;
  var page_itens = 2;
  (function ($) {
    var bestPictures = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace("value"),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      prefetch: "",
      remote: {
        url: `/pt/api/bmm_boomerangueitens/?query=%QUERY&id=${$("#id_campanha").data('id')}`,
        wildcard: "%QUERY",
        filter: function (response) {
          console.log(response)
          return response; // Assumindo que a API retorna a lista diretamente
        }
      }
    });
  
    $("#remote-itens .typeahead").on('typeahead:asyncrequest', function () {
      // Mostrar indicador de carregamento
      $(".loading-indicator-itens").show();
    });
  
    $("#remote-itens .typeahead").on('typeahead:asyncreceive', function () {
      // Esconder indicador de carregamento
      $(".loading-indicator-itens").hide();
    });
  
    $("#remote-itens .typeahead").typeahead(null, {
      name: "",
      limit: 10,
      display: 'descricao',
      source: bestPictures
    }).on('typeahead:selected', function (e, datum) {
      loader_itens.style.display='block';
      const tbody = table_itens.querySelector('tbody');
      tbody.innerHTML=''
      
      // Aqui você pode acessar o ID do item selecionado como datum.id
      var selectedId = datum.id;
      console.log(datum)
      fetch(`/pt/api/bmm_boomerangueitens/${selectedId}/`)
        .then(response => response.json())
        .then(data => {
          var rows = '<div>Não há resultados</div>'
          if(data.id){
            rows = gera_tabela_itens(data)
          }
          tbody.innerHTML = rows
          loader_itens.style.display = 'none';
          recarrega_itens = false;
          
        })
        .catch(error => {
          console.error('Erro ao buscar dados:', error);
        });
    })
  
    $("#remote-itens .typeahead").on('input', function() {
      if ($(this).val() === '') {
        $(".loading-indicator-itens").hide();
        loader_itens.style.display='block';
        var tbody = table_itens.querySelector('tbody');
        tbody.innerHTML=''
        
        // O campo de pesquisa foi apagado
      // Faça uma requisição para buscar as opções que estavam antes aqui
      fetch(`/pt/api/bmm_boomerangueitens/?id=${$("#id_campanha").data('id')}`)
      .then(response => response.json())
      .then(data => {
          var rows = '<div class="text-center">Não há resultados</div>'
          if(data){
            rows = gera_tabela_itens(data)
          }
          tbody.innerHTML = rows
          loader_itens.style.display='none';
          recarrega_itens = true
          page_itens = 2;
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
  
  let loading_itens = false; // Flag para evitar solicitações simultâneas
      function loadMoreItems_itens() {
          if (loading_itens){
              loader_itens.style.display = 'block';
              return; // Evitar solicitações simultâneas
          }
  
          loader_itens.style.display = 'none'
          // Marcar que estamos carregando itens
          loading_itens = true;
          fetch(`/pt/load_more_itens_templates/?page=${page_itens}&id=${$("#id_campanha").data('id')}`)
              .then(response => response.json())
              .then(data => {
                  console.log(data)
                  const items = data.items;
                  if (items.length > 0) {
                      const tbody = table_itens.querySelector('tbody');
                      let badge, badgeClass, foto
                      items.forEach(itemData => {
                        console.log(itemData)
                          const row = document.createElement('tr');
                          badge = itemData.produto_bloqueado === 'N' ? 'success' : 'danger';
                          badgeClass = `badge badge-${badge} text-white`;
                          foto = itemData.foto != '' ? `<img src="${itemData.foto}"  style="width: 100%; height: 100%; object-fit: contain;"></img>` : `<i class="fa fa-shopping-bag txt-info"></i>`
                          row.innerHTML = `
                          <td>
                            <div class="media">
                              <div class="square-box me-2"><i class="fa fa-shopping-bag txt-info"></i></div>
                              <div class="media-body ps-2">
                                <div class="avatar-details"><a href="/">
                                    <h6>${itemData.descricao}</h6>
                                  </a><span>${itemData.id}</span></div>
                              </div>
                            </div>
                          </td>
                          <td class="img-content-box"><h6>${itemData.valor_atacado}</h6></td>
                          <td><h6>${itemData.valor_unitario}</h6></td>
                          <td style="width: 100px;"><h6>${itemData.valor_total_item}</h6></td>
                          <td><h6>${itemData.unidade_caixa}</h6></td>
                          <td><h6>${itemData.unidade_venda}</h6></td>
                          <td><h6><span class="${badgeClass}">${itemData.produto_bloqueado}</span></h6></td>
                          <td><h6>${itemData.arquivo_import}</h6></td>
                        `
                        
  
                          tbody.appendChild(row);
                      });
                      page_itens++;
                  }
              })
              .catch(error => {
                  console.error('Erro ao carregar mais itens:', error);
              }).finally(() => {
                  // Marcar que terminamos de carregar
                  loading_itens = false;
                  loader_itens.style.display = 'none';
              });
      }
  
      window.addEventListener('scroll', () => {
          if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && recarrega_itens && verifica_pagina == 'Itens') {
              loadMoreItems_itens();
          }
      });
      


function deleteitem(index){
  Swal.fire({
    title: 'Tem certeza que deseja desativar esse item?',
    text: "",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sim, faça isso!',
    cancelButtonText: 'Não, cancele!'
  }).then((result) => {
    if (result.isConfirmed) {
      fetch('/pt/api/bmm_boomerangueitens/items_campanha/',{
        method:"POST",
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({
          id:index,
          desativar: 'S'
        })
      })
      .then((res)=>res.json())
      .then(data=>{
        console.log(data)
      })
    }
  })
}

function editaritem(index){
  document.getElementById("salvar_itens_edicao").dataset.id = index;
  Swal.fire({
    title: 'Aguarde...',
    allowOutsideClick: false, // Impede cliques fora do alerta
    allowEscapeKey: false,    // Impede o uso da tecla Esc
    allowEnterKey: false,     // Impede o uso da tecla Enter
    showConfirmButton: false, // Não mostra o botão de confirmação
    onBeforeOpen: () => {     // Função chamada antes de abrir o alerta
        Swal.showLoading()    // Mostra o indicador de carregamento
    }
  });
  fetch(`/pt/api/bmm_boomerangueitens/${index}/`,{
        method:"GET",
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
      })
      .then((res)=>res.json())
      .then(data=>{
        if(data.id){
          console.log(data)
          $("#imagem_item").attr('src',data.foto)
          $("#PathProduto").val(data.foto)
          $("#Descricao_Amigavel").val(data.descricao)
          $("#valor_unitario_").val(data.valor_unitario)
          $("#quantidade_disponivel").val(data.quantidade_disponivel)
          $("#multiplo_boomerangue").val(data.multiplo_boomerangue)
          $("#quantidade_maxima").val(data.quantidade_maxima)
          $("#quantidade_minima").val(data.quantidade_minima)
          Swal.close()
        }

      })
  }

  function save_edicao_itens(e){
    Swal.fire({
      icon: 'info', // Altere para "info" ou qualquer outro ícone conforme sua preferência
      title: '<b>Carregando... Isso pode demorar um pouco</b><br/>', // Adicione um GIF de carregamento aqui
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading(); // Mostra o loader antes do conteúdo ser renderizado
      },
      allowOutsideClick: false, // Impede cliques no fundo durante o carregamento
    })

    fetch(`/pt/api/bmm_boomerangueitens/items_campanha/`,{
      method:'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken,
      },
      body: JSON.stringify({
        id: e.dataset.id,
        PathProduto: $("#PathProduto").val() || null,
        Descricao_Amigavel: $("#Descricao_Amigavel").val()|| null,
        valor_unitario: $("#valor_unitario_").val()|| null,
        quantidade_disponivel: $("#quantidade_disponivel").val()|| null,
        multiplo_boomerangue: $("#multiplo_boomerangue").val()|| null,
        quantidade_maxima: $("#quantidade_maxima").val() || null,
        quantidade_minima: $("#quantidade_minima").val() || null
      })
    }).then(res=>res.json())
    .then(data=>{
      if (data.Success){
        Swal.fire({
          icon: 'success',
          title: 'Alterações salvas!',
          showConfirmButton: false,
          timer: 1500
      }).then(()=>{
        $(".loading-indicator-itens").hide();
        loader_itens.style.display='block';
        var tbody = table_itens.querySelector('tbody');
        tbody.innerHTML=''
        
        // O campo de pesquisa foi apagado
      // Faça uma requisição para buscar as opções que estavam antes aqui
      fetch(`/pt/api/bmm_boomerangueitens/?id=${$("#id_campanha").data('id')}`)
      .then(response => response.json())
      .then(data => {
          var rows = '<div class="text-center">Não há resultados</div>'
          if(data){
            rows = gera_tabela_itens(data)
          }
          tbody.innerHTML = rows
          loader_itens.style.display='none';
          recarrega_itens = true
          page_itens = 2;
      })
      });
      }
      console.log(data)
    })
  }


  Inputmask('currency', {
    alias: 'numeric',
    suffix: '',
    radixPoint: ',',
    groupSeparator: '.',
    autoGroup: true,
    digits: 2,
    digitsOptional: false,
    placeholder: '0'
}).mask($("#valor_unitario_"));