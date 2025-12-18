"use strict";
  // Encontra o cookie que contém o csrftoken do Django
  const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
  // Extrai o valor do csrftoken do cookie
  const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;

var tabela_campanha = function(){

    let btn_importa_csv;

    var init = function(){


      
        // Faixa de valor
        // $("#u-range-03").ionRangeSlider({
        //   type: "double",
        //   grid: true,
        //   min: 0,
        //   max: 10000,
        //   from: 0, 
        //   to: 10000,
        //   prefix: "$"
        // })

        function ajusta_campanhas(){
          let tbody = document.getElementById('tabela_campanhas')
          tbody.innerHTML = ''
          fetch('api/campanhas/ultimas_campanhas/')
          .then((res)=>res.json())
          .then(data=>{
            console.log(data)
            if(data.length > 0){
                tbody.innerHTML = gera_tabela(data)
            }
            else{
              tbody.innerHTML = '<tr><td colspan="4">Não há dados</td></tr>';
            }
          })
          .catch(error=>{
            swal({
              text: "Ocorreu um erro ao tentar buscar dados!" ,
              icon: "error",
              buttonsStyling: false,
              confirmButtonText: "Ok",
              customClass: {
                  confirmButton: "btn btn-primary"
              }
          });
          })
        }  

        ajusta_campanhas()


        $('#filtrar').on('click', function(){
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
          fetch('api/bmm_boomerangue/filtragem/', {  // Substitua pela URL da sua API
            method: 'POST',
            headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
          },
            body: JSON.stringify(data)
          }).then(res=>res.json())
          .then(data=>{
            if(data){
              tbody.innerHTML = gera_tabela(data, soma)
              loader.style.display = 'none'
              cont.innerHTML = `(${contarTrs(tbody)})`

            }
            else{
              tbody.innerHTML='<tr><td>Não há dados</td></tr>'
              loader.style.display = 'none'
              cont.innerHTML = '(0)'
              soma.innerHTML = 'R$ 0,00'
            }
          })
          .catch(error=>{
            swal({
              text: "Ocorreu um erro ao tentar buscar dados!" ,
              icon: "error",
              buttonsStyling: false,
              confirmButtonText: "Ok",
              customClass: {
                  confirmButton: "btn btn-primary"
              }
          });
          })
          
        })


        function formatarData(dataString) {
          // Criar um objeto Date a partir da string de data ISO
          if(dataString){
            var data = new Date(dataString);
        
            // Obter os componentes da data
            var dia = data.getDate().toString().padStart(2, '0');
            var mes = (data.getMonth() + 1).toString().padStart(2, '0'); // getMonth() retorna um valor de 0 a 11
            var ano = data.getFullYear();
        
        
            // Montar a string formatada
            return `${dia}/${mes}/${ano}`;
          }
          else{
            return '-';
          }
        }


        function formatarMoedaBrasil(valor) {
            return parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }

        function gera_tabela(index){
          let rowsHTML = ''; // String para construir HTML

          let somaTotal = 0
          // Verifica se index é um objeto único e não um array, e o converte para um array
          if (!Array.isArray(index)) {
            index = [index];
          }

          for(let i = 0; i < index.length; i++){
            
            let statusOptions = []
            
            for (let status in index[i].opcoes) {
              let selected = index[i].status_campanha === status ? 'selected' : '';
              statusOptions += `<option value="${status}" ${selected}>${index[i].opcoes[status]}</option>`;
          }

            let statusBadge;
            switch (index[i].status_campanha) {
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
            rowsHTML += `
            <tr>
              <td>
                <div class="media">
                  <div class="square-box me-2"><img class="img-fluid b-r-5"
                      src="${index[i].ImageBannerMobile}" alt=""></div>
                  <div class="media-body ps-2">
                    <div class="avatar-details"><a href="/campanha_consulta/${index[i].id}">
                        <h6>${index[i].Campanha}</h6>
                      </a><span>${index[i].TextoPromocional}</span></div>
                  </div>
                </div>
              </td>
              <td class="img-content-box">
                <h6>${formatarData(index[i].data_fim) || '-'}</h6>
              </td>
              <td>
                <h6>${index[i].valor_total.ValorVendas != null ? formatarMoedaBrasil(index[i].valor_total.ValorVendas) : '0,00'}</h6>
              </td>
              <td>
              <select class="statusSelect badge ${statusBadge}" onchange='atualiza_select(this)' style='border: none;'  id="${index[i].id}">
                    ${statusOptions}
                </select>
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


    }
    return {
        init: function() {
            // btn_importa_csv = document.getElementById('new_csv')
            init();
        }
    };
}()

tabela_campanha.init()

function atualiza_select(e){
  const data = new FormData();
  data.append("status_campanha", e.value);
  atualiza_cor(e)
  // Resto do código...
  fetch(`api/campanhas/${e.id}/`, {
      method: 'PATCH',
      headers: {
          'X-CSRFToken': csrftoken,
      },
      body: data,
  }).then((response) => response.json())
  .then((data) => {
    if(data.id){
      console.log('Alterado')
    }
    else{
      swal({
        title: "Erro",
        text: data.error, 
        icon: "error",
        button: "OK",
      });
      e.value = data.original
      atualiza_cor(e)

    }
  })
  .catch(error=>{
    swal({
      title: "Erro",
      text: "Houve um erro ao chamar API", 
      icon: "error",
      button: "OK",
    });
  })
}


function atualiza_cor(e){
  if (e.value === 'AG') {
    e.classList.remove('badge-success', 'badge-secondary', 'badge-warning', 'badge-light');
    e.classList.add('badge-info');
  } else if (e.value === 'EA') {
      e.classList.remove('badge-info', 'badge-secondary', 'badge-warning', 'badge-light');
      e.classList.add('badge-success');
  } else if (e.value === 'EC') {
      e.classList.remove('badge-info', 'badge-success', 'badge-warning', 'badge-light');
      e.classList.add('badge-secondary');
  } else if (e.value === 'PA') {
      e.classList.remove('badge-info', 'badge-success', 'badge-secondary', 'badge-light');
      e.classList.add('badge-warning');

  } else {
      e.classList.remove('badge-info', 'badge-success', 'badge-secondary', 'badge-warning');
      e.classList.add('badge-light');

  }
}


