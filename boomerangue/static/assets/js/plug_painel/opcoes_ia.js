
var opcoesia_ = function(){

    var init = function(){


        $('#save_gpt_version').on('click',function(e){
            e.preventDefault()
            if($("#gpt_version").val()){
                let data = {
                    gpt_engine: $("#gpt_version").val() || null,
                }
                fetch('api/gpt_engine/',{
                   method:'POST',
                   headers: {
                    "Content-Type": "application/json",
                    'X-CSRFToken': csrftoken,
                    },
                    body: JSON.stringify(data)
                })
                .then(res=>res.json())
                .then(data=>{
                    console.log(data)
                    if(data.id){
                        swal.fire({
                            title: "Sucesso!",
                            text: "Item salvo", 
                            icon: "success",
                            button: "OK",
                        });
                        atualiza_select()
                    }
                    else{
                        swal.fire({
                            title: "Erro",
                            text: "Ocorreu um erro ao tentar salvar!", 
                            icon: "error",
                            button: "OK",
                        });
                    }
                })

            }
            else{
                swal.fire({
                    title: "Erro",
                    text: "Preencha o campo criatividade!", 
                    icon: "error",
                    button: "OK",
                });
            }

        })


        $("#save_versao").on('click', function(e){
            console.log('clicou')
            if($("#gpt_engine").val()){
                console.log('entrou')
                let data = {
                    gpt_engine: $("#gpt_engine").val() || null,
                    prompt: $("#prompt_ia_template").val() || null,
                }
                fetch('api/prompt_settings/1/',{
                    method:'PUT',
                    headers: {
                    "Content-Type": "application/json",
                    'X-CSRFToken': csrftoken,
                    },
                    body: JSON.stringify(data)
                })
                .then(res=>res.json())
                .then(data=>{
                    if(data.id){
                        swal.fire({
                            title: "Sucesso!",
                            text: "Item salvo", 
                            icon: "success",
                            button: "OK",
                        });
                    }
                    else{
                        swal.fire({
                            title: "Erro",
                            text: "Ocorreu um erro ao tentar salvar!", 
                            icon: "error",
                            button: "OK",
                        });
                    }
                })
            }
            else{
                swal.fire({
                    title: "Erro",
                    text: "Escolha uma versão do gpt!", 
                    icon: "error",
                    button: "OK",
                });
            }
        })

    
    }
    return {
        init: function() {
            init();
        }
    };
}()

opcoesia_.init()


function atualiza_select(){
    $("#gpt_engine").html('')
    $("#tbody_versao").html('')
    fetch('api/gpt_engine/',{
     method:'GET',
     headers: {
         "Content-Type": "application/json",
         'X-CSRFToken': csrftoken,
     }
    })
    .then(res=>res.json())
    .then(data=>{
     if(data.length > 0){
         let opt;
         let tr;
         for(let i=0; i<data.length; i++){
             opt += `
                 <option value='${data[i].id}'>${data[i].gpt_engine}<option/>
             `
             tr +=`
                 <tr>
                 <td>
                 <div class="media">
                     <div class="media-body ps-2">
                     <div class="avatar-details"><a href="#">
                         <h6>${data[i].gpt_engine}</h6>
                         </a><span>#${data[i].id}</span></div>
                     </div>
                 </div>
                 </td>
                 <td>
                 <button class="btn btn-danger" onclick='delete_versao(${data[i].id})'>Excluir</button>
                 </td>
             </tr>
             `

         }
         $("#gpt_engine").html(opt)
         $("#tbody_versao").html(tr)
     }
    })
 }


function delete_versao(index){
    Swal.fire({
        title: 'Tem certeza?',
        text: "Tem certeza que deseja excluir essa versao?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Não, cancelar!'
      }).then((willDelete)=>{
        if(willDelete){
            fetch(`api/gpt_engine/${index}/`,{
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
                        atualiza_select()
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