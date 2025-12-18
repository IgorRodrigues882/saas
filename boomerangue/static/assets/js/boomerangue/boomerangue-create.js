"use strict";
var boomerangue = function(){
    
    var forms;
    var init = function(){

         // Encontra o cookie que contém o csrftoken do Django
         const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
         // Extrai o valor do csrftoken do cookie
         const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;

        var validation = Array.prototype.filter.call(forms, function(form) {
            form.addEventListener('submit', function(event) {
                if (form.checkValidity() === false) {
                    console.log("entrou aqui")
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
            

            // Ajusta formato data
            function formatDate(inputDate) {
                // Divida a data em dia, mês e ano
                var parts = inputDate.split('/');
                var day = parts[0];
                var month = parts[1];
                var year = parts[2];
              
                // Crie uma nova data no formato desejado (horário definido como meio-dia)
                var formattedDate = year + '-' + month + '-' + day + 'T00:00:00';
              
                return formattedDate;
              }


            const data = {
                entidade: $("#entidade").val() || '',
                template: $("#template").val() || '',
                campanha: $("#campanha").val() || '',
                prefixo: $("#prefixo").val() || '',
                telefone_bm: $("#telefone_bm").val() || '',
                data_inicio_campanha: formatDate($("#data_inicio_campanha").val()),
                data_final_campanha: formatDate($("#data_final_campanha").val()),
                hora_inicio_envio: $("#hora_inicio_envio").val() || '',
                hora_final_envio: $("#hora_final_envio").val() || '',
                short_url: $("#short_url").val() || '', // Corrigido o nome da propriedade para 'url'
                usar_desconto_geral: $("#usar_desconto_geral").val() || '',
                titulo_boomerangue: $("#titulo_boomerangue").val() || '',
                condicoes_pagamento_id: $("#condicoes_pagamento_id").val() || '',
                vendedor: $("#vendedor").val() || '',
                transportadora: $("#transportadora").val() || '',
                compra_minima_vlr: removeCurrencyFormatting($("#compra_minima_vlr").val()),
                compra_minima_qtd: $("#compra_minima_qtd").val() || '',
                desconto_promocional: removeCurrencyFormatting($("#desconto_promocional").val()),
                extra_info_4: $("#extra_info_4").val() || null,
              };
              fetch('api/bmm_boomerangue/',{
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
                        title: 'Boomerangue salvo!',
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
            Inputmask({ mask: '(99) 99999-9999' }).mask($("#telefone_bm"));
            Inputmask('currency', {
                alias: 'numeric',
                suffix: '',
                radixPoint: ',',
                groupSeparator: '.',
                autoGroup: true,
                digits: 2,
                digitsOptional: false,
                placeholder: '0'
            }).mask($("#compra_minima_vlr"));

            Inputmask('currency', {
                alias: 'numeric',
                suffix: '',
                radixPoint: ',',
                groupSeparator: '.',
                autoGroup: true,
                digits: 2,
                digitsOptional: false,
                placeholder: '0'
            }).mask($("#desconto_promocional"));
            init();
        }
    };
}()

boomerangue.init()