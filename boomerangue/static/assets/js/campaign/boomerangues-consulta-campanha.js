// const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
// // Extrai o valor do csrftoken do cookie
// const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;
$("#u-range-03").ionRangeSlider({
  type: "double",
  grid: true,
  min: 0,
  max: 10000,
  from: 0, 
  to: 10000,
  prefix: "$"
})

var bmm = function(){
let currentPage = 1;
let totalPages = 1;
const div = document.getElementById('div_body_campanha');
let loading = false; // Flag para evitar solicitações simultâneas
var loader = document.getElementById('loader-boomerangue')


  var init = function(){


        // Sistema de pesquisa
        (function ($) {
          var bestPictures = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.obj.whitespace("value"),
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            prefetch: "",
            remote: {
              url: `/pt/api/create-entidade/busca/?query=%QUERY`,
              wildcard: "%QUERY",
              filter: function (response) {
                return response; // Assumindo que a API retorna a lista diretamente
              }
            }
          });
        
          $(".faq-form .typeahead").on('typeahead:asyncrequest', function () {
            // Mostrar indicador de carregamento
            $(".loading-indicator-itens").show();
          });
        
          $(".faq-form .typeahead").on('typeahead:asyncreceive', function () {
            // Esconder indicador de carregamento
            $(".loading-indicator-itens").hide();
          });
        
          $(".faq-form .typeahead").typeahead(null, {
            name: "Entidade",
            display: 'Entidade',
            limit: 15,
            source: bestPictures
          })
        
          $(".faq-form .typeahead").on('input', function() {
            if ($(this).val() === '') {
              $(".loading-indicator-itens").hide();
            }
          })
        })(jQuery);

      // Faixa de valor

        $('#filtrar').on('click', function(){
          carrega_bmms(1)
        })


    // formata valores vindos do banco
    function formatarValor(valor) {
      // Remove o 'R$ ' e converte para float
      const numero = parseFloat(valor.replace(',', '.'));

      // Formata o número para o formato de moeda desejado
      const valorFormatado = numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      return valorFormatado;
    }

    function formatarDataBmm(dataString) {
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
        return '-'
      }
    }

    function formatarCPFouCNPJ(valor) {
      // Remove qualquer coisa que não seja número
      valor = valor.replace(/\D/g, '');

      if (valor.length === 11) {
        // Formatar como CPF
        return valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      } else if (valor.length === 14) {
        // Formatar como CNPJ
        return valor.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
      } else {
        // Retorna o valor sem formatação se não for um CPF ou CNPJ válido
        return valor;
      }
    }

    $("#export_btn").on('click', function(){
      Swal.fire({
        title: 'Aguarde',
        text: 'Por favor, espere...',
        icon: 'info',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
            Swal.showLoading()
        }
    });
      let valores = $("#u-range-03").val()
      let val = valores.split(";");
      var data = {
          'periodo_inicial': $("#dt_inicio").val(),
          'periodo_final': $('#dt_fim').val(),
          'lead': $("#lead").val(),
          'campanha': $("#id_campanha").data('id'),
          'valores': val,
          'bmm_consulta': true,
          'status': $("#bm_status").val()
      }
      fetch(`/pt/api/bmm_boomerangue/gerar_excel/`, {  // Substitua pela URL da sua API
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrftoken,
          },
          body: JSON.stringify(data)
      }).then(response => {
          return response.blob();
      }).then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = 'boomarange_dados.xlsx';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
      }).catch(error => {
          new swal({
              text: "Ocorreu um erro ao tentar exportar dados!",
              icon: "error",
              buttonsStyling: false,
              confirmButtonText: "Ok",
              customClass: {
                  confirmButton: "btn btn-primary"
              }
          });
      })
      .finally(()=>{
        Swal.close()
      });
    }) 
  

    function gera_tabela_boomerangues(index){
      let rowsHTML = ''; // String para construir HTML
        console.log(index)
        // Verifica se index é um objeto único e não um array, e o converte para um array
        if (!Array.isArray(index)) {
          index = [index];
        }
      
        for(let i = 0; i < index.length; i++){
          let repique1 = ''
          let repique2 = ''
          let status = ''
          if(index[i].bm_status == 'S'){
            status = 'Enviado'
          }
          else if(index[i].bm_status == 'E'){
            status = 'Entregue'
          }
          else if(index[i].bm_status == 'O'){
            status = 'Autorizou'
          }
          else if(index[i].bm_status == 'Z'){
            status = 'Não Autorizou'
          }
          else if(index[i].bm_status == 'D'){
            status = 'Comprando/Doando'
          }
          else if(index[i].bm_status == 'X'){
            status = 'Doou'
          }
          else if(index[i].bm_status == 'C'){
            status = 'Comprou'
          }

          repique1 = index[i].bm_enviado_reforco1 == 'S' ? '<span class = "badge badge-success text-white">Sim</span>' : '<span class = "badge badge-danger text-white">Não</span>'
          repique2 = index[i].bm_enviado_reforco2 == 'S' ? '<span class = "badge badge-success text-white">Sim</span>' : '<span class = "badge badge-danger text-white">Não</span>'
          rowsHTML += `
            <tr>
                  <td>
                    <div class="media">
                      <div class="square-box me-2"><img class="img-fluid b-r-5"
                          src="/static/assets/images/dashboard/folder1.png" alt=""></div>
                      <div class="media-body ps-2">
                        <div class="avatar-details"><a href="/entidade_consulta/${index[i].entidade}">
                            <h6>${index[i].entidade_nome}</h6>
                          </a><span>${ index[i].entidade_cnpj ? formatarCPFouCNPJ(index[i].entidade_cnpj) : "-"}</span></div>
                      </div>
                    </div>
                  </td>
                  <td class="img-content-box">
                    <h6>${formatarValor(index[i].valor_atual)}</h6>
                  </td>
                  <td>
                    <h6>${index[i].campanhaNome}</h6>
                  </td>
                  <td>
                    <h6>${formatarDataBmm(index[i].data_aceite_bm)}</h6>
                  </td>
                  <td>
                    <h6>${index[i].telefone_bm}</h6>
                  </td>
                  <td>
                    <h6>${validate_telefone(index[i].telefone_valido)}</h6>
                  </td>
                  <td>
                    <h6>${index[i].bm_mensagem_status}</h6>
                  </td>
                  <td>
                    <h6>${status}</h6>
                  </td>
                  <td>
                    <h6>${repique1}</h6>
                  </td>
                  <td>
                    <h6>${repique2}</h6>
                  </td>
                  <td>
                    <a href="/boomerangue_consulta/${index[i].id}" class="btn btn-primary">Ver</a>
                  </td>
                </tr>
          `;
        }
        

        return rowsHTML; // Definir HTML de uma vez
    }


    function validate_telefone(index){
      if (index == 'nao_validado' || index == null){
        return '<span class="badge badge-warning text-white">Não Validado</span>'
      }
      if (index == 'validado'){
        return '<span class="badge badge-success text-white">Validado</span>'
      }
      else{
        return '<span class="badge badge-danger text-white">Rejeitado</span>'
      }
    }
    function updatePagination(count) {
      totalPages = Math.ceil(count / 25);
      const pagination = document.getElementById('pagination');
      
      // Remove existing page items except previous and next buttons
      while (pagination.children.length > 2) {
          pagination.removeChild(pagination.children[1]);
      }
      
      for (let i = 1; i <= totalPages; i++) {
          const li = document.createElement('li');
          li.className = 'page-item';
          if (i === currentPage) {
              li.classList.add('active');
          }
          const a = document.createElement('a');
          a.className = 'page-link';
          a.href = 'javascript:void(0)';
          a.textContent = i;
          a.addEventListener('click', () => loadPage(i));
          li.appendChild(a);
          pagination.insertBefore(li, document.getElementById('next-page'));
      }
      
      document.getElementById('previous-page').classList.toggle('disabled', currentPage === 1);
      document.getElementById('next-page').classList.toggle('disabled', currentPage === totalPages);
  }

    function loadPage(page) {
      currentPage = page;
      carrega_bmms(page);
  }

    function carrega_bmms(page){
      let tbody = document.getElementById('tbody-boomerangues');
      let loader = document.getElementById('loader');
      let cont = document.getElementById('cont');
      tbody.innerHTML = ''
      loader.style.display = 'block'
      cont.innerHTML = ''
      let valores = $("#u-range-03").val()
      console.log(valores)
      let val = valores.split(";");
      console.log('Valor', val)
      var data = {
        'periodo_inicial': $("#dt_inicio").val(),
        'periodo_final': $('#dt_fim').val(),
        'lead': $("#lead").val(),
        'campanha':$("#id_campanha").data('id'),
        'valores': val,
        'bmm_consulta':true,
        'status': $("#bm_status").val(),
        'telefone_status': $("#telefone_status").val(),
        'repique':$("#repique").val()
      }
      fetch(`/pt/api/bmm_boomerangue/filtragem/?page=${page}`, {  // Substitua pela URL da sua API
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify(data)
      }).then(res=>res.json())
      .then(data=>{
        if(data){
          console.log(data)
          tbody.innerHTML = gera_tabela_boomerangues(data.results)
          updatePagination(data.count)
          loader.style.display = 'none'
          cont.innerHTML = data.count

        }
        else{
          tbody.innerHTML='<tr><td>Não há dados</td></tr>'
          loader.style.display = 'none'
          cont.innerHTML = '0'
        }
      })
      .catch(error=>{
        new swal({
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

  document.getElementById('previous-page').addEventListener('click', () => {
    if (currentPage > 1) {
        loadPage(currentPage - 1);
      }
  });

  document.getElementById('next-page').addEventListener('click', () => {
      if (currentPage < totalPages) {
          loadPage(currentPage + 1);
      }
  });

  carrega_bmms(1)

  }

return {
  init: function() {
    init();
  }
};
}()

bmm.init()
