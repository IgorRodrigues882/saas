function add_flow_id(index){
    swal({
        title: 'Aguarde...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCancelButton: false,
        showConfirmButton: false,
      });
    document.getElementById('salva_flow_id').dataset.id = index
    fetch(`api/fluxo_sendpulse/${index}/`)
      .then(res=>res.json())
      .then(data=>{
        console.log(data)
        $("#fluxo_id").val(data.fluxo_id)
        swal.close()
      })
  }
  
  $("#salva_flow_id").on('click', function(e){
    e.preventDefault()
    let id = document.getElementById('salva_flow_id').dataset.id
    swal({
      title: 'Aguarde...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showCancelButton: false,
      showConfirmButton: false,
    });
    

     const newdata = {
        fluxo_id: $("#fluxo_id").val() || null,
        component: id
        // Outros campos e valores aqui...
      };
  
    fetch(`api/fluxo_sendpulse/`, {
        method: 'POST', // Use 'PATCH' para atualizações parciais
        headers: {
          'Content-Type': 'application/json', // Indica o tipo de conteúdo
          'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify(newdata), // Novos dados em formato JSON
      })
      .then(res=>res.json())
      .then(data=>{
        if(data.id){
          swal({
            icon: 'success',
            title: 'Flow id salvo',
            showConfirmButton: false,
            timer: 1500
        })
        }
        else{
          swal({
            icon: 'error',
            title: 'Ocorreu um erro ao tentar salvar',
            showConfirmButton: false,
        })
        }
      })
  })