"use strict";
  // Encontra o cookie que contém o csrftoken do Django
  const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
  // Extrai o valor do csrftoken do cookie
  const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;
var campaign = function(){

  
    var navlinks;
    var cards;
    var nomes;
    var init = function(){


            navlinks.forEach(element => {
                element.addEventListener("click", function(){
                    cards.forEach(el=>{
                        if(element.id == "todas"){
                            $(el).show();
                        }
                       else if(el.id == element.id){
                        $(el).show();
                       }
                       else{
                        $(el).hide();
                       }
                    })
                });

            })

            function testAnim(x) {
                $('.modal .modal-dialog').attr('class', 'modal-dialog modal-lg ' + x + '  animated');
            };
    
            $('#modalRelatorioVendas').on('show.bs.modal', function (e) {
                var anim = 'fadeInLeftBig';
                testAnim(anim);
            });

            $("#pesquisar-campanha").on('keyup', function(e){
                // Valor digitado no input
                var searchTerm =  e.target.value.toLowerCase();
                // Itera sobre as divs com a classe .item e verifica a semelhança com o termo de pesquisa
                    for(let i=0; i<nomes.length; i++) {
                    var text = nomes[i].innerText.toLowerCase();
                    var parentDiv = nomes[i].closest(".card-principal");
                    // Se a div contém a sequência de caracteres digitada, mostra a div, caso contrário, esconde
                    if (!text.includes(searchTerm)) {
                        $(parentDiv).hide()
                    } else {
                        $(parentDiv).show()
                    }
                };
            })



    
    }
    return {
        init: function() {
            navlinks = document.querySelectorAll('.nav-link');
            cards = document.querySelectorAll('.card-principal');
            nomes = document.querySelectorAll('#nome-campanha');
            init();
        }
    };
}()

campaign.init()

"use strict";
let id_campanha;
function geraRelatorio(e){
    // Crie um novo objeto Date que representará a data e hora atuais
    const dataAtual = new Date();
    id_campanha = e
    // Obtenha a hora, os minutos e os segundos
    const horas = dataAtual.getHours();
    const minutos = dataAtual.getMinutes();
    $('#relatorio_msg').html('');
    $('#texto_analise').html('Analisando campanha...<i class="fa fa-spin fa-spinner"></i>');
    fetch('geraRelatorio',{
        method: "POST",
        credentials: 'include',
        headers: {
            "Content-Type": "application/json",
         },
        body: JSON.stringify(e),
        }).then((response) => response.json())
        .then((data) => {
            console.log(data)
            if (data.chatbot_response) {
                let json = data.chatbot_response;
                json = json.replace(/\n/g, '<br/>');
              
                let relatorio = `
                <div class="message my-message" style='width: 80%;' id='relatorio_gerado_ia'>
                    <img class="rounded-circle float-start chat-user-img img-30" src="{% static 'assets/images/user/3.png' %}" alt="">
                    <div class="message-data text-end">
                        <span class="message-data-time">${horas}:${minutos}</span>
                    </div>
                    <div class="message-content">
                        ${json}
                    </div>
                </div>
              `;
              $('#relatorio_msg').html(relatorio);
              $('#texto_analise').text('Campanha Analisada!');
            }
            else{
                var relatorio = `<div class="message my-message"><img class="rounded-circle float-start chat-user-img img-30"
                                src="{% static 'assets/images/user/3.png' %}" alt="">
                            <div class="message-data text-end"><span class="message-data-time">${horas}:${minutos}</span></div>Houve um erro ao tentar gerar o relatório! Tente novamente!
                            </div>`

                $('#texto_analise').text('Erro!')
            }
        })
}

$("#gerar_novo_relatorio").on('click', function(){
  geraRelatorio(id_campanha)
})


$("#save_pdf").on('click', function(){
    const divToConvert = document.querySelector("#relatorio_gerado_ia"); // Seleciona a div com o conteúdo que você deseja converter em PDF

    html2pdf(divToConvert, {
        margin: 10, // Margens do PDF
        filename: 'analise_camapanha.pdf', // Nome do arquivo PDF
        image: { type: 'jpeg', quality: 0.98 }, // Opções de imagem
        html2canvas: { scale: 2 }, // Opções do html2canvas
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } // Opções do jsPDF
    }).from(divToConvert).save(); // Gere o PDF e salve-o
})

var loader = document.getElementById('loader');
var page = 1;

$("#filtro_campanhas").on('change', function(e){
    console.log(e.target.value)
    var div_body = document.getElementById('div_body_campanha');
    div_body.innerHTML = ''
    loader.style.display='block'
    console.log(options)
    fetch(`api/filtro_campanhas/?query=${e.target.value}&page=${page}`)
    .then(response => response.json())
      .then(data => {
        console.log("Filtragemmm",data)
        if (data) {
            console.log(data)
            var pills = data.map(function (campanha) {
              var statusBadge;
              let li = []
              var statusOptions = "";
              let taxa_conversao = ((campanha.Estatisticas.Vendas / campanha.Estatisticas.nBoomerangues) * 100).toFixed(2);
              
              for (var i = 0; i < options.length; i++) {
                  // Verifica se o valor da opção é igual ao status_campanha da campanha
                  var isSelected = options[i].value === campanha.status_campanha ? "selected" : "";
              
                  statusOptions += `<option value="${options[i].value}" ${isSelected}>${options[i].text}</option>`;
              }
              
              if(campanha.ItensMaisVendidos.length > 0){
                for (let j=0; j < campanha.ItensMaisVendidos.length; j++){
                  li += ` <li class="d-inline-block"><img class="img-30 rounded-circle" onerror="this.onerror=null;this.src='{% static 'assets/images/user/1.jpg' %}';" src="${campanha.ItensMaisVendidos[j].produto__PathProduto}" alt="" data-original-title="${campanha.ItensMaisVendidos[j].produto__Descricao_Amigavel}" title="${campanha.ItensMaisVendidos[j].produto__Descricao_Amigavel}"></li>`
                }
              }

              switch (campanha.status_campanha) {
                case 'AG':
                  statusBadge = 'badge-info';
                  break;
                case 'EA':
                  statusBadge = 'badge-success';
                  break;
                case 'EC':
                  statusBadge = 'badge-secondary';
                  break;
                case 'PA':
                  statusBadge = 'badge-warning';
                  break;
                default:
                  statusBadge = 'badge-light';
              }
          
              return `
                <div class="col-xxl-4 box-col-6 col-lg-6 card-principal" id="${campanha.CampanhaAtiva === 'S' ? 'em-andamento' : 'encerrada'}">
                  <div style="background-color: #FEFEFE;" class="project-box">
                    <select class="statusSelect badge ${statusBadge}"  id="${campanha.id}">
                      ${statusOptions}
                    </select>
                    <h6 id="nome-campanha">${campanha.Campanha}</h6>
                    <div class="media"><img class="img-20 me-2 rounded-circle" src="/boomerangue/static/assets/images/user/3.jpg" alt="" data-original-title="" title="">
                      <div class="media-body">
                        <p></p>
                      </div>
                    </div>
                    <p>${campanha.TextoPromocional}</p>
                    <div class="row details">
                      <div class="col-6"><span>Boomerangues</span></div>
                      <div class="col-6 font-primary">${campanha.Estatisticas.nBoomerangues} (Enviados ${campanha.Estatisticas.Enviado != null ? campanha.Estatisticas.Enviado : 0})</div>
                      <div class="col-6"> <span>Comprando</span></div>
                      <div class="col-6 font-primary">${campanha.Estatisticas.Comprando != null ? campanha.Estatisticas.Comprando : 0}</div>
                      <div class="col-6"><span>Vendas</span></div>
                      <div class="col-6 font-primary">R$ ${campanha.Estatisticas.ValorVendas != null ? parseFloat(campanha.Estatisticas.ValorVendas).toFixed(2) : '0.00'} (${campanha.Estatisticas.Vendas != null ? campanha.Estatisticas.Vendas : 0})</div>
                      <div class="col-6"><span>Abandonado</span></div>
                      <div class="col-6 font-primary">R$ ${campanha.Estatisticas.CarrinhoAbandonado != null ? parseFloat(campanha.Estatisticas.CarrinhoAbandonado).toFixed(2) : '0.00'}</div>
                    </div>
                    <div class="customers">
                      <ul>
                        ${li}
                        
                        <li class="d-inline-block ms-2">
                          <p class="f-12">Top 3 Mais vendidos</p>
                        </li>
                      </ul>
                    </div>
                    <div class="project-status mt-4 mb-3">
                      <div class="media mb-0">
                        <p>${!isNaN(taxa_conversao) ? taxa_conversao : 0}%</p>
                        <div class="media-body text-end"><span>Taxa de conversão</span></div>
                      </div>
                      <div class="progress" style="height: 5px">
                        <div class="progress-bar-animated bg-primary progress-bar-striped" role="progressbar" style="width: ${!isNaN(taxa_conversao) ? taxa_conversao : 0}%" aria-valuenow="10" aria-valuemin="0" aria-valuemax="100"></div>
                      </div>
                    </div>
                    <div class="d-flex">
                      <div class="col-8">
                        <a href="/campanha_consulta/${campanha.id}" class="btn btn-primary">Ver mais</a>
                      </div>
                      <div class="col-2">
                        <a data-bs-toggle="modal" id="relatorio-vendas" onclick="geraRelatorio(${campanha.id})" title="Gerar relatório de vendas utilizando IA" style="width: 35px; height: 35px; border-radius: 50%; padding: 0;display: flex; justify-content: center; align-items: center;" class="btn btn-outline-secondary btn-air-secondary ms-3" data-bs-target="#modalRelatorioVendas"><i class="fa fa-magic"></i></a>
                      </div>
                      <div class="col-2">
                        <a data-bs-toggle="modal" id="bot_envio_mensagens" onclick="escolhe_bot(${campanha.id})"  title="Bot Envio Mensagens: " style="width: 35px; height: 35px; border-radius: 50%; padding: 0;display: flex; justify-content: center; align-items: center;" class="btn btn-outline-info btn-air-info ms-1" data-bs-target="#modalescolheBot"><i class="fa fa-comments-o"></i></a>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            });
          
            // Adiciona os elementos ao DOM
            // Suponha que "#container" seja o ID do elemento onde você deseja adicionar os pills
            div_body.innerHTML = pills.join('');
            loader.style.display='none'
            atualiza_select()
          }
          else{
            div_body.innerHTML = '<h3>Não há Registros</h3>'
          }
          
      })

})

$('#filtro_campanhas').trigger('change');

$('.pagination .page-item').on('click', function(e){
  page = e.target.dataset.page;
  $('#filtro_campanhas').trigger('change');
  $('.pagination .page-item.active').removeClass('active');
  $(e.target.closest('.page-item')).addClass('active');
});


$(document).ready(function () {
  atualiza_select()
});
var statusSelect = document.querySelectorAll('.statusSelect');
var options = [
  {"value": "AG", "text": "Aguardando"},
  {"value": "EA", "text": "Em Andamento"},
  {"value": "EC", "text": "Encerrado"},
  {"value": "PA", "text": "Pausada"}
]
function atualiza_select(){
  statusSelect = document.querySelectorAll('.statusSelect');
  statusSelect.forEach(d=>{
  d.addEventListener('change', function(e) {
      console.log(d)
      const data = new FormData();
      data.append("status_campanha", e.target.value);
      if (e.target.value === 'AG') {
          e.target.classList.remove('badge-success', 'badge-secondary', 'badge-warning', 'badge-light');
          e.target.classList.add('badge-info');
      } else if (e.target.value === 'EA') {
          e.target.classList.remove('badge-info', 'badge-secondary', 'badge-warning', 'badge-light');
          e.target.classList.add('badge-success');
      } else if (e.target.value === 'EC') {
          e.target.classList.remove('badge-info', 'badge-success', 'badge-warning', 'badge-light');
          e.target.classList.add('badge-secondary');
      } else if (e.target.value === 'PA') {
          e.target.classList.remove('badge-info', 'badge-success', 'badge-secondary', 'badge-light');
          e.target.classList.add('badge-warning');
      
      } else {
          e.target.classList.remove('badge-info', 'badge-success', 'badge-secondary', 'badge-warning');
          e.target.classList.add('badge-light');
    
      }

      // Resto do código...
      fetch(`api/campanhas/${d.id}/`, {
          method: 'PATCH',
          headers: {
              'X-CSRFToken': csrftoken,
          },
          body: data,
      }).then((response) => response.json())
      .then((data) => {
        if(data.id){
          console.log('Salvo')
        }
        else{
          new swal({
            title: "Erro",
            text: data.error, 
            icon: "error",
            button: "OK",
          });
        }
      })
  },
);
  })
}


function escolhe_bot(index){
  document.getElementById('save_bot_update').dataset.id = index
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

  fetch(`api/campanhas/${index}/`)
  .then(res=>res.json())
  .then(data=>{
    if(data.bot_id){
      $("#select_bot").val(data.bot_id).trigger('change');
    }
    else{
      $("#select_bot").val('');
    }


  })
  .finally(()=>{
    swal.close()
  })
}

$("#save_bot_update").on('click', function(e){
  e.preventDefault()
  Swal.fire({
    title: 'Tem certeza que deseja iniciar essa campanha?',
    text: "Se o arquivo da campanha tiver menos que 500 registros os envios começarão imediatamente",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sim, faça isso!',
    cancelButtonText: 'Não, cancele!'
  }).then((result) => {
    if (result.isConfirmed) {

      // Coloque aqui a função que você quer executar
      let bot_id = new FormData;
      bot_id.append('bot_id', $("#select_bot").val())
      bot_id.append('ultimo_cnpj_processado', '')
      fetch(`/pt/api/campanhas/${e.target.dataset.id}/`,{
        method: 'PATCH',
        headers: {
          // 'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
        body: bot_id
      })
      .then(res=> res.json())
      .then(data=>{
        if(data.id){
            if(data.status_campanha == 'EA'){
              $('#modalescolheBot').modal('hide');
              init_envio(e.target.dataset.id)
            }
            else{
              Swal.fire({
                title: "Erro",
                text: "Por favor altere o status da campanha para 'Em Andamento'",
                icon: "error",
                button: "OK",
              })
            }

        }
        else{
          Swal.fire({
            title: "Erro",
            text: "Houve um erro ao tentar atualizar o BOT",
            icon: "error",
            button: "OK",
          })
        }
      })
        }
      })
  
})