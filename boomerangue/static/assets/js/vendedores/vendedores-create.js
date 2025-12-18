"use strict";
var vendedores = function(){

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
                Vendedor: $("#Vendedor").val(),
                Integracao_EDI:$("#Integracao_EDI").val() || null,
                Integracao_EDI2:$("#Integracao_EDI2").val() || null,
                CodigoVendedor:$("#CodigoVendedor").val() || null,
                VendedorBM:$("#VendedorBM").val() || null,
                VendedorOriginal:$("#VendedorOriginal").val() || null,
                Apelido: $("#Apelido").val(),
                LegendaVendedor:$("#LegendaVendedor").val() || 'Seu Vendedor',
                TelefoneVendedor: $("#TelefoneVendedor").val(),
                VendedorPadrao:$("#VendedorPadrao").val(),
                ComissaoVenda:removeCurrencyFormatting($("#ComissaoVenda").val()) || 0.0,
                CondicaoPgtoPadrao:$("#CondicaoPgtoPadrao_id").val(),
                TransportadoraPadrao:$("#TransportadoraPadrao_id").val(),
                MarcaPadrao:$("#MarcaPadrao").val()
                // Outros campos e valores aqui...
              };
              
              fetch('api/create-vendedor/',{
                method: "POST",
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
                        title: 'Vendedor salvo!',
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
            Inputmask({ mask: '(99) 99999-9999' }).mask($("#TelefoneVendedor"));
            Inputmask('currency', {
                alias: 'numeric',
                suffix: '',
                radixPoint: ',',
                groupSeparator: '.',
                autoGroup: true,
                digits: 2,
                digitsOptional: false,
                placeholder: '0'
            }).mask($("#ComissaoVenda"));

            init();
        }
    };
}()

vendedores.init()