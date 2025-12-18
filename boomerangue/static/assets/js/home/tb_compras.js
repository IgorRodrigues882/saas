"use strict";
  // Encontra o cookie que contém o csrftoken do Django

var tabela_compras = function(){

    let btn_importa_csv;

    var init = function(){

      

        function ajusta_compras(){
          let tbody = document.getElementById('tb_compras')
          tbody.innerHTML = ''
          fetch('api/pix_transaction/ultimas_compras/')
          .then((res)=>res.json())
          .then(data=>{
            console.log(data)
            if(data.length > 0){
                tbody.innerHTML = gera_tabela_compras(data)
            }
            else{
              tbody.innerHTML = '<tr><td colspan="4">Não há dados</td></tr>';
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
      

        function formatarMoedaBrasil(valor) {
            return parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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