"use strict";
var empresa = function(){

    var create_empresa;
    var form;
    var validator;
    var inputs;

    var init = function(){
        
        const fields = {};
        inputs.forEach(input => {
                if (input.name) {
                    fields[input.name] = {
                        validators: {
                            notEmpty: {
                                message: `Esse campo não pode estar vazio!`
                            }
                        }
                    };
                }
            });

        validator = FormValidation.formValidation(
			form,
			{
				fields: fields,
				plugins: {
					trigger: new FormValidation.plugins.Trigger(),
					bootstrap: new FormValidation.plugins.Bootstrap({
						rowSelector: '.fv-row',
                        eleInvalidClass: '',
                        eleValidClass: ''
					})
				}
			}
		);

        
        function validarCNPJ(cnpj) {
            // Remover caracteres não numéricos
            cnpj = cnpj.replace(/\D/g, '');
          
            // Verificar se o CNPJ tem 14 dígitos
            if (cnpj.length !== 14) {
              return false;
            }
          
            // Verificar dígitos verificadores
            const digitos = cnpj.split('').map(Number);
            const pesosPrimeiroDigito = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
            const pesosSegundoDigito = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
          
            function calcularDigitoVerificador(pesos) {
              const soma = digitos.slice(0, pesos.length).reduce((acc, val, idx) => acc + val * pesos[idx], 0);
              const resto = soma % 11;
              return resto < 2 ? 0 : 11 - resto;
            }
          
            const primeiroDigitoVerificador = calcularDigitoVerificador(pesosPrimeiroDigito);
            const segundoDigitoVerificador = calcularDigitoVerificador(pesosSegundoDigito);
          
            return (
              digitos[12] === primeiroDigitoVerificador && digitos[13] === segundoDigitoVerificador
            );
          }



        create_empresa.addEventListener('click',function(){

            if(validator){
                validator.validate().then(function (status) {
					console.log('validated!');
                    console.log(status)

                    if(status=='Valid'){
                        if(!validarCNPJ($("#cnpj").val())){
                            Swal.fire({
                                text: "CNPJ Inválido" ,
                                icon: "error",
                                buttonsStyling: false,
                                confirmButtonText: "Ok",
                                customClass: {
                                    confirmButton: "btn btn-primary"
                                }
                            });
                            
                        }
                        else{
                            const data = {
                                empresa: $("#empresa").val() || '',
                                empresa_apelido: $("#empresa_apelido").val() || '',
                                cnpj:$("#cnpj").val() || '',
                                cod_empresa:$("#cod_empresa").val(),
                                tipoempresa_id:$("#tipoempresa_id").val() || '',
                                cod_puxada:$("#cod_puxada").val() || '',
                                chave_edi:$("#chave_edi").val() || '',
                                edi_integracao:$("#edi_integracao").val() || '',
                                tokenapi:$("#tokenapi").val() || '',
                                tokenbmempresa:$("#tokenbmempresa").val() || '',
                                telefonesac:$("#telefonesac").val() || '',
                                codtelefone:$("#codtelefone").val() || '',
                                emailpedidodireto:$("#emailpedidodireto").val() || '',
                                emailpedidoempresa:$("#emailpedidoempresa").val() || '',
                                // Outros campos e valores aqui...
                            };
                            fetch('api/create-empresa/',{
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    // Authorization: `Token ${authToken}`,
                                },
                                body: JSON.stringify(data),
                            }).then((response) => response.json())
                            .then((data) => {
                                console.log(data)
                                if(data.id){
                                    Swal.fire({
                                        icon: 'success',
                                        title: 'Empresa salva!',
                                        showConfirmButton: false,
                                        timer: 1500
                                    })
                                    inputs.forEach(input=>{
                                        input.value = ''
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
                    // Verificar campos inválidos
                    
                })
            }
        })

    }
    return {
        init: function() {
            Inputmask({ mask: '99.999.999/9999-99' }).mask($("#cnpj"));
            Inputmask({ mask: '(99) 99999-9999' }).mask($("#telefonesac"));
            create_empresa = document.getElementById("create_empresa");
            form = document.getElementById('form-addEmpresa');
            inputs = document.querySelectorAll('.campo');
            init();
        }
    };
}()

empresa.init()
