"use strict";
var signup = function(){

    
    var form;
    var validator;
    var botao_login;

    var init = function(){

        // Encontra o cookie que contém o csrftoken do Django
        const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
        // Extrai o valor do csrftoken do cookie
        const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;

        validator = FormValidation.formValidation(
			form,
			{
				fields: {
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
                },
				plugins: {
					trigger: new FormValidation.plugins.Trigger(),
					bootstrap: new FormValidation.plugins.Bootstrap({
						rowSelector: '.form-group',
                        eleInvalidClass: '',
                        eleValidClass: ''
					})
				}
			}
		);

        botao_login.addEventListener('click', e => {
            if (validator) {
                validator.validate().then(function (status) {
                    if (status == 'Valid') {
                        Swal.fire({
                            title: 'Efetuando Login...',
                            icon: 'info',
                            allowOutsideClick: false,
                            showConfirmButton: false,
                        });
        
                        fetch("auth/users/login/", {
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': csrftoken,
                            },
                            body: JSON.stringify({
                                email: document.querySelector('[name="email"]').value,
                                senha: document.querySelector('[name="senha"]').value
                            }),
                            method: "POST",
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data["sucesso"]) {
                                window.location.href = data.url;  
                            } else {
                                Swal.fire({
                                    title: 'Ocorreu um erro no login.',
                                    text: data["erro"],
                                    icon: 'error',
                                    confirmButtonText: 'Entendi',
                                    confirmButtonColor: '#f27474'
                                });
                            }
                        });
                    } else {
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
        });
        

        
    }
    return {
        init: function() {
            form = document.getElementById('form_login');
            botao_login = document.querySelector('#botao_login');
            init();
        }
    };
}()

signup.init()