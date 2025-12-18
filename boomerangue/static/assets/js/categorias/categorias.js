"use strict";
// Encontra o cookie que contém o csrftoken do Django
const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
// Extrai o valor do csrftoken do cookie
const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;

var method = '';
var url = '';

var categorias = function(){

    var forms;
    var init = function(){

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
                Categoria: $("#Categoria").val() || '',
                TipoCategoria:$("#TipoCategoria").val() || '',
                CategoriaDescricao:$("#CategoriaDescricao").val() || '',
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

categorias.init()

function delete_categoria(id){
    new swal({
        title: "Tem certeza?",
        text: "Tem certeza que deseja excluir essa categoria?",
        icon: "warning",
        showCancelButton: true,  // Mostrar botão "Cancelar"
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim',
        cancelButtonText: 'Não',
        }).then((result)=>{
          if(result.isConfirmed){
          fetch(`api/ger_categorias/${id}/`,{
            method:"DELETE",
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrftoken,
              },
          }).then(response=>{
            if (response.status === 204) {
              new swal({
                icon: 'success',
                title: 'Categoria Excluída!',
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
    url = 'api/ger_categorias/'
    $("#Categoria").val('');
    $("#TipoCategoria").val('N').trigger('change');
    $("#CategoriaDescricao").val('');
}

function editar_categoria(id){
    method = 'PATCH';
    url = `api/ger_categorias/${id}/`;

    fetch(`api/ger_categorias/${id}/`,{
        method:"GET",
        headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrftoken,
        },
    }).then((res)=>res.json())
    .then((res)=>{
        if(res.id){
            console.log(res)
            $("#Categoria").val(res.Categoria)
            $("#TipoCategoria").val(res.TipoCategoria).trigger('change')
            $("#CategoriaDescricao").val(res.CategoriaDescricao)
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
