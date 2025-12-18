function busca_termos_sendpulse(index){
    document.getElementById('termos_update').dataset.id = index
    swal({
        title: 'Aguarde...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCancelButton: false,
        showConfirmButton: false,
      });
      fetch(`api/wpp_templatescomponents_retorno/send_pulse/`,{
        method: 'POST',
        body: JSON.stringify({id:index}),
        headers: {
            'Content-Type': 'application/json', // Indica o tipo de conteúdo
            'X-CSRFToken': csrftoken,
          },
      })
      .then(res=>res.json())
      .then(data=>{
        if(data.data){
            gera_inputs(data.data)
            swal.close()
        }
        else{
            swal({
                title: "Erro",
                text: data.error,
                icon: "error",
                button: "OK",
              });
        }
      })
}

function gera_inputs(index){
    let div = document.getElementById('termos_sendpulse')
    div.innerHTML=''
    let inputs = []
    let options = []
    for(let field of fields){
        options+=`
        <option value="${field.fields.exibicao}">${field.fields.exibicao}</option>
        `
    }
    for(let termo of index){
        console.log(termo)
        inputs += `
        <div class="d-flex">
        <div class="col-6">
          <label for="">Termo Sendpulse</label>
          <input type="text" class="form-control inpt_termo" value="${termo.termo}" disabled id="termo_${termo.termo}" data-term='${termo.termo}'>
        </div>

        <div class="col-6 ms-2">
          <label for="">Termo de Troca</label>
          <select class="js-example-basic-single select_termo" id="${termo.termo}">
            <option value="${termo.termo_troca}">${termo.termo_troca}</option>
            ${options}
          </select>
        </div>
      </div>
        `

    }

    div.innerHTML = inputs;
    $('.js-example-basic-single').select2();
}


$("#termos_update").on('click', function(e){
    e.preventDefault()
    console.log(this.dataset.id)
    swal({
        title: 'Aguarde...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCancelButton: false,
        showConfirmButton: false,
      });
    let selects = document.querySelectorAll('.select_termo')
    let inpts = document.querySelectorAll('.inpt_termo')
    console.log(selects, inpts) 
    let promises = [];
    let data = new FormData()
    data.append('component', this.dataset.id)
    for(let select of selects){
        //
        if(select.value == ''){
            swal({
                title: "Erro",
                text: "Preencha todos os campos",
                icon: "error",
                button: "OK",
              });
            return
        }
        let select_ = select.id

        data.append('termo_sendpulse',document.getElementById(`termo_${select_}`).value)
        data.append('termo_troca', select.value)
        promises.push(salva_termos(data))

    }
    Promise.all(promises) // wait for all fetches to complete
    .then(() => {
        // all fetches have completed successfully, you can notify the user here
        swal({
            title: "Sucesso",
            text: "Todas as requisições foram realizadas com sucesso",
            icon: "success",
            button: "OK",
        });
    })
    .catch((error) => {
        // handle any errors here
        console.error(error);
        swal({
            title: "Erro",
            text: "Erro",
            icon: "error",
            button: "OK",
          });
    });
})

function salva_termos(data){
    fetch('api/termo_troca/',{
        method:'POST',
        body:data,
        headers: {
            'X-CSRFToken': csrftoken,
          },
    })
    .then(res=>res.json())
    .then(data=>{
        console.log(data)
    })
}