
let editar_campos = false;
let id_campos = 0;
let id_documento = '';

var campos = (function(){
    let tabela_scroll;
    let btn_importa_csv;
    let currentPage = 1;
    let totalPages = 1;
    let loading_history = false;
  
    // Função principal para carregar os itens
    function carrega_itens(page){
        let tbody = document.getElementById('tbody-campos');
        let loader = document.getElementById('loader-campos');
        tbody.innerHTML = '';
        loader.style.display = 'block';
        
        fetch(`api/campos/filtragem_campos/?page=${page}&doc=${id_documento}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({})
        })
        .then(res => res.json())
        .then(data => {
            if(data){
                tbody.innerHTML = gera_tabela(data.results);
                loader.style.display = 'none';
                updatePagination(data.count);
            } else {
                tbody.innerHTML = '<tr><td>Não há dados</td></tr>';
                loader.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            loader.style.display = 'none';
        });
    }
  
    // Função para gerar a tabela HTML
    function gera_tabela(index){
        let rowsHTML = '';
        if (!Array.isArray(index)) index = [index];
  
        if(index.length > 0){
            for(let i = 0; i < index.length; i++){
                rowsHTML += `
                <tr>
                    <td>
                        <div class="media">
                            <div class="square-box me-2">
                                <img class="img-fluid b-r-5" src="" alt="">
                            </div>
                            <div class="media-body ps-2">
                                <div class="avatar-details">
                                    <a href="javascript:void(0)">
                                        <h6>${index[i].fieldsearch}</h6>
                                    </a>
                                    <span>${index[i].document_types_field_id}</span>
                                </div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <h6>${index[i].fieldobg}</h6>
                    </td>
                    <td>
                        <h6>${index[i].fieldorder}</h6>
                    </td>
                    <td>
                        <h6>${index[i].tokenged_tipodoc}</h6>
                    </td>
                    <td>
                        <button class="btn btn-primary dropdown-toggle" type="button" 
                            data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            Opções
                        </button>
                        <div class="dropdown-menu">
                            <a class="dropdown-item" href="javascript:void(0)" 
                                onclick="campos.deletecampos(${index[i].document_types_field_id})">
                                Excluir
                            </a>
                            <a class="dropdown-item" href="javascript:void(0)" 
                                data-bs-toggle="modal" data-bs-target="#addcampos" 
                                onclick="campos.editarcampos(${index[i].document_types_field_id})">
                                Editar
                            </a>
                        </div>
                    </td>
                </tr>`;
            }
        } else {
            rowsHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum dado encontrado</td></tr>';
        }
        return rowsHTML;
    }
  
    // Função de paginação
    function updatePagination(count) {
        totalPages = Math.ceil(count / 5);
        const pagination = document.getElementById('pagination-campos');
        
        while (pagination.children.length > 2) {
            pagination.removeChild(pagination.children[1]);
        }
        
        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.className = 'page-item' + (i === currentPage ? ' active' : '');
            const a = document.createElement('a');
            a.className = 'page-link';
            a.href = 'javascript:void(0)';
            a.textContent = i;
            a.addEventListener('click', () => loadPage(i));
            li.appendChild(a);
            pagination.insertBefore(li, document.getElementById('next-page-campos'));
        }
        
        document.getElementById('previous-page-campos').classList.toggle('disabled', currentPage === 1);
        document.getElementById('next-page-campos').classList.toggle('disabled', currentPage === totalPages);
    }
  
    // Função para carregar página específica
    function loadPage(page) {
        currentPage = page;
        carrega_itens(page);
    }
  
    // Função de inicialização
    function init(){
        // Configuração do typeahead
        // (function ($) {
        //     var bestPictures = new Bloodhound({
        //       datumTokenizer: Bloodhound.tokenizers.obj.whitespace("value"),
        //       queryTokenizer: Bloodhound.tokenizers.whitespace,
        //       prefetch: "",
        //       remote: {
        //         url: `api/campos/busca/?query=%QUERY`,
        //         wildcard: "%QUERY",
        //         filter: function (response) {
        //           return response; // Assumindo que a API retorna a lista diretamente
        //         }
        //       }
        //     });
          
        //     $(".faq-form .typeahead").on('typeahead:asyncrequest', function () {
        //       // Mostrar indicador de carregamento
        //       $(".loading-indicator-itens").show();
        //     });
          
        //     $(".faq-form .typeahead").on('typeahead:asyncreceive', function () {
        //       // Esconder indicador de carregamento
        //       $(".loading-indicator-itens").hide();
        //     });
          
        //     $(".faq-form .typeahead").typeahead(null, {
        //       name: "candidate",
        //       display: 'candidate',
        //       limit: 15,
        //       source: bestPictures
        //     })
          
        //     $(".faq-form .typeahead").on('input', function() {
        //       if ($(this).val() === '') {
        //         $(".loading-indicator-itens").hide();
        //       }
        //     })
        //   })(jQuery);
  
        // Eventos
        $('#filtrar').on('click', () => {
            currentPage = 1;
            carrega_itens(currentPage);
        });
  
        document.getElementById('previous-page-campos').addEventListener('click', () => {
            if (currentPage > 1) loadPage(currentPage - 1);
        });
  
        document.getElementById('next-page-campos').addEventListener('click', () => {
            if (currentPage < totalPages) loadPage(currentPage + 1);
        });
  
        // Evento de salvar
        $("#salvar_campos").on("click", async function() { // Adicione async aqui
            // Mostra o loading imediatamente
        
            try {
                // Aguarda a conclusão da função save_doctype()
                await tipos_documento.save_doctype(); // Adicione await aqui
                Swal.fire({
                    title: 'Aguarde',
                    text: 'Salvando campos',
                    icon: 'info',
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    willOpen: () => Swal.showLoading()
                });
                // Verifica o ID após a conclusão do save_doctype()
                if (id_documento === '') {
                    Swal.fire({
                        text: 'Salve primeiro o tipo de documento!',
                        icon: "error",
                        confirmButtonText: "Ok",
                        customClass: { confirmButton: "btn btn-primary" }
                    });
                    return;
                }
        
                // Resto do código (fetch, validações, etc)
                const url = editar_campos ? `api/campos/${id_campos}/` : "api/campos/";
                const method = editar_campos ? 'PATCH' : 'POST';
                const fieldsearch = $("#fieldsearch").val();
                const fieldobg = $("#fieldobg").val();
                const fieldorder = $("#fieldorder").val();
                const tokenfield = $("#tokenfield").val();
                const tokenged_tipodoc = $("#tokenged_tipodoc").val();
                const document_type = id_documento;
        
                if (!fieldsearch || !fieldorder) {
                    Swal.fire({
                        text: 'Preencha todos os campos obrigatórios: Campo e Campo de Ordem!',
                        icon: "error",
                        confirmButtonText: "Ok",
                        customClass: { confirmButton: "btn btn-primary" }
                    });
                    return;
                }
        
                const formData = new FormData();
                formData.append('fieldsearch', fieldsearch);
                formData.append('fieldobg', fieldobg);
                formData.append('fieldorder', fieldorder);
                formData.append('tokenfield', tokenfield);
                formData.append('tokenged_tipodoc', tokenged_tipodoc);
                formData.append('document_type', document_type);
        
                // Executa o fetch e aguarda a resposta
                const response = await fetch(url, {
                    method: method,
                    headers: { 'X-CSRFToken': csrftoken },
                    body: formData
                });
                const data = await response.json();
        
                if (data.document_types_field_id) {
                    Swal.fire({
                        text: "Salvo com sucesso!",
                        icon: "success",
                        confirmButtonText: "Ok",
                        customClass: { confirmButton: "btn btn-primary" }
                    });
                    campos.carrega_itens(1);
                } else {
                    Swal.fire({
                        text: "Ocorreu um erro",
                        icon: "error",
                        confirmButtonText: "Ok",
                        customClass: { confirmButton: "btn btn-primary" }
                    });
                }
            } catch (error) {
                Swal.fire({
                    text: 'Erro durante o processo: ' + error.message,
                    icon: "error",
                    confirmButtonText: "Ok",
                    customClass: { confirmButton: "btn btn-primary" }
                });
            } finally {
                Swal.close();
            }
        });
  
  
        // Carregar dados iniciais
        // carrega_itens(1);
    }
  
    // Função de exclusão
    function deletecampos(id) {
        Swal.fire({
            title: 'Tem certeza?',
            text: "Esta ação não pode ser revertida!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim, excluir!'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`api/campos/${id}/`, {
                    method: "DELETE",
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken,
                    },
                })
                .then(response => {
                    if (response.status === 204) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Excluído!',
                            showConfirmButton: false,
                            timer: 1500
                        });
                        campos.carrega_itens(1);
                    } else {
                        Swal.fire('Erro!', 'Falha na exclusão', 'error');
                    }
                })
                .catch(error => console.error('Erro:', error));
            }
        });
    }
  
    // Função de edição
    function editarcampos(id){
        editar_campos = true;
        id_campos = id;
        Swal.fire({
            title: 'Carregando...',
            showConfirmButton: false,
            willOpen: () => Swal.showLoading()
        });
  
        fetch(`api/campos/${id}/`)
            .then(response => response.json())
            .then(data => {
            $("#fieldsearch").val(data.fieldsearch);
            $("#fieldobg").val(data.fieldobg).trigger('change');
            $("#fieldorder").val(data.fieldorder)
            $("#tokenfield").val(data.tokenfield)
            $("#tokenged_tipodoc").val(data.tokenged_tipodoc)
            })
            .catch(() => Swal.fire('Erro!', 'Falha ao carregar dados', 'error'))
            .finally(() => Swal.close());
    }
  
        $("#novo_campo").on('click', function(){
            editar_campos = false;
            id_campos = 0;
            $("#fieldsearch").val('');
            $("#fieldobg").val('N').trigger('change');
            $("#fieldorder").val('')
            $("#tokenfield").val('')
            $("#tokenged_tipodoc").val('')
        })
  
    return {
        init: init,
        deletecampos: deletecampos,
        editarcampos: editarcampos,
        carrega_itens: carrega_itens
    };
  })();
  
  campos.init();