
"use strict";
var condPagamento = function(){

    var forms;
    var init = function(){
        // Encontra o cookie que contém o csrftoken do Django
        const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
        // Extrai o valor do csrftoken do cookie
        const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;
        

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

            function removeCurrencyFormatting(value) {
                // Remove o prefixo, separador de milhares e qualquer caractere não numérico
                var valor = value.replace(/[^0-9,-]/g, '').replace(',', '.');
                return parseFloat(valor)
            }
            
            
            const data = {
                condicoes_pagamento: $("#condicoes_pagamento").val() || '',
                valor_minimo:removeCurrencyFormatting($("#valor_minimo").val())|| '',
                NroParcelas:$("#NroParcelas").val(),
                CondicaoPadrao:$("#CondicaoPadrao").val() || '',
                CondicaoAtiva:$("#CondicaoAtiva").val() || '',
                prazo_medio:$("#prazo_medio").val() || '',
                CodTipoDocumentoCobranca:$("#CodTipoDocumentoCobranca").val() || '00',
                CondicaoAmigavel:$("#CondicaoAmigavel").val() || null,
                EDI_Integracao:$("#EDI_Integracao").val(),
                status_condicoes_pagamento:$("#status_condicoes_pagamento").val(),
                // Outros campos e valores aqui...
              };
              fetch('api/create-condPagamento/',{
                method: "POST",
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
                        title: 'Condição de pagamento salva!',
                        showConfirmButton: false,
                        timer: 1500
                      }).then((result)=>{
                        window.location.reload()
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
            Inputmask('currency', {
                alias: 'numeric',
                suffix: '',
                radixPoint: ',',
                groupSeparator: '.',
                autoGroup: true,
                digits: 2,
                digitsOptional: false,
                placeholder: '0'
            }).mask($("#valor_minimo"));
            forms = document.getElementsByClassName('needs-validation');
            init();
        }
    };
}()

condPagamento.init()
