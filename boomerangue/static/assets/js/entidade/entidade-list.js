"use strict";
  // Encontra o cookie que contém o csrftoken do Django
  const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
  // Extrai o valor do csrftoken do cookie
  const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;
  
var entidade_list = function(){
    let tabela_scroll;
    let btn_importa_csv;
    let currentPage = 1;
    let totalPages = 1;
    var init = function(){


      
      Dropzone.options.csvImportarquivo = {
        paramName: "csvImportarquivo",
        maxFiles: 10,
        maxFilesize: 5,
        acceptedFiles: ".csv", // Aceitar apenas arquivos de imagem
        autoProcessQueue: false, // Desativar o envio automático
        init: function() {
            this.on("success", function(file, response) {
            // Lógica a ser executada após o upload bem-sucedido, se necessário
            console.log('response', response);
            });
          
        },
        addRemoveLinks: true
        };

        // salva arquivo
        btn_importa_csv.addEventListener("click", function (e) {
          Swal.fire({
            title: 'Aguarde...',
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            showConfirmButton: false,
            onOpen: () => {
              swal.showLoading();
            }
          });

          const data = new FormData();
          const dropzone = Dropzone.forElement("#csvImportarquivo");
          const queuedFiles = dropzone.getQueuedFiles();

          if (queuedFiles.length > 0) {
              queuedFiles.forEach((arquivo, index) => {
                  data.append(`Caminho_${index}`, arquivo);
                  data.append(`NomeArquivo_${index}`, arquivo.name);
              });
          data.append("statusarquivo_id", 'S');
          }
          else {
            Swal.fire({
              text: "Nenhum Arquivo Importado!",
              icon: "error",
              buttonsStyling: false,
              confirmButtonText: "Ok",
              customClass: {
                confirmButton: "btn btn-primary"
              }
            });
            return;
          }

          fetch(`api/historico_vendas_import/`, {
            method: "POST",
            headers: {
              'X-CSRFToken': csrftoken,
            },
            body: data,
          })
            .then((response) => {
              swal.close();
              console.log(response.json())
              if (response.ok) {
                new swal({
                  icon: 'success',
                  title: 'Arquivo Importado Com sucesso!',
                  showConfirmButton: false,
                  timer: 1500
                })
              } else {
                new swal({
                  text: "Ocorreu um erro ao tentar salvar",
                  icon: "error",
                  buttonsStyling: false,
                  confirmButtonText: "Ok",
                  customClass: {
                    confirmButton: "btn btn-primary"
                  }
                });
              }
              
            })
          });

        // Sistema de pesquisa
        (function ($) {
            var bestPictures = new Bloodhound({
              datumTokenizer: Bloodhound.tokenizers.obj.whitespace("value"),
              queryTokenizer: Bloodhound.tokenizers.whitespace,
              prefetch: "",
              remote: {
                url: `api/create-entidade/busca/?query=%QUERY`,
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
        // $("#u-range-03").ionRangeSlider({
        //   type: "double",
        //   grid: true,
        //   min: 0,
        //   max: 10000,
        //   from: 0, 
        //   to: 10000,
        //   prefix: "$"
        // })

		function ajusta_select_cidades(id) {
			let select = document.getElementById('cidade');
		
			// Limpa as opções anteriores antes de adicionar as novas
			select.innerHTML = '<option value="">Selecione uma cidade</option>';
		
			fetch('api/pegacidade/busca_cidades_estado/', {
				method: "POST",
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrftoken,
				},
				body: JSON.stringify({
					id: id
				})
			})
			.then((res) => res.json())
			.then(data => {
				console.log(data);
		
				// Verifica se a resposta contém a chave "cidades" com dados
				if (data.cidades && data.cidades.length > 0) {
					data.cidades.forEach(cidade => {
						// Adiciona cada cidade como uma opção no select
						select.innerHTML += `<option value="${cidade.pk}">${cidade.Cidade}</option>`;
					});
				} else {
					// Se não houver cidades, exibe uma opção de aviso
					select.innerHTML += '<option value="">Nenhuma cidade encontrada</option>';
				}
			})
			.catch(error => {
				console.error('Erro ao buscar cidades:', error);
				select.innerHTML = '<option value="">Erro ao carregar cidades</option>';
			});
		}

        
		$("#estado").on("change",function(e){
			ajusta_select_cidades(e.target.value)
		})


        $('#filtrar').on('click', function(){
          currentPage = 1
          carrega_itens(currentPage)
        })


        function formatarData(dataString) {

          // Criar um objeto Date a partir da string de data ISO (que está em UTC por padrão)
		
		  if (dataString === undefined || dataString === null) {
            return '-';
          }

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

          console.log(index)
          // Verifica se index é um objeto único e não um array, e o converte para um array
          if (!Array.isArray(index)) {
            index = [index];
          }


          console.log("length", index.length)

          for(let i = 0; i < index.length; i++){
            rowsHTML += `
            <tr>
            <td>
              <div class="media">
                <div class="square-box me-2"><img class="img-fluid b-r-5"
                    src="/static/assets/images/dashboard/folder1.png" alt=""></div>
                <div class="media-body ps-2">
                  <div class="avatar-details"><a href="/entidade_consulta/${index[i].id}">
                      <h6>${index[i].Entidade}</h6>
                    </a><span>${formatarCPFouCNPJ(index[i].CNPJNumerico)}</span></div>
                </div>
              </div>
            </td>
			<td class="img-content-box">
              <h6>${index[i].EDI_Integracao || '-'}</h6>
            </td>
            <td class="img-content-box">
              <h6>${index[i].Telefone1 || '-'}</h6>
            </td>
            <td>
              <h6>${index[i].Email_Comercial || '-'}</h6>
            </td>
            <td>
              <h6>${index[i].cidade_nome || '-'}-${index[i].uf_sigla || '-'}</h6>
            </td>
			<td>
              <h6>${index[i].Bairro || '-'}</h6>
            </td>
			<td>
              <h6>${index[i].tag_area || '-'}/${index[i].tag_regiao || '-'}</h6>
            </td>
			<td>
              <h6>${index[i].tag_tipo || '-'}</h6>
            </td>
            <td>
              <h6>${index[i].vendedorValidacao || '-'}</h6>
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

      function loadPage(page) {
        currentPage = page;
        carrega_itens(page);
    }

	function updatePagination(count) {
		const totalPages = Math.ceil(count / 20); // Total de páginas
		const pagination = document.getElementById('pagination');
	
		// Limpa itens de paginação, exceto botões "Anterior" e "Próximo"
		while (pagination.children.length > 2) {
			pagination.removeChild(pagination.children[1]);
		}
	
		const pageNumbers = [];
		if (totalPages <= 5) {
			for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
		} else {
			if (currentPage <= 3) {
				pageNumbers.push(1, 2, 3, 4, '...', totalPages);
			} else if (currentPage >= totalPages - 2) {
				pageNumbers.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
			} else {
				pageNumbers.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
			}
		}
	
		// Adiciona os números de páginas dinamicamente
		pageNumbers.forEach((page) => {
			const li = document.createElement('li');
			li.className = 'page-item';
			if (page === currentPage) {
				li.classList.add('active');
			}
			if (page === '...') {
				li.classList.add('disabled');
				li.innerHTML = `<span class="page-link">...</span>`;
			} else {
				const a = document.createElement('a');
				a.className = 'page-link';
				a.href = 'javascript:void(0)';
				a.textContent = page;
				a.addEventListener('click', () => loadPage(page));
				li.appendChild(a);
			}
			pagination.insertBefore(li, document.getElementById('next-page'));
		});
	
		// Atualiza os botões "Anterior" e "Próximo"
		document.getElementById('previous-page').classList.toggle('disabled', currentPage === 1);
		document.getElementById('next-page').classList.toggle('disabled', currentPage === totalPages);
	}
	
	// Eventos para os botões "Anterior" e "Próximo"
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
		console.log("buscando entidades")
        let tbody = document.getElementById('tbody');
        let loader = document.getElementById('loader');
        let cont = document.getElementById('cont');
        // let soma = document.getElementById('soma')
        tbody.innerHTML = ''
        loader.style.display = 'block'
        cont.innerHTML = ''
        var data = {
          'estado': $("#estado").val(),
          'cidade': $('#cidade').val(),
          'lead': $("#lead").val(),
        }
        fetch(`api/create-entidade/filtros/?page=${page}`, {  // Substitua pela URL da sua API
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
            // soma.innerHTML = formatarMoedaBrasil(data.results[0].total_somado.total)
            updatePagination(data.count)
          }
          else{
            tbody.innerHTML='<tr><td>Não há dados</td></tr>'
            loader.style.display = 'none'
            cont.innerHTML = '(0)'
            soma.innerHTML = 'R$ 0,00'
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

    // $("#export_btn").on('click', function(){
    //   Swal.fire({
    //     title: 'Aguarde',
    //     text: 'Por favor, espere...',
    //     icon: 'info',
    //     allowOutsideClick: false,
    //     showConfirmButton: false,
    //     willOpen: () => {
    //         Swal.showLoading()
    //     }
    // });
    //   let valores = $("#u-range-03").val()
    //   let val = valores.split(";");
    //   var data = {
    //       'periodo_inicial': $("#dt_inicio").val(),
    //       'periodo_final': $('#dt_fim').val(),
    //       'lead': $("#lead").val(),
    //       'campanha': $("#id_campanha").data('id'),
    //       'valores': val,
    //   }
    //   fetch(`api/pix_transaction/gerar_excel_historico/`, {  // Substitua pela URL da sua API
    //       method: 'POST',
    //       headers: {
    //           'Content-Type': 'application/json',
    //           'X-CSRFToken': csrftoken,
    //       },
    //       body: JSON.stringify(data)
    //   }).then(response => {
    //       return response.blob();
    //   }).then(blob => {
    //       const url = window.URL.createObjectURL(blob);
    //       const a = document.createElement('a');
    //       a.style.display = 'none';
    //       a.href = url;
    //       a.download = 'historico_doações_dados.xlsx';
    //       document.body.appendChild(a);
    //       a.click();
    //       window.URL.revokeObjectURL(url);
    //   }).catch(error => {
    //       new swal({
    //           text: "Ocorreu um erro ao tentar exportar dados!",
    //           icon: "error",
    //           buttonsStyling: false,
    //           confirmButtonText: "Ok",
    //           customClass: {
    //               confirmButton: "btn btn-primary"
    //           }
    //       });
    //   })
    //   .finally(()=>{
    //     Swal.close()
    //   });
    // }) 


    }
    return {
        init: function() {
            btn_importa_csv = document.getElementById('new_csv')
            tabela_scroll = document.getElementById('div_scroll')
            init();
        }
    };
}()

entidade_list.init()