"use strict";
  // Encontra o cookie que contém o csrftoken do Django
  const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
  // Extrai o valor do csrftoken do cookie
  const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;
  
var vagas = function(){
    let tabela_scroll;
    let btn_importa_csv;
    let currentPage = 1;
    let totalPages = 1;
    let editar_vaga = false;
    let id_vaga = 0;
    var init = function(){

        

        // Sistema de pesquisa
        (function ($) {
            var bestPictures = new Bloodhound({
              datumTokenizer: Bloodhound.tokenizers.obj.whitespace("value"),
              queryTokenizer: Bloodhound.tokenizers.whitespace,
              prefetch: "",
              remote: {
                url: `api/vagas/busca/?query=%QUERY`,
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
              name: "title",
              display: 'title',
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
        // $("#u-range-03").ionRangeSlider({
        //   type: "double",
        //   grid: true,
        //   min: 0,
        //   max: 10000,
        //   from: 0, 
        //   to: 10000,
        //   prefix: "$"
        // })

        // function ajusta_select_campanhas(){
        //   let select = document.getElementById('campanha')
        //   fetch('api/campanhas/')
        //   .then((res)=>res.json())
        //   .then(data=>{
        //     console.log(data)
        //     if(data.length > 0){
        //       for(let i = 0; i<data.length; i++){
        //         select.innerHTML += `<option value="${data[i].id}">${data[i].Campanha}</option>`
        //       }
        //     }
        //   })
        // }  

        // ajusta_select_campanhas()


        $('#filtrar').on('click', function(){
          currentPage = 1
          carrega_itens(currentPage)
        })


        function formatarData(dataString) {
          // Criar um objeto Date a partir da string de data ISO (que está em UTC por padrão)
          const data = new Date(dataString);
      
          // Opções de formatação no fuso horário do Brasil
          const opcoes = {
              timeZone: 'America/Sao_Paulo',  // Define o fuso horário
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
          };
      
          // Formatar a data diretamente no fuso horário do Brasil
          const dataFormatada = new Intl.DateTimeFormat('pt-BR', opcoes).format(data);
      
          return dataFormatada;
      }


        function formatarMoedaBrasil(valor) {
            return parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }


        function formatarCPFouCNPJ(valor) {
          // Verifica se valor é undefined ou null e retorna uma string vazia se for o caso
          if (valor === undefined || valor === null) {
            return '';
          }
        
          // Remove qualquer coisa que não seja número
          valor = valor.toString().replace(/\D/g, '');
        
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

        function gera_tabela(index){
          let rowsHTML = ''; // String para construir HTML
          // Verifica se index é um objeto único e não um array, e o converte para um array
          if (!Array.isArray(index)) {
            index = [index];
          }

          if(index.length>0){
            for(let i = 0; i < index.length; i++){
                let badge = index[i].jobstatus == 'A' ? '<span class = "badge badge-success text-white">Ativa</span>' : '<span class = "badge badge-danger text-white">Cancelada</span>';
                rowsHTML += `
                <tr>
                <td>
                <div class="media">
                    <div class="square-box me-2"><img class="img-fluid b-r-5"
                        src="/static/assets/images/dashboard/folder1.png" alt=""></div>
                    <div class="media-body ps-2">
                    <div class="avatar-details"><a href="#">
                        <h6>${index[i].title}</h6>
                        </a><span>${index[i].job_id}</span></div>
                    </div>
                </div>
                </td>
                <td>
                <h6 class="descricao" title="${index[i].description}">${index[i].description}</h6>
                </td>
                <td class="img-content-box">
                <h6>${badge}</h6>
                </td>
                <td>
                  <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown"
                        aria-haspopup="true" aria-expanded="false">Opções</button>
                  <div class="dropdown-menu">
                      <a class="dropdown-item"
                        href="javascript:void(0)" onclick="vagas.deleteVagas(${index[i].job_id})">Excluir</a>
                      <a class="dropdown-item"
                        href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#addvaga" onclick="vagas.editarVagas(${index[i].job_id})">Editar</a>
                  </div>
                </td>
            </tr>
                `
            }

          }
          else{
            rowsHTML = '<tr><td colspan="3" style="text-align: center;">Nenhum dado encontrado</td></tr>'
          }

          return rowsHTML
        }
        
      function contarTrs(tbodyId) {
          var tbody = tbodyId;
          var trs = tbody.getElementsByTagName('tr');
          return trs.length;
      }

      function loadPage(page) {
        currentPage = page;
        carrega_itens(page);
      }


      function updatePagination(count) {
        totalPages = Math.ceil(count / 10);
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

      let loading_history = false; // Flag para evitar solicitações simultâneas

      function carrega_itens(page){
        let tbody = document.getElementById('tbody');
        let loader = document.getElementById('loader');
        let cont = document.getElementById('cont');
        tbody.innerHTML = ''
        loader.style.display = 'block'
        cont.innerHTML = ''
        var data = {
            "jobstatus":$("#status_vagas").val(),
            "search-vagas": $("#search_vagas").val(),
        }
        fetch(`api/vagas/filtragem_vagas/?page=${page}`, {  // Substitua pela URL da sua API
          method: 'POST',
          headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken,
        },
          body: JSON.stringify(data)
        }).then(res=>res.json())
        .then(data=>{
          if(data){
            tbody.innerHTML = gera_tabela(data.results)
            loader.style.display = 'none'
            cont.innerHTML = `(${data.count})`
            updatePagination(data.count)
          }
          else{
            tbody.innerHTML='<tr><td>Não há dados</td></tr>'
            loader.style.display = 'none'
            cont.innerHTML = '(0)'
          }
        })
              .catch(error => {
                  console.error('Erro ao carregar mais logs:', error);
              }).finally(() => {
                  // Marcar que terminamos de carregar
                  loading_history = false;
                  loader.style.display = 'none';
              });
      }

    carrega_itens(1)


    // export excel

    $("#salvar_vaga").on("click", function(){
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
        let url = (editar_vaga) ? `api/vagas/${id_vaga}/`: "api/vagas/";
        let method = (editar_vaga) ? 'PATCH' : 'POST';
        let title = $("#title").val()
        let description = $("#description").val()
        let jobstatus = $("#jobstatus").val()
        if (title == ''){
            Swal.fire({
                text: "Preencha o campo vaga!",
                icon: "error",
                buttonsStyling: false,
                confirmButtonText: "Ok",
                customClass: {
                  confirmButton: "btn btn-primary"
                }
              });
              return
        }
        const data = new FormData()
        data.append('title', title)
        data.append('description', description)
        data.append('jobstatus', jobstatus)
        fetch(url,{
            method: method,
            headers: {
                // 'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: data
        })
        .then(response => response.json())
        .then(data => {
            console.log(data)
            if(data.job_id){
                Swal.fire({
                    text: "Salvo com sucesso!",
                    icon: "success",
                    buttonsStyling: false,
                    confirmButtonText: "Ok",
                    customClass: {
                        confirmButton: "btn btn-primary"
                    }
                });
                carrega_itens(1)
            }
            else{
                Swal.fire({
                    text: "Ocorreu um erro",
                    icon: "error",
                    buttonsStyling: false,
                    confirmButtonText: "Ok",
                    customClass: {
                      confirmButton: "btn btn-primary"
                    }
                  });
            }
        })
    })

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
    const exportType = $("#export_format").val().toLowerCase().trim();  // Remove espaços
    var data = {
        "jobstatus":$("#status_vagas").val(),
        "search-vagas": $("#search_vagas").val(),
        "export_type": exportType
    }
      fetch(`api/vagas/exportar_dados/`, {  // Substitua pela URL da sua API
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrftoken,
          },
          body: JSON.stringify(data)
      }).then(response => {
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
        
        return response.blob().then(blob => ({ 
            blob: new Blob([blob], { type: response.headers.get('Content-Type') }),
            filename: filename
        }));
      }).then(({ blob, filename }) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
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

    }

    function deleteVagas(id) {
      Swal.fire({
          title: 'Tem certeza?',
          text: "Tem certeza que deseja excluir essa Vaga?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sim, excluir!',
          cancelButtonText: 'Não, cancelar!'
      }).then((result) => { // Alterado para "result"
          if (result.isConfirmed) { // Verificação correta
              fetch(`api/vagas/${id}/`, {
                  method: "DELETE",
                  headers: {
                      'Content-Type': 'application/json',
                      'X-CSRFToken': csrftoken,
                  },
              }).then(response => {
                  if (response.status === 204) {
                      new Swal({
                          icon: 'success',
                          title: 'Vaga Excluida!',
                          buttons: false,
                          timer: 1500
                      }).then(() => {
                          carrega_itens(1);
                      });
                  } else {
                      new Swal({
                          title: "Erro",
                          text: "Houve um erro ao tentar excluir!",
                          icon: "error",
                          button: "OK",
                      });
                  }
              }).catch(error => {
                  console.error('Erro ao enviar a solicitação:', error);
              });
          }
      });
  }

    function editarVagas(id){
      editar_vaga = true
      id_vaga = id

      Swal.fire({
        title: 'Aguarde',
        text: 'Carregando dados',
        icon: 'info',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
            Swal.showLoading()
        }
    });

      fetch(`api/vagas/${id}/`)
      .then(response => response.json())
      .then(data => {
        console.log(data)
        $("#title").val(data.title)
        $("#description").val(data.description)
        $("#jobstatus").val(data.jobstatus).trigger('change')
      })
      .catch(error => {
        new Swal({
          title: "Erro",
          text: "Houve um erro!",
          icon: "error",
          button: "OK",
      });
      })
      .finally(()=>{
        Swal.close()
      })
    }

    function newVaga(){
      editar_vaga = false
      id_vaga = 0
      $("#title").val('')
      $("#description").val('')
      $("#jobstatus").val('').trigger('change')
    }
    return {
        init: function() {
            btn_importa_csv = document.getElementById('new_csv')
            tabela_scroll = document.getElementById('div_scroll')

            init();
        },
        deleteVagas: deleteVagas,
        editarVagas: editarVagas,
        newVaga: newVaga
    };
}()

vagas.init()