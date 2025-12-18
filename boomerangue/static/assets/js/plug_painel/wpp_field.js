"use strict";
  // Encontra o cookie que contém o csrftoken do Django
 let editar_wpp = false
 var url_wpp;
var method_wpp;
var wpp_field = function(){

    
    let btn_importa_csv;

    var init = function(){

        $("#save_wpp_field").on('click', function(){

            const data = new FormData();
            data.append("exibicao", $("#exibicao").val() || null);
            data.append("descricao", $("#descricao").val()|| null);
            data.append("tabela_origem", $("#tabela_origem").val()|| null);
            data.append("campo_origem", $("#campo_origem").val()|| null);
            data.append("tabela_vinculada", $("#tabela_vinculada").val()|| null);
            data.append("campo_vinculado", $("#campo_vinculado").val()|| null);
            data.append("campo_chave", $("#campo_chave").val()|| null)
            data.append("tabela_vinculada_2", $("#tabela_vinculada_2").val() || null);
            data.append("campo_vinculado_2", $("#campo_vinculado_2").val() || null);
            data.append("valor_filtragem", $("#valor_filtragem").val() || null)
            data.append("campo_chave_2", $("#campo_chave_2").val() || null)
            // Resto do código...
            fetch(url_wpp, {
                method: method_wpp,
                headers: {
                    'X-CSRFToken': csrftoken,
                },
                body: data,
            }).then((response) => response.json())
            .then((data) => {
                if(data.id){
                    new swal({
						icon: 'success',
						title: 'Salvo!',
						buttons: false,
						timer: 1500
					  }).then(
						window.location.reload()
					  )
                }
                else{
                new swal({
                    title: "Erro",
                    text: data.error, 
                    icon: "error",
                    button: "OK",
                });

                }
            })
            .catch(error=>{
                new swal({
                title: "Erro",
                text: "Houve um erro ao chamar API", 
                icon: "error",
                button: "OK",
                });
            })
        })


    }
    return {
        init: function() {
            // btn_importa_csv = document.getElementById('new_csv')
            init();
        }
    };
}()

wpp_field.init()



function new_wpp_field(){
    url_wpp = 'api/wpp_fields/';
    method_wpp = 'POST';
    editar_wpp = false
    $("#exibicao").val('');
    $("#descricao").val('');
    $("#tabela_origem").val('');
    $("#campo_origem").val('');
    $("#tabela_vinculada").val('');
    $("#campo_vinculado").val('');
    $("#campo_chave").val('');
    $("#tabela_vinculada_2").val('');
    $("#campo_vinculado_2").val('');
    $("#valor_filtragem").val('');
    $("#campo_chave_2").val('')
}


function editar_wpp_field(id){
    url_wpp = `api/wpp_fields/${id}/`;
    method_wpp = 'PATCH';
    editar_wpp = true
    fetch(`api/wpp_fields/${id}`, {
        method: 'GET',
        headers: {
            'X-CSRFToken': csrftoken,
        },
    }).then((response) => response.json())
    .then((data) => {
        if(data){
            $("#exibicao").val(data.exibicao);
            $("#descricao").val(data.descricao);
            $("#tabela_origem").val(data.tabela_origem);
            $("#campo_origem").val(data.campo_origem);
            $("#tabela_vinculada").val(data.tabela_vinculada);
            $("#campo_vinculado").val(data.campo_vinculado);
            $("#campo_chave").val(data.campo_chave);
            $("#tabela_vinculada_2").val(data.tabela_vinculada_2);
            $("#campo_vinculado_2").val(data.campo_vinculado_2);
            $("#valor_filtragem").val(data.valor_filtragem);
            $("#campo_chave_2").val(data.campo_chave_2)
        }
        else{
        new swal({
            title: "Erro",
            text: data.error, 
            icon: "error",
            button: "OK",
        });

        }
    })
    .catch(error=>{
        new swal({
        title: "Erro",
        text: "Houve um erro ao chamar API", 
        icon: "error",
        button: "OK",
        });
    })
}


function delete_wpp(id){

    Swal.fire({
        title: 'Tem certeza?',
        text: "Tem certeza que deseja excluir esse field?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Não, cancelar!'
      }).then((willDelete)=>{
            if(willDelete){
            fetch(`api/wpp_fields/${id}/`,{
                method:"DELETE",
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                    // Você pode adicionar cabeçalhos de autenticação, se necessário
                  },
            }).then(response=>{
                if (response.ok) {
                   new swal({
                        icon: 'success',
                        title: 'Excluido!',
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
                response.json()
            }).then(te=>{
                console.log(te)
            })
            .catch(error => {
                console.error('Erro ao enviar a solicitação:', error);
              });
            
        }
        })
}




