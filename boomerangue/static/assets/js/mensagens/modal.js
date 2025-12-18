
function gera_lista_accordion_canais_modal(index) {
    let rowsHTML = ''; // String para construir HTML
    // Verifica se index é um objeto único e não um array, e o converte para um array
    if (!Array.isArray(index)) {
        index = [index];
    }
    console.log(index)
    for (let i = 0; i < index.length; i++) {
        rowsHTML += `
            <div class="card">
              <div class="card-header d-flex align-items-center"> <!-- Flexbox aqui -->
                <div class="me-2">
                    <input type="checkbox" class="canal-checkbox checkbox_animated" data-canal-id="${index[i].id}" style="display: none;">
                </div>

                <h5 class="p-0 m-0 col"> <!-- Remover margens para alinhamento correto -->
                  <button class="btn btn-link ps-0" data-bs-toggle="collapse" onclick="busca_leads_canal_modal(${index[i].id})" data-bs-target="#collapseiconmodal${index[i].id}"
                    aria-expanded="false" aria-controls="collapseiconmodal${index[i].id}">${index[i].canal_nome}</button>
                </h5>
              </div>
              <div class="collapse" id="collapseiconmodal${index[i].id}" aria-labelledby="collapseiconmodal${index[i].id}" data-parent="#accordion">
                <div class="card-body social-status filter-cards-view" id="lista-leads-modal-${index[i].id}">
                  
                </div>
                <div class="loader-box" id="loader_canais_names_modal${index[i].id}" style="display: none;">
                    <div class="loader-2"></div>
                </div>
              </div>
            </div>
        `;
    }
    return rowsHTML; // Definir HTML de uma vez
}





function busca_leads_canal_modal(id){
    console.log("AJUSTOU", id)
    let div = document.getElementById(`lista-leads-modal-${id}`)
    let loader_canais_names = document.getElementById(`loader_canais_names_modal${id}`)
    loader_canais_names.style.display='block'
    div.innerHTML = ""
    fetch(`api/canais_leads/retorna_leads/?id=${id}`)
    .then(res=>res.json())
    .then(data=>{
        console.log(data)
        if(data.length>0){
           div.innerHTML = mensagens.gera_lista_users_accordion(data)
        }
    })
    .finally(()=>{
        loader_canais_names.style.display = 'none'
    })


}

function abaCanais(){
    let div = document.getElementById("canais_list_modal")
    let loader = document.getElementById("loader-canais-modal")
    loader.style.display='block'
    div.innerHTML = ''
    fetch("api/canais/get_canais/?verify=True")
        .then(res=>res.json())
        .then(data=>{
            if(data.length>0){
               div.innerHTML = gera_lista_accordion_canais_modal(data)
            }
        })
        .finally(()=>{
            loader.style.display = 'none'
        })
}

$("#top-home-tab").on("click", function(){
    abaCanais()
})


 // Função para exibir checkboxes quando o botão de excluir é clicado
 $('#excluir_canais_modal').on('click', function() {
    $('.canal-checkbox').toggle(); // Exibe ou oculta checkboxes
    updateCount(); // Atualiza a contagem de itens selecionados
});

// Função para contar os checkboxes selecionados e atualizar a contagem no botão
$(document).on('change', '.canal-checkbox', function() {
    updateCount();
});

function updateCount() {
    let selectedCount = $('.canal-checkbox:checked').length;
    $('#count_selected').text(selectedCount);
}

// Função para excluir os itens selecionados com SweetAlert
$('#excluir_canais_modal').on('click', function() {
    let selectedIds = $('.canal-checkbox:checked').map(function() {
        return $(this).data('canal-id');
    }).get();

    if (selectedIds.length > 0) {
        Swal.fire({
            title: `Tem certeza que deseja excluir ${selectedIds.length} canal(is)?`,
            icon: 'info',
            showConfirmButton: true,
            showCancelButton: true,
            confirmButtonText: 'Sim',
            cancelButtonText: 'Não',
            confirmButtonColor: '#f27474',
            cancelButtonColor: '#6c757d'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Aguarde',
                    text: 'Excluindo...',
                    icon: 'info',
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    willOpen: () => {
                        Swal.showLoading();
                    }
                });

                // Envia o pedido DELETE em lote para o backend
                fetch('api/canais/excluir_canais_em_lote/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken, // CSRF Token para Django
                    },
                    body: JSON.stringify({ ids: selectedIds }) // Envia a lista de IDs para o backend
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire({
                            title: 'Excluído!',
                            text: 'Os canais foram excluídos com sucesso.',
                            icon: 'success',
                            showConfirmButton: false,
                            timer: 2000
                        });
                        // Remove os itens da tela
                        abaCanais()
                        updateCount();
                    } else {
                        Swal.fire({
                            title: 'Erro!',
                            text: data.message || 'Ocorreu um erro ao excluir os canais.',
                            icon: 'error',
                            confirmButtonText: 'Entendi',
                            confirmButtonColor: '#f27474'
                        });
                    }
                });
            }
        });
    } else {
        Swal.fire({
            title: 'Nenhum canal selecionado!',
            text: 'Por favor, selecione pelo menos um canal para excluir.',
            icon: 'warning',
            confirmButtonText: 'Entendi',
            confirmButtonColor: '#f27474'
        });
    }
});

$("#configuracoes").on('click', function(){
    abaCanais()
})


let page = 1;
let loading = false;


function gera_lista_leads_modal(users, d) {
    // Se 'users' não for um array, converta-o em um array
    if (!Array.isArray(users)) {
        console.warn("'users' não era um array, foi transformado em um.");
        users = [users];  // Transforma o valor em um array com um único elemento
    }

    let userHtml = ''

    users.forEach(user => {
        userHtml += `
          <div class="media">
            <div class="media-size-email">
              <label class="d-block mb-0">
                <input class="checkbox_animated checkbox_leads_${d}" type="checkbox" data-user-id="${user.id}">
              </label>
              <img class="me-3 rounded-circle" src="{% static 'assets/images/user/user.png' %}" alt="">
            </div>
            <div class="media-body">
              <h6>${user.Entidade}</h6>
              <p>${user.Telefone1}</p>
              <span>${user.DataValidacaoWP || 'No date'}</span>
            </div>
          </div>`;
    });
    return userHtml;
}

function clearUsers() {
    $("#loader-leads-modal").css('display', 'block')
    $('#list_leads').empty();  // Limpa a lista de usuários
  }
  // Função para carregar os usuários da API
  function loadUsers(page) {
    if (loading) return;  // Evita múltiplas requisições
    loading = true;
    $("#loader-leads-modal").css('display', 'block');

    // Obtém os valores dos inputs
    const campanhaId = $("#id_campanha_modal").val() || '';  // Usa string vazia se for undefined
    const leadId = $("#lead_pesquisar_modal").val() || '';  // Usa string vazia se for undefined
    const grupoId = $("#id_grupo_modal").val() || '';  // Usa string vazia se for undefined
    console.log("entrou aqui")
    $.ajax({
        url: `api/create-entidade/carregaLeads/?page=${page}&campanha_id=${campanhaId}&lead_id=${leadId}&grupo_id=${grupoId}`,
        type: 'GET',
        success: function (response) {
            loading = false;
            const users = response.results;
            console.log("resultes", response)
            $('#list_leads').append(gera_lista_leads_modal(users, 'modal'));
            $("#loader-leads-modal").css('display', 'none')
        },
        error: function (err) {
            loading = false;
            console.error("Erro ao carregar usuários:", err);
        },
    });
}



  // Carrega a primeira página ao carregar a página
  $(document).ready(function () {
    loadUsers(page);

    // Verifica quando o scroll atingir o final
    $('.leads_tabela_modal').scroll(function () {
      if ($(this).scrollTop() + $(this).innerHeight() >= this.scrollHeight) {
        page++;
        loadUsers(page);  // Carrega mais usuários
      }
    });
  });


  var bestmodal = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace("value"),
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    prefetch: "",
    remote: {
      url: `api/create-entidade/busca/?query=%QUERY`,
      wildcard: "%QUERY",
      filter: function (response) {
        console.log(response)
        return response; // Assumindo que a API retorna a lista diretamente
      }
    }
  });

  $("#remote-message-modal .typeahead").on('typeahead:asyncrequest', function () {
    // Mostrar indicador de carregamento
    $(".loading-indicator-message-modal").show();
  });

  $("#remote-message-modal .typeahead").on('typeahead:asyncreceive', function () {
    // Esconder indicador de carregamento
    $(".loading-indicator-message-modal").hide();
  });

  $("#remote-message-modal .typeahead").typeahead(null, {
      name: "Entidade",
      display: 'Entidade',
      limit: 15,
      source: bestmodal
  }).on('typeahead:selected', function (e, datum) {

    clearUsers()
    loadUsers(page=1)

  })

  $("#remote-message-modal .typeahead").on('input', function() {
    if ($(this).val() === ''){
        $(".loading-indicator-message-modal").hide();
        reseta_tabela_lead()
    }
  });

  let select_load = false

      // Função para carregar canais e usuários ao clicar no select
      $("#id_grupo_modal").on('click', function() {

        const selectElement = $(this);

        if (select_load) return; // Se já carregado, não buscar novamente

        selectElement.html('<option>Carregando...</option>');

        // Fetch para buscar canais e usuários
        fetch('api/canais/get_canais/')
        .then(response => response.json())
        .then(data => {
            selectElement.html('<option value="">Todas conversas</option>');

            if (data) {
                data.forEach(dados => {
                    if (dados.user_logado_id) {
                        selectElement.append(`<option value="${dados.user_logado_id}" data-user='true'>${dados.user_logado_username}</option>`);
                    } else {
                        selectElement.append(`<option value="${dados.id}">${dados.canal_nome}</option>`);
                    }
                });
            }

            select_load = true;  // Marcar como carregado
        })
        .catch((error) => {
            console.error('Erro ao carregar canais e usuários:', error);
            selectElement.html('<option value="">Erro ao carregar dados</option>');
        })
    });

    let select_load_ = false
    let datauser = false

      // Função para carregar canais e usuários ao clicar no select
      $("#nome_canal_modal").on('click', function() {

        const selectElement = $(this);

        if (select_load_) return; // Se já carregado, não buscar novamente

        selectElement.html('<option>Carregando...</option>');

        // Fetch para buscar canais e usuários
        fetch('api/canais/get_canais/')
        .then(response => response.json())
        .then(data => {
            selectElement.html('<option value="">Todas conversas</option>');

            if (data) {
                data.forEach(dados => {
                    if (dados.user_logado_id) {
                        selectElement.append(`<option value="${dados.user_logado_id}" data-user='true'>${dados.user_logado_username}</option>`);
                    } else {
                        selectElement.append(`<option value="${dados.id}">${dados.canal_nome}</option>`);
                    }
                });
            }

            select_load_ = true;  // Marcar como carregado
        })
        .catch((error) => {
            console.error('Erro ao carregar canais e usuários:', error);
            selectElement.html('<option value="">Erro ao carregar dados</option>');
        })
    });


    $("#nome_canal_modal").on("change", function() {
        // Pega a opção selecionada
        const selectedOption = $(this).find('option:selected');
        
        // Verifica se a opção possui o atributo data-user
        const hasDataUser = selectedOption.data('user') ? true : false;
    
        if (hasDataUser) {
            datauser = true
            console.log("A opção selecionada possui 'data-user'.");
        } else {
            datauser = false
            console.log("A opção selecionada não possui 'data-user'.");
        }
    });

function reseta_tabela_lead(){
    page = 1
    loadUsers(page)
}

$("#id_campanha_modal").on("change", function(){
    clearUsers()
    reseta_tabela_lead()
})

$("#id_grupo_modal").on("change", function(){
    clearUsers()
    reseta_tabela_lead()
})

$('#toggleButton').on('click', function() {
    $('#fadeDiv').toggleClass('show');
  });


  $('#save-canal-modal').on('click', function() {
    // Array para armazenar os IDs dos leads selecionados
    var selectedLeads = [];
    var url = 'api/canais_leads/'
    var data = {}
    $("#status_salvamento_canal").addClass('badge badge-warning').text("Salvando...");

    // Itera sobre todos os checkboxes marcados com a classe correta
    $('.checkbox_leads_modal:checked').each(function() {
      var userId = $(this).data('user-id');  // Pega o ID do usuário do atributo data-user-id
      if (userId) {  // Verifica se o userId existe e é válido
        selectedLeads.push(userId);
      } else {
        console.warn('ID de usuário indefinido para um dos checkboxes!');
      }
    });


    // Verifica se pelo menos um lead foi selecionado
    if (selectedLeads.length === 0) {
        Swal.fire({
            title: 'Nenhum Lead selecionado!',
            text: 'Por favor, selecione pelo menos um lead.',
            icon: 'warning',
            confirmButtonText: 'Entendi',
            confirmButtonColor: '#f27474'
        });
      return;
    }

    let id_canal = $("#nome_canal_modal").val();

    if(datauser){
        url = "api/usuario_lead/"
        data = {
            usuarios: [id_canal],  // Substituir por seus canais reais
            leads: selectedLeads
          }
    }
    else{ 
        data = {
            canais: [id_canal],  // Substituir por seus canais reais
            lead_ids: selectedLeads
            };
    }



    console.log(selectedLeads);  // Verifica se os IDs estão corretos

    if(id_canal == ''){
        Swal.fire({
            title: 'Nenhum canal selecionado!',
            text: 'Por favor, selecione pelo menos um canal.',
            icon: 'warning',
            confirmButtonText: 'Entendi',
            confirmButtonColor: '#f27474'
        });
      return;
    }

    // Prepara os dados para o envio
    

    // Faz o envio via fetch para a API do Django
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken  // Se necessário para proteção CSRF
      },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
      if (result.error) {
        $("#status_salvamento_canal").removeClass('badge badge-warning').addClass('badge badge-danger').text("Ocorreu um erro");
      } else {
        $("#status_salvamento_canal").removeClass('badge badge-warning');
        $("#status_salvamento_canal").addClass("badge badge-success").text("Tranferidos para o canal selecionado!");
      }
    })
    .catch(error => {
      console.error('Erro ao associar canais:', error);
    })
    .finally(() => {
        setTimeout(() => {
            $("#status_salvamento_canal").text('');
        }, 5000);
        datauser = false
    });
});

let pagenation = 1

function atr(pagenation){
    $("#loader-leads-atr").css('display', 'block')
    $("#list_atr").empty()
    fetch(`api/usuario_lead/meus_leads/?page=${pagenation}`)
    .then(res=>res.json())
    .then(data=>{
        $('#list_atr').append(gera_lista_leads_modal(data.results, 'atr'));
    })
    .finally(()=>{
        $("#loader-leads-atr").css('display', 'none')
    })

}

$('.leads_tabela_atr').scroll(function () {
    if ($(this).scrollTop() + $(this).innerHeight() >= this.scrollHeight) {
        pagenation++;
        atr(pagenation)  // Carrega mais usuários
    }
  });




$("#contact-top-tab").on('click', function(){
    atr(pagenation = 1)
})

$(document).ready(function () {
    let selectedLeads = new Set(); // Usaremos Set para armazenar leads selecionados de forma única.
    $("#excluir_lead_atr").hide();
    // Função para atualizar o botão de excluir com a contagem de selecionados
    function updateDeleteButton() {
        const count = selectedLeads.size;
        $("#count_selected_atr").text(count);
        if (count > 0) {
            $("#excluir_lead_atr").show();
        } else {
            $("#excluir_lead_atr").hide();
        }
    }

    // Evento ao marcar/desmarcar checkbox
    $(document).on('change', '.checkbox_leads_atr', function () {
        const userId = $(this).data('user-id');
        console.log(userId)
        if ($(this).is(':checked')) {
            selectedLeads.add(userId);  // Adiciona o lead à lista de selecionados
        } else {
            selectedLeads.delete(userId);  // Remove o lead da lista de selecionados
        }
        updateDeleteButton();  // Atualiza o botão de excluir com a contagem
    });

    // Função para excluir os leads selecionados
    $('#excluir_lead_atr').on('click', function () {
        if (selectedLeads.size === 0) return; // Se não houver nenhum selecionado, não faz nada

        console.log("AAAAA", selectedLeads)
        // Confirmação antes de excluir
        Swal.fire({
            title: 'Tem certeza?',
            text: "Você não poderá reverter esta ação!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim, excluir!',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Faz a requisição para excluir os leads
                fetch('api/usuario_lead/excluir_vinculo/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken // Função que obtém o CSRF token
                    },
                    body: JSON.stringify({ leads: Array.from(selectedLeads) })
                })
                .then(response => response.json())
                .then(data => {
                    console.log("dataExclusao", data)
                    if (data.success) {
                        // Remove os elementos dos leads excluídos da interface
                        selectedLeads.forEach(leadId => {
                            $(`input[data-user-id="${leadId}"] .checkbox_leads_atr`).closest('.media').remove();
                        });
                        selectedLeads.clear(); // Limpa o Set de leads selecionados
                        updateDeleteButton();  // Atualiza o botão
                        Swal.fire('Excluído!', 'Os leads foram excluídos com sucesso.', 'success');
                        atr(pagenation=1)
                    } else {
                        Swal.fire('Erro!', 'Houve um problema ao excluir os leads.', 'error');
                    }
                })
                .catch(error => {
                    console.error("Erro ao excluir leads:", error);
                    Swal.fire('Erro!', 'Não foi possível excluir os leads.', 'error');
                })
                .finally(()=>{
                    atr(pagenation = 1)
                })
            }
        })
    })
});
