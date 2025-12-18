"use strict";
// Encontra o cookie que contém o csrftoken do Django
const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
// Extrai o valor do csrftoken do cookie
const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;

var method = '';
var url = '';

var grupo_produto = function(){

    
    var forms;
    var init = function(){

        function testAnim(x) {
            $('.modal .modal-dialog').attr('class', 'modal-dialog modal-lg ' + x + '  animated');
        };

        $('#exampleModal').on('show.bs.modal', function (e) {
            var anim = 'fadeIn';
            testAnim(anim);
        });

        var validation = Array.prototype.filter.call(forms, function(form) {
            form.addEventListener('submit', function(event) {
                if (form.checkValidity() === false) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                else{
                    event.preventDefault();
                    event.stopPropagation();
                    fetchApi();

                }
                form.classList.add('was-validated');
            }, false);
        });

        function fetchApi (){
            
            const data = {
                GrupoProdutos: $("#GrupoProdutos").val() || '',
                OrdemGrupoProdutos:$("#OrdemGrupoProdutos").val() || null,
                grupoAtivo:$("#grupoAtivo").val() || '',
                // Outros campos e valores aqui...
              };
              fetch(url,{
                method: method,
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                    'X-CSRFToken': csrftoken,
                },
                body: JSON.stringify(data),
              }).then((response) => response.json())
              .then((data) => {
                console.log(data)
                if(data.id){
                    Swal.fire({
                        icon: 'success',
                        title: 'Salvo com sucesso!',
                        showConfirmButton: false,
                        timer: 1500
                      }).then((result)=>{
                        if(result){
                            window.location.reload();
                        }
                      })

                      
                }
                else{
                    Swal.fire({
                        text: "Ocorreu um erro ao tentar salvar" ,
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

    }
    return {
        init: function() {
            forms = document.getElementsByClassName('needs-validation');
            init();
        }
    };
}()

grupo_produto.init()

function delete_grupo(id){
    new swal({
        title: "Tem certeza?",
        text: "Tem certeza que deseja excluir esse grupo?",
        icon: "warning",
        showCancelButton: true,  // Mostrar botão "Cancelar"
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim',
        cancelButtonText: 'Não',
        }).then((result)=>{
          if(result.isConfirmed){
          fetch(`api/ger_grupoprodutos/${id}/`,{
            method:"DELETE",
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrftoken,
              },
          }).then(response=>{
            if (response.status === 204) {
              new swal({
                icon: 'success',
                title: 'Excluído!',
                buttons: false,
                timer: 1500
                }).then(
                  window.location.reload()
                )
              }
              else {
              new swal({
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
      })
}

function newcat(){
    method = 'POST';
    url = 'api/ger_grupoprodutos/'
    $("#GrupoProdutos").val('')
    $("#grupoAtivo").val('S').trigger('change');
    $("#OrdemGrupoProdutos").val('')
}

function editar_grupo(id){
    method = 'PATCH';
    url = `api/ger_grupoprodutos/${id}/`;

    fetch(`api/ger_grupoprodutos/${id}/`,{
        method:"GET",
        headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrftoken,
        },
    }).then((res)=>res.json())
    .then((res)=>{
        if(res.id){
            console.log(res)
            $("#GrupoProdutos").val(res.GrupoProdutos)
            $("#grupoAtivo").val(res.grupoAtivo).trigger('change')
            $("#OrdemGrupoProdutos").val(res.OrdemGrupoProdutos)
        }
        else{
            new swal({
                title: "Erro",
                text: "Houve um erro ao tentar buscar dados!",
                icon: "error",
                button: "OK",
                });
        }
    })
}

function formatDate(data) {
    const date = new Date(data);
    const day = date.getDate();
    const month = date.getMonth() + 1; // Os meses em JavaScript começam em 0
    const year = date.getFullYear();
  
    // Formate os valores para dois dígitos (ex: 01, 02, 03)
    const formattedDay = String(day).padStart(2, '0');
    const formattedMonth = String(month).padStart(2, '0');
  
    return `${formattedDay}/${formattedMonth}/${year}`;
  }

let page = 2;  // Comece na segunda página, pois a primeira já foi carregada
const table = document.getElementById('item-table');
let loading = false; // Flag para evitar solicitações simultâneas
let loader = document.getElementById("loader");
    function loadMoreItems() {
        loader.style.display = 'block';
        if (loading){
            loader.style.display = 'none';
            return; // Evitar solicitações simultâneas
        }

        // loader.style.display = 'none'
        // Marcar que estamos carregando itens
        loading = true;
        fetch(`load-more-items/?page=${page}`)
            .then(response => response.json())
            .then(data => {
                console.log(data)
                const items = data.items;
                if (items.length > 0) {
                    const tbody = table.querySelector('tbody');
                    items.forEach(itemData => {
                        const row = document.createElement('tr');
                        var data_cadastro = formatDate(itemData.data)
                        row.innerHTML = `<td>
                        <div class="media">
                          <div class="square-box me-2"><img class="img-fluid b-r-5"
                              src="/boomerangue/static/assets/images/produtos_group.jpg" alt=""></div>
                          <div class="media-body ps-2">
                            <div class="avatar-details"><a href="#">
                                <h6>${itemData.nome}</h6>
                              </a><span>${itemData.pk}</span></div>
                          </div>
                        </div>
                      </td>
                      <td class="img-content-box">
                          <span class="badge ${itemData.ativo == 'S'? 'badge-success':'badge-danger'} text-white">${itemData.ativo == 'S'? 'Ativo':'Inativo'}</span>
                      </td>
                      <td>
                        <h6>${itemData.ordem}</h6>
                      </td>
                      <td>
                        <h6>${data_cadastro}</h6>
                      </td>
                      <td>
                            <div>
                                <a href="#" data-bs-toggle="modal" data-bs-target="#exampleModal" onclick="editar_grupo(${itemData.pk})"><i data-feather="edit-2"></i></a>
                                <a href="#" class="ms-2" onclick="delete_grupo(${itemData.pk})"><i data-feather="trash-2"></i></a>
                            </div>
                       </td>`;
                      

                        tbody.appendChild(row);
                        feather.replace();
                    });
                    page++;
                }
            })
            .catch(error => {
                console.error('Erro ao carregar mais itens:', error);
            }).finally(() => {
                // Marcar que terminamos de carregar
                loading = false;
                loader.style.display = 'none';
            });
    }

    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
            loadMoreItems();
        }
    });