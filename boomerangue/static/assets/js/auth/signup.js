"use strict";
var signup = function(){

    
    var form;
    var validator;
    var botao_cadastro;
    var verificar_cnpj_buutton;
    var proximo_cnpj_button;
    var cnpj_input;

    var init = function(){

        // Encontra o cookie que contém o csrftoken do Django
        const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
        // Extrai o valor do csrftoken do cookie
        const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;

        validator = FormValidation.formValidation(
			form,
			{
				fields: {
                    // 'avatar': {
					// 	validators: {
					// 		file: {
					// 			extension: 'jpg,jpeg,png',
					// 			type: 'image/jpeg,image/png',
					// 			message: 'O tipo de arquivo selecionado não é válido, é permitido: jpg,jpeg,png'
					// 		},
					// 	}
					// },
                    'nome': {
						validators: {
							notEmpty: {
								message: 'Digite seu nome!'
							}
						}
					},
                    'email': {
						validators: {
							notEmpty: {
								message: 'Digite seu endereço de e-mail!'
							},
							emailAddress: {
								message: 'Email Inválido!'
							}
						}
					},
					
					'senha': {
						validators: {
							notEmpty: {
								message: 'Digite sua senha!'
							}
						}
					},
					'repetir-senha': {
						validators: {
							identical: {
								compare: function () {
									return form.querySelector('[name="senha"]').value;
								},
								message: 'As senhas não são iguais'
							}
						}
					},
					'telefone': {
						validators: {
							notEmpty: {
								message: 'Digite seu telefone!'
							},
                            callback: {
                                message: 'Telefone inválido!',
                                callback: function(value, validator, $field) {
                                  // Verifica se o valor termina com "_" (não digitou completamente)
                                  return !value.value.endsWith('_');
                                }
                              }
                          
						}
					},
                },
				plugins: {
					trigger: new FormValidation.plugins.Trigger(),
					bootstrap: new FormValidation.plugins.Bootstrap({
						rowSelector: '.linha-input',
                        eleInvalidClass: '',
                        eleValidClass: ''
					})
				}
			}
		);

        verificar_cnpj_buutton.addEventListener('click', e=> {
            fetch("auth/empresas/verifica_cnpj/",{
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                },
                body:JSON.stringify({
                    cnpj: document.querySelector('[name="cnpj"]').value,

                }),
                method:"POST",
            })
            .then(res => res.json())
            .then(res => {
                if (res.sucesso) {
                    Swal.fire({
                        text: "CNPJ validado com sucesso.",
                        icon: "success",
                        buttonsStyling: false,
                        confirmButtonText: "Ok",
                        customClass: {
                            confirmButton: "btn btn-primary"
                        }
                    });
                    proximo_cnpj_button.disabled = false;
                }
                else {
                    Swal.fire({
                        title: 'Houve um erro ao validar o CPNJ.',
                        text: res["erro"],
                        icon: 'error',
                        confirmButtonText: 'Entendi',
                        confirmButtonColor: '#f27474'
                    });
                }
            })
        })

        cnpj_input.addEventListener('input', e => {
            if (!proximo_cnpj_button.disabled) {
                proximo_cnpj_button.disabled = true;
            }
        })

        botao_cadastro.addEventListener('click', e => {
            if (validator) {
                validator.validate().then(function (status) {
                    if (status == 'Valid') {
                        Swal.fire({
                            text: "Todas as informações foram validadas corretamente! Clique em salvar para prosseguir",
                            icon: "success",
                            buttonsStyling: false,
                            confirmButtonText: "Salvar",
                            customClass: {
                                confirmButton: "btn btn-primary"
                            }
                        }).then(function (result) {
                            if (result.isConfirmed) {
                                fetch("auth/empresas/",{
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-CSRFToken': csrftoken,
                                    },
                                    body:JSON.stringify({
                                        cnpj: document.querySelector('[name="cnpj"]').value,
                                        url: document.querySelector('[name="url"]').value,
                                        nome: document.querySelector('[name="nome"]').value,
                                        email: document.querySelector('[name="email"]').value,
                                        telefone: document.querySelector('[name="telefone"]').value,
                                        senha: document.querySelector('[name="senha"]').value,
                                        tipo_de_negocio: document.querySelector('[name="tipo_de_negocio"]').value
                                    }),
                                    method:"POST",
                                })
                                .then(response => response.json())
                                .then(data => {
                                    if(data["sucesso"]) {
                                        Swal.fire({
                                            title: 'Solicitação realizada com sucesso.',
                                            text: 'Entraremos em contato quando aprovarmos.',
                                            icon: 'success',
                                            confirmButtonText: "Entendi",
                                            customClass: {
                                                confirmButton: "btn btn-primary"
                                            }
                                        })
                                        .then(res => {
                                            if (res.isConfirmed) {
                                                window.location.href = "/login";
                                            }
                                        })
                                    } else {
                                        Swal.fire({
                                            title: 'Ocorreu um erro no cadastro.',
                                            text: data["erro"],
                                            icon: 'error',
                                            confirmButtonText: 'Entendi',
                                            confirmButtonColor: '#f27474'
                                        });
                                        if (data["erros_serializer"]) {
                                            console.log(data["erros_serializer"]);
                                        }
                                    }
                                })
                            }
                        });
                    } else{
                        Swal.fire({
                            text: "Houve um erro, verifique os campos digitados",
                            icon: "error",
                            buttonsStyling: false,
                            confirmButtonText: "Ok",
                            customClass: {
                                confirmButton: "btn btn-primary"
                            }
                        });
                    }
                });
            }
        })

        
    }
    return {
        init: function() {
            Inputmask({ mask: '99.999.999/9999-99' }).mask($("#cnpj"));
            Inputmask({ mask: '(99) 99999-9999' }).mask($("#telefone"));
            form = document.getElementById('form_cadastro');
            botao_cadastro = document.querySelector('#botao_cadastro');
            verificar_cnpj_buutton = document.querySelector('#verificar_cnpj');
            proximo_cnpj_button = document.querySelector('#proximo_cnpj');
            cnpj_input = document.querySelector('#cnpj');
            init();
        }
    };
}()

signup.init()