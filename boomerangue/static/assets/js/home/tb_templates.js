"use strict";
  // Encontra o cookie que contém o csrftoken do Django

  
var tabela_templates = function(){

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

        function ajusta_templates(){
          let tbody = document.getElementById('tabela_templates')
          tbody.innerHTML = ''
          fetch('api/bmm_template/top_templates/')
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
              text: "Ocorreu um erro ao tentar buscar dados!"+error ,
              icon: "error",
              buttonsStyling: false,
              confirmButtonText: "Ok",
              customClass: {
                  confirmButton: "btn btn-primary"
              }
          });
          })
        }  

        ajusta_templates()



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
          let rowsHTML = ''; // String para construir HTML

          // Verifica se index é um objeto único e não um array, e o converte para um array
          if (!Array.isArray(index)) {
            index = [index];
          }
          let s;
          let n;
          let badge

          for(let i = 0; i < index.length; i++){
            if(index[i].Ativo == "S"){
                badge = 'badge-success'
                s = 'selected'
              }
              else{
                badge = 'badge-danger'
                n = 'selected'
              }
            
        //     let statusOptions = []
            
        //     for (let status in index[i].opcoes) {
        //       let selected = index[i].status_campanha === status ? 'selected' : '';
        //       statusOptions += `<option value="${status}" ${selected}>${index[i].opcoes[status]}</option>`;
        //   }
            rowsHTML += `
            <tr>
              <td>
                <div class="media">
                  <div class="square-box me-2"><img class="img-fluid b-r-5"
                      src="${index[i].image_banner_mobile}" alt=""></div>
                  <div class="media-body ps-2">
                    <div class="avatar-details"><a href="/templates/${index[i].id}">
                        <h6>${index[i].nome_template}</h6>
                      </a><span>${index[i].texto_promocional}</span></div>
                  </div>
                </div>
              </td>
              <td class="img-content-box">
                <select style="border: none;" class="badge ${badge}" onchange="atualiza_status(this, ${index[i].id})">
                    <option value="S" ${s} >Sim</option>
                    <option value="N" ${n} >Não</option>
                </select>
              </td>
              <td>
                <h6>${index[i].total_campanhas}</h6>
              </td>
              <td>
              <a class="btn btn-primary"
                href="javascript:void(0)" onclick="pausa_campanhas(${index[i].id})">Pausar Campanhas</a>
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

tabela_templates.init()




function atualiza_status(index, id){
    if(index.value == 'S'){
      index.classList.remove('badge-danger');
      index.classList.add('badge-success');
    }
    else{
      index.classList.remove('badge-success');
      index.classList.add('badge-danger');
    }
    const data = new FormData();
    data.append("Ativo", index.value);
    fetch(`api/bmm_template/${id}/`,{
      method:'PATCH',
      headers: {
        'X-CSRFToken': csrftoken,
      },
      body:data
    }).then((res)=>{
      if(!res.ok){
        swal({
        text: "Ocorreu um erro!",
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

  function pausa_campanhas(index){
    swal({
      title: "Tem certeza?",
      text: "Tem certeza que deseja pausar as campanhas desse template?",
      icon: "warning",
      buttons: true,
      dangerMode: true
    }).then((willDelete) => {
        if (willDelete) {
        swal({
          title: "Aguarde...",
          text: "Verificando Campanhas do Template",
          icon: "info",
          showConfirmButton: false,
          allowOutsideClick: false,
        })
        fetch(`api/pausa_campanhas/${index}/`,{
          method: 'POST',
          headers: {
            'X-CSRFToken': csrftoken,
          },
  
        }).then(response => response.json())
        .then(data => {
          if(data.status){
            swal({
              title: "Sucesso!",
              text: data.message,
              icon: "success",
              button: "OK",
            });
          }
          else{
            swal({
              title: "Atenção!",
              text: data.message,
              icon: "warning",
              button: "OK",
            });
          }
          
        })
        .catch(error => {
          swal({
            title: "Erro",
            text: "Houve um erro ao tentar coletar informações do template!",
            icon: "error",
            button: "OK",
          });
        });
      }
    })
  }