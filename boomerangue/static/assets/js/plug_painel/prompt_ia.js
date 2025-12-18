"use strict";
var promptia = function(){

    let btn_importa_csv;

    var init = function(){



        $('#salvar_prompt').click(function() {
            swal.fire({
                title: "Aguarde!",
                text: "Sua solicitação está sendo processada...",
                icon: "info",
                buttons: false,
            });
            
            

            fetch('api/prompt_ia/', {
                method: "POST",
                headers: {
                    'X-CSRFToken': csrftoken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({descricao: $('#textarea_prompt').val(), tipo_empresa: id_temp_prompt}),
            })
            .then(response => response.json())
            .then(data => {
                if(data.message){
                    swal.fire({
                        icon: 'success',
                        title: 'Salvo!',
                        buttons: false,
                        timer: 1500
                    })
                }
                else{
                    swal.fire({
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

promptia.init()

let id_temp_prompt
let edit_prompt = false
function prompt_ia(id){
    $('#textarea_prompt').val('')
    id_temp_prompt = id
    swal.fire({
        title: "Aguarde!",
        text: "Sua solicitação está sendo processada...",
        icon: "info",
        buttons: false,
    });
    fetch(`api/prompt_ia/${id}/`)
    .then(response => response.json())
    .then(data => {
        console.log(data)
        if(data.id){
            $('#textarea_prompt').val(data.descricao)
            edit_prompt = true
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
