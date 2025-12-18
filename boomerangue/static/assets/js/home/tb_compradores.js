"use strict";
  // Encontra o cookie que contém o csrftoken do Django
  
var tabela_compradores = function(){

    let btn_importa_csv;

    var init = function(){


      
        function ajusta_compradores(){
          let tbody = document.getElementById('compradores')
          tbody.innerHTML = ''
          fetch('api/bmm_boomerangueitens/top_compradores/')
          .then((res)=>res.json())
          .then(data=>{
            console.log(data)
            if(data.length > 0){
                tbody.innerHTML = gera_tabela_compradores(data)
            }
            else{
              tbody.innerHTML = '<tr><td colspan="3">Não há dados</td></tr>';
            }
          })
          .catch(error=>{
            swal({
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

        ajusta_compradores()


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
          const agora = moment();
          const dataPassada = moment(data);
          const diferenca = agora.diff(dataPassada);
      
          if (diferenca < moment.duration(1, 'hours').asMilliseconds()) {
              // Menos de uma hora
              const minutos = moment.duration(diferenca).minutes();
              return `${minutos} minutos atrás`;
          } else if (diferenca < moment.duration(1, 'days').asMilliseconds()) {
              // Menos de um dia
              const horas = moment.duration(diferenca).hours();
              return `${horas} horas atrás`;
          } else if (diferenca < moment.duration(1, 'months').asMilliseconds()) {
              // Menos de um mês
              const dias = moment.duration(diferenca).days();
              return `${dias} dias atrás`;
          } else {
              // Mais de um mês
              const meses = moment.duration(diferenca).months();
              return `${meses} meses atrás`;
          }
      }

        function formatarMoedaBrasil(valor) {
            return parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }

        function gera_tabela_compradores(index){
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
                    src="" alt="">
                  <div class="media-body"><a href=entidade_consulta/${index[i].boomerangue__entidade__id}>
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

tabela_compradores.init()