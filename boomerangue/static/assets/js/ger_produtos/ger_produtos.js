"use strict";
var campaign = function(){

    
    var form_create;

    var detalhes_buttons;
    var modal_detalhes_produto;

    var editar_buttons;
    var modal_editar_produto;
    var form_edit;

    var deletar_buttons;

    let currentPage = 1

    var init = function(){
 
        // Encontra o cookie que contém o csrftoken do Django
        const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
        // Extrai o valor do csrftoken do cookie
        const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;

        function salvarProduto(form, method, id_produto='') {
            form.classList.add('was-validated');

            if (!form.checkValidity()) {
                Swal.fire({
                    text: "Houve um erro, verifique os campos digitados",
                    icon: "error",
                    buttonsStyling: false,
                    confirmButtonText: "Ok",
                    customClass: {
                        confirmButton: "btn btn-primary"
                    }
                });
            }
            else {
                Swal.fire({
                    text: "Todas as informações foram validadas corretamente! Clique em salvar para prosseguir",
                    icon: "success",
                    buttonsStyling: false,
                    confirmButtonText: "Salvar",
                    customClass: {
                        confirmButton: "btn btn-primary"
                    }
                }).then(function (result) {
                    if (result.isConfirmed) {
                        const formData = new FormData(form);
                        const jsonObject = Object.fromEntries(formData);
                    
                        fetch('api/ger_produtos/' + id_produto, {
                            method: method,
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': csrftoken,
                            },
                            body: JSON.stringify(jsonObject)
                        })
                        .then(res => res.json())
                        .then(data => {
                            console.log(data);
                            if(data["sucesso"] || data["statusregistro_id"]) {
                                Swal.fire({
                                    title: 'Produto salvo com sucesso.',
                                    icon: 'success',
                                    showConfirmButton: false
                                });
                                window.location.reload();
                            } else {
                                Swal.fire({
                                    title: 'Ocorreu um erro ao salvar o produto.',
                                    text: data["erro"],
                                    icon: 'error',
                                    confirmButtonText: 'Entendi',
                                    confirmButtonColor: '#f27474'
                                });
                                if (data["erros_serializer"]) {
                                    console.log(data["erros_serializer"]);
                                }
                            }
                        })
                    }
                });
            }
        }

        form_create.addEventListener('submit', function (event) {
            event.preventDefault();
            salvarProduto(form_create, "POST")
        });

        function preencher_modal(id_produto, modal) {
            fetch(`api/ger_produtos/${id_produto}/`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
            })
            .then(res => res.json())
            .then(data => {
                modal.querySelectorAll('input, select').forEach(input => {
                    if (input.dataset.tipo == "check") {
                        if (data[input.name] == 'S') {
                            input.value = "Sim";
                        }
                        else {
                            input.value = "Não";
                        }
                    }
                    else if (input.dataset.tipo == "check_edit") {
                        if (data[input.name] == input.value) {
                            input.checked = true;
                        }
                    }
                    else{
                        input.value = data[input.name]
                    }
                })
            })
        }

        detalhes_buttons.forEach(botao => {
            botao.addEventListener('click', e => {
                preencher_modal(botao.dataset.id, modal_detalhes_produto);
            })
        })

        editar_buttons.forEach(botao => {
            botao.addEventListener('click', e => {
                preencher_modal(botao.dataset.id, modal_editar_produto);
                form_edit.dataset.id = botao.dataset.id;
            })
        })

        form_edit.addEventListener('submit', function (event) {
            event.preventDefault();
            salvarProduto(form_edit, "PATCH", form_edit.dataset.id + '/')
        });

        deletar_buttons.forEach(botao => {
            botao.addEventListener('click', e => {
                Swal.fire({
                    title: 'Tem certeza que deseja excluir esse produto?',
                    icon: 'info',
                    showConfirmButton: true,
                    showCancelButton: true,
                    confirmButtonText: 'Sim',
                    cancelButtonText: 'Não',
                    confirmButtonColor: '#f27474',
                    cancelButtonColor: '#6c757d'
                })
                .then(response => {
                    if (response.isConfirmed) {
                        fetch(`api/ger_produtos/${botao.dataset.id}/`, {
                            method: 'DELETE',
                            headers: {
                                'Accept': 'application/json',
                                'X-CSRFToken': csrftoken,
                            },
                        })
                        .then(res => {
                            if (res.status == 204) {
                                Swal.fire({
                                    title: 'Produto deletado com sucesso!',
                                    text: 'Atualizando a página',
                                    icon: 'success',
                                    showConfirmButton: false
                                });
                                window.location.reload();
                            }
                            else {
                                Swal.fire({
                                    title: 'Ocorreu um erro ao deletar o produto.',
                                    icon: 'error',
                                    confirmButtonText: 'Entendi',
                                    confirmButtonColor: '#f27474'
                                });
                            }
                        })
                    }
                })
                
            });
        })

        editar_buttons.forEach(botao => {
            botao.addEventListener('click', e => {
                preencher_modal(botao.dataset.id, modal_editar_produto);
                form_edit.dataset.id = botao.dataset.id;
            })
        })

        form_edit.addEventListener('submit', function (event) {
            event.preventDefault();
            salvarProduto(form_edit, "PATCH", form_edit.dataset.id + '/')
        });

        deletar_buttons.forEach(botao => {
            botao.addEventListener('click', e => {
                Swal.fire({
                    title: 'Tem certeza que deseja excluir esse produto?',
                    icon: 'info',
                    showConfirmButton: true,
                    showCancelButton: true,
                    confirmButtonText: 'Sim',
                    cancelButtonText: 'Não',
                    confirmButtonColor: '#f27474',
                    cancelButtonColor: '#6c757d'
                })
                .then(response => {
                    if (response.isConfirmed) {
                        fetch(`api/ger_produtos/${botao.dataset.id}/`, {
                            method: 'DELETE',
                            headers: {
                                'Accept': 'application/json',
                                'X-CSRFToken': csrftoken,
                            },
                        })
                        .then(res => {
                            if (res.status == 204) {
                                Swal.fire({
                                    title: 'Produto deletado com sucesso!',
                                    text: 'Atualizando a página',
                                    icon: 'success',
                                    showConfirmButton: false
                                });
                                window.location.reload();
                            }
                            else {
                                Swal.fire({
                                    title: 'Ocorreu um erro ao deletar o produto.',
                                    icon: 'error',
                                    confirmButtonText: 'Entendi',
                                    confirmButtonColor: '#f27474'
                                });
                            }
                        })
                    }
                })
                
            });
        })

        function carrega_produtos(page){
            let tb = document.getElementById('tb-produtos')
            let loader = document.getElementById('loader')
            loader.style.display='block'
            tb.innerHTML=''
            fetch(`api/ger_produtos/get_produtos/?page=${page}`,{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                },
                body: JSON.stringify({
                    desc: $("#product_desc").val() 
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log(data)
                if(data.count>0){
                    tb.innerHTML = gera_tabela(data.results)
                    updatePagination(data.count)
                }
            })
            .catch(error => console.error('Error:', error))
            .finally(() => {
                loader.style.display='none'
            })
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
                          <td style="width: 200px;">
                            <img class="img-fluid" style="max-width: 168px;" src="${index[i].PathProduto ? index[i].PathProduto : '/static/assets/images/banner/Produto-sem-foto.png'}" alt="${index[i].Descricao}">
                          </td>
                          <td>
                            <a href="#">
                              <h4>${index[i].Descricao}</h4>
                            </a>
                            <p>${index[i].Codigo || '-'}</p>
                            <p>SKU: ${index[i].SKU || '-'}</p>
                            <p>Linha: ${index[i].linha || '-'}</p>
                          </td>
                          <td>
                            <ul class="opts">
                              <li><a data-bs-toggle="modal" data-bs-target="#editProdutoModal" id="editar_produto" data-id="${index[i].id}" href="#"><i class="icon-pencil"></i></a></li>
                              <li><a href="#" data-id="${index[i].id}" id="deletar_produto"><i class="icon-trash"></i></a></li>
                              <li><a href="#" data-bs-toggle="modal" data-bs-target="#detalhes_produto" id="botao_detalhes" data-id="${index[i].id}"><i class="icon-eye"></i></a>
                              </li>
                            </ul>
                          </td>
                      </tr>
                  `
      
                }
      
                return rowsHTML
        }
        function loadPage(page) {
            currentPage = page;
            carrega_produtos(page);
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

        carrega_produtos(currentPage)

        
        function teste() {
            if (typeof Bloodhound === 'undefined' || !$.fn.typeahead) {
                console.error('Bloodhound ou Typeahead não estão carregados');
                return;
            }
        
            var bestPictures = new Bloodhound({
                datumTokenizer: Bloodhound.tokenizers.obj.whitespace("Descricao"),
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                remote: {
                    url: `api/ger_produtos/busca/?query=%QUERY&limit=15`,
                    wildcard: "%QUERY",
                    filter: function (response) {
                        if (response.length === 0) {
                            showNoResultsCard();
                        }
                        return response.results || response;
                    }
                }
            });
        
            $(".faq-form .typeahead").on('typeahead:asyncrequest', function () {
                showLoadingCard();
            });
        
            $(".faq-form .typeahead").on('typeahead:asyncreceive', function (event, suggestions) {
                console.log("Sugestões recebidas da API:", suggestions);
            });
        
            $(".faq-form .typeahead").typeahead(
                {
                    hint: false,  // Desativa o preenchimento automático
                    highlight: true,  // Destaca as correspondências
                    minLength: 1
                },
                {
                    name: "Descricao",
                    display: "Descricao",
                    limit: 15,
                    source: bestPictures,
                    templates: {
                        suggestion: function (data) {
        
                            return `
                                <a href="#" class="list-group-item list-group-item-action d-flex align-items-center py-3 px-4 border-0 rounded-3 shadow-sm mb-2 hover-bg-primary hover-text-white" data-descricao="${data.Descricao}">
                                    <div class="d-flex flex-column w-100">
                                        <strong class="text-primary">${data.Descricao}</strong>
                                        <small class="text-muted">${data.Descricao_Longa || 'Sem descrição longa disponível.'}</small>
                                    </div>
                                    <i class="fa fa-arrow-right ms-3 text-muted"></i>
                                </a>
                            `;
                        }
                    }
                }
            );
        
            $(".faq-form .typeahead").on('input', function () {
                if ($(this).val() === '') {
                    carrega_produtos(1);
                    $("#search-results").html('');
                }
            });
        
            $(".faq-form .typeahead").on('typeahead:select', function (event, suggestion) {
                console.log("Valor selecionado:", suggestion);
                $("#search-results").html('');
                carrega_produtos(1);
            });
        
            // Função para exibir o card de "Nenhum Resultado Encontrado"
            function showNoResultsCard() {
                const cardHtml = `
                    <div class="card text-center border-warning">
                        <div class="card-body">
                            <h5 class="card-title text-warning">Nenhum Resultado Encontrado</h5>
                            <p class="card-text">Não encontramos resultados para sua pesquisa.</p>
                        </div>
                    </div>
                `;
                $("#search-results").html(cardHtml);
            }
        
            // Função para exibir o card de "Carregando"
            function showLoadingCard() {
                const cardHtml = `
                    <div class="card text-center border-primary">
                        <div class="card-body">
                            <h5 class="card-title text-primary">Carregando...</h5>
                            <p class="card-text"><i class="fa fa-spin fa-spinner"></i> Estamos buscando resultados para sua pesquisa.</p>
                        </div>
                    </div>
                `;
                $("#search-results").html(cardHtml);
            }
        }
        
        teste();

    }
    return {
        init: function() {
            form_create = document.getElementById("create_form");

            detalhes_buttons = document.querySelectorAll('#botao_detalhes');
            modal_detalhes_produto = document.querySelector('#detalhes_produto');

            editar_buttons = document.querySelectorAll('#editar_produto');
            modal_editar_produto = document.querySelector('#editProdutoModal');
            form_edit = document.querySelector('#edit_form');

            deletar_buttons = document.querySelectorAll('#deletar_produto');

            init();
        }
    };
}()

campaign.init()
