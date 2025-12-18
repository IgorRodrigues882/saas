var tipo_empresa_id = ''
var atributos = function(){

    var init = function(){


        $('#salvar_atributos').on('click',function(e){
            e.preventDefault()
            
                let data = {
                    nome_atributo: $("#nome_atributo").val() || null,
                    tipo_atributo: $("#tipo_atributo").val() || null,
                    conteudo_padrao: $("#conteudo_padrao").val() || null,
                    obrigatorio: $("#obrigatorio").val() || null,
                    tipo_empresa: tipo_empresa_id
                }
                fetch('api/atributos/',{
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
                        atualiza_atributos(tipo_empresa_id)
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

        })


    
    }
    return {
        init: function() {
            init();
        }
    };
}()

atributos.init()

function atributos_func(index){
    tipo_empresa_id = index
    atualiza_atributos(index)
}

function atualiza_atributos(index){
    $("#body_atributos").html('')
    fetch(`api/atributos/busca_atributos/`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({
            id: index
        })
      })
    .then(res=>res.json())
    .then(data=>{
     if(data.length > 0){
         let opt;
         let tr;
         for(let i=0; i<data.length; i++){
             tr +=`
                 <tr>
                 <td>
                 <div class="media">
                     <div class="media-body ps-2">
                     <div class="avatar-details"><a href="#">
                         <h6>${data[i].nome_atributo}</h6>
                         </a><span>#${data[i].id}</span></div>
                     </div>
                 </div>
                 </td>
                 <td>
                    ${data[i].tipo_atributo}
                 </td>
                 <td>
                    ${data[i].conteudo_padrao}
                 </td>
                 <td>
                    ${data[i].obrigatorio ? "Sim" : 'Não'} 
                 </td>
                 <td>
                 <button class="btn btn-danger" onclick='delete_atributo(${data[i].id})'>Excluir</button>
                 </td>
             </tr>
             `

         }
         $("#body_atributos").html(tr)
     }
    })
 }


function delete_atributo(index){
    Swal.fire({
        title: 'Tem certeza?',
        text: "Tem certeza que deseja excluir esse Atributo?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Não, cancelar!'
      }).then((willDelete)=>{
        if(willDelete){
            fetch(`api/atributos/${index}/`,{
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
                        atualiza_atributos(tipo_empresa_id)
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
            })
            .catch(error => {
                console.error('Erro ao enviar a solicitação:', error);
              });
        }
    })
}