$(function() {
    $( "#btn_gerar_text" ).click(function() {
     new swal({
        title: "Aguarde...",
        text: "Processando sua solicitação",
        icon: "info",
        button: false,
        closeOnClickOutside: false,
        closeOnEsc: false,
    });
      fetch('/pt/ia',{
        method:'POST',
        headers: {
            "Content-Type": "application/json",
            'X-CSRFToken': csrftoken,
        },
        body:JSON.stringify({
            text_produto_servico: $("#text_produto_servico").val()|| null,
            text_publico_alvo: $("#text_publico_alvo").val() || null,
            text_descricao: $("#text_descricao").val() || null,
            text_criatividade: $("#text_criatividade").val() || null,
            text_tom: $("#text_tom").val() || null,
        })
      })
      .then(res=>res.json())
      .then(res=>{
        if(res){
          simplemdeIA.value(res.chatbot_response)
          swal.close() 
        }

        else{
          new swal({
            title: "Houve um erro ao tentar buscar informações",
            icon: "error",
            dangerMode: true,
          })
        }

      })
      .catch(error=>{
       new swal({
          title: "Houve um erro ao tentar buscar informações",
          icon: "error",
          dangerMode: true,
        })
      })


    });

    $("#aplicar_text_ia").on('click', function(){
      let text = simplemdeIA.value()
      simplemde.value(text)
    })

    $("#limpar_text_ia").on('click', function(){
      simplemdeIA.value('')
    })
});
