"use strict";
var permissoes = function(){
   
    let btn_importa_csv;

    var init = function(){


        

        $('#salvar_permissoes_grupo').click(function() {
            let lista = []
            new swal({
                title: "Aguarde!",
                text: "Sua solicitação está sendo processada...",
                icon: "info",
                buttons: false,
            });
            $('input[type=checkbox]:checked').each(function() {
                lista.push($(this).attr('id'))
            });

            fetch('api/tipoempresapermissao/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                },
                body: JSON.stringify({ids: lista, grupo: id_temp}),
            })
            .then(response => response.json())
            .then(data => {
                if(data.message){
                    new swal({
                        icon: 'success',
                        title: 'Salvo!',
                        buttons: false,
                        timer: 1500
                    })
                }
                else{
                    new swal({
                        title: "Erro",
                        text: "Houve um erro", 
                        icon: "error",
                        button: "OK",
                    });
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        });




    }
    return {
        init: function() {
            // btn_importa_csv = document.getElementById('new_csv')
            init();
        }
    };
}()

permissoes.init()

let id_temp
function permissao(id){
    $('input[type=checkbox]:checked').each(function() {
        $(this).prop('checked', false)
    });
    id_temp = id
    new swal({
        title: "Aguarde!",
        text: "Sua solicitação está sendo processada...",
        icon: "info",
        buttons: false,
    });
    fetch(`api/tipoempresapermissao/${id}/`)
    .then(response => response.json())
    .then(data => {
        if(data.length > 0){
            for(var i = 0; i< data.length; i++){
                document.getElementById(data[i].nome_permissao).checked = true
            }
        }
    })
    .catch((error) => {
        new swal({
            title: "Erro",
            text: "Houve um erro ao chamar API", 
            icon: "error",
            button: "OK",
        });
    })
    .finally(()=>{
        swal.close()
    })

}
