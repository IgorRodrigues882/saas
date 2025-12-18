"use strict";
let cidadeAPI = "";
let cepAntes = document.getElementById("CEP").value;
var entidade = function () {

var forms;
var init = function () {

  
    // Encontra o cookie que contém o csrftoken do Django
    const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
    // Extrai o valor do csrftoken do cookie
    const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;

    var validation = Array.prototype.filter.call(forms, function (form) {
        form.addEventListener('submit', function (event) {
            if (form.checkValidity() === false) {
                event.preventDefault();
                event.stopPropagation();
            }
            else {
                event.preventDefault();
                event.stopPropagation();
                fetchApi();

            }
            form.classList.add('was-validated');
        }, false);
    });


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


    function fetchApi() {

        // Ajusta formato moedas
        function removeCurrencyFormatting(value) {
            // Remove o prefixo, separador de milhares e qualquer caractere não numérico
            return value.replace(/[^0-9,-]/g, '').replace(',', '');
        }

      function changeDateFormat(value) {
        if (value[2] !== '/' ) { // not in correct form
          return 
        } else {
          const year = value[6]+value[7]+value[8]+value[9];
          const month = value[3] + value[4];
          const day = value[0] + value[1];
          return year + '-' + month + '-' + day;
        }
      }


      if (validarCNPJ($("#CNPJ").val())) {
            const data = {
                Entidade: $("#Entidade").val() || null,
                Fantasia: $("#Fantasia").val() || null,
                CNPJ: $("#CNPJ").val() || null,
                InscricaoEstadual: $("#InscricaoEstadual").val() || null,
                Cliente: $("#Cliente").val() || null,
                Endereco: $("#Endereco").val() || null,
                Numero: $("#Numero").val(),
                Bairro: $("#Bairro").val() || null,
                Complemento: $("#Complemento").val() || null,
                cidade: $("#Cidade").data("pk") || null,
                uf: $("#uf").data('pk') || null,
                pais: $("#pais").data('pk') || null,
                CEP: $("#CEP").val() || null,
                Telefone1: $("#Telefone1").val() || null,
                Telefone2: $("#Telefone2").val() || null,
                WhatsAPPComercial: $("#WhatsAPPComercial").val() || null,
                Email_Comercial: $("#Email_Comercial").val() || null,
                Email_Compras: $("#Email_Compras").val() || null,
                EMAIL_Marketing: $("#EMAIL_Marketing").val() || null,
                Entidade_Ativa: $("#Entidade_Ativa").val() || null,
                ReceitaTelefone: $("#ReceitaTelefone").val() || null,
                ReceitaEmail: $("#ReceitaEmail").val() || null,
                ReceitaDataSituacao: $("#ReceitaDataSituacao").val() || null,
                ReceitaAtivo: $("#ReceitaAtivo").val() || null,
                Capital_Social: parseFloat(removeCurrencyFormatting($("#Capital_Social").val())) || null,
                NomeContato: $("#NomeContato").val() || null,
                DtAberturaEmpresa: $("#DtAberturaEmpresa").val() || null,
              SobrenomeContato: $("#SobrenomeContato").val() || null,
              EDI_Integracao: null,
                TokenCliente: null,
                
                // Outros campos e valores aqui...
            };
        
        
            fetch('api/create-entidade/', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'X-CSRFToken': csrftoken,
                },
                body: JSON.stringify(data),
            }).then((response) => response.json())
                .then((data) => {
                    console.log(data)
                    if (data.id) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Entidade criada com sucesso!',
                            showConfirmButton: false,
                            timer: 1500
                        }).then((result) => {
                            if (result) {
                                window.location.reload();
                            }
                        })

                      
                    }
                    else {
                        Swal.fire({
                            text: "Ocorreu um erro ao tentar salvar ",
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
        else{
            Swal.fire({
                text: "CNPJ Inválido",
                icon: "error",
                buttonsStyling: false,
                confirmButtonText: "Ok",
                customClass: {
                    confirmButton: "btn btn-primary"
                }
            });
        }
        
        
    }

    function criaOptionsCidades(uf, cidade) {
        var Cidade = document.getElementById("Cidade")
        fetch(`api/pegacidade/${uf}/`)
            .then(response => response.json())
            .then(data => {
         
                if (data.cidades) {
            
                    Cidade.innerHTML = ""
            
                    var lista = []
                    for (var i = 0; i < data.cidades.length; i++) {
                

                        lista += `<option value="${data.cidades[i].Cidade}" data-pk="${data.cidades[i].pk}">${data.cidades[i].Cidade}</option>`

                    }

                    Cidade.innerHTML = lista
                    if (cidade != "") {
                        console.log("entrou")
                      Cidade.value = cidade;
                      
                      Cidade.dispatchEvent(new Event('change'));
                    }

                }
            })
    }

    $("#uf").on("change", function (e) {
      console.log('mudou uf', cidadeAPI)
      criaOptionsCidades(e.target.value, cidadeAPI)
      var selectedOption = $(this).find("option:selected");
      var selectedPk = selectedOption.data("pk");

      // Defina o valor do atributo data-pk do select
      $(this).data("pk", selectedPk);

      // Exemplo de como acessar o data-pk do select
      var selectPk = $(this).data("pk");
      console.log("Data-pk do select:", selectPk);
  })
  $("#Cidade").on("change",function(){
    var selectedOption = $(this).find("option:selected");
    var selectedPk = selectedOption.data("pk");

    // Defina o valor do atributo data-pk do select
    $(this).data("pk", selectedPk);

    // Exemplo de como acessar o data-pk do select
    var selectPk = $(this).data("pk");
    console.log("Data-pk do select:", selectPk);
  });
  $("#pais").on("change",function(){
    var selectedOption = $(this).find("option:selected");
    var selectedPk = selectedOption.data("pk");

    // Defina o valor do atributo data-pk do select
    $(this).data("pk", selectedPk);

    // Exemplo de como acessar o data-pk do select
    var selectPk = $(this).data("pk");
    console.log("Data-pk do select:", selectPk);
});

}
return {
    init: function () {
        forms = document.getElementsByClassName('needs-validation');
        Inputmask({ mask: '99.999.999/9999-99' }).mask($("#CNPJ"));
        Inputmask({ mask: '(99) 99999-9999' }).mask($("#Telefone1"));
        Inputmask({ mask: '(99) 99999-9999' }).mask($("#Telefone2"));
        Inputmask({ mask: '(99) 99999-9999' }).mask($("#ReceitaTelefone"));
        Inputmask({ mask: '(99) 99999-9999' }).mask($("#ReceitaTelefone"));
        Inputmask({ mask: '(99) 99999-9999' }).mask($("#WhatsAPPComercial"));
        Inputmask({ mask: '99999-999'}).mask($("#CEP"))
        Inputmask('currency', {
            alias: 'numeric',
            suffix: '',
            radixPoint: '.',
            groupSeparator: ',',
            autoGroup: true,
            digits: 2,
            digitsOptional: false,
            placeholder: '0'
        }).mask($("#Capital_Social"));

        init();
    }
};
}();

entidade.init();

// Busca endereço pelo cep
(function () {
    const cepInput = document.getElementById("CEP");
    const enderecoInput = document.getElementById("Endereco");
    const bairroInput = document.getElementById("Bairro");
    const paisSelect = document.getElementById("pais");
    const ufSelect = document.getElementById("uf");
    const cidadeSelect = document.getElementById("Cidade");
    cepInput.addEventListener('blur', e => {
        if (cepAntes === e.target.value) {
            console.log('CEP IGUAL')
            return;
        }
        cepAntes = e.target.value;
      const value = cepInput.value.replace(/[^0-9]+/, '');
      const url = `https://viacep.com.br/ws/${value}/json/`;
      cidadeAPI = ""
      fetch(url)
        .then(response => response.json())
          .then(json => {
            console.log(json)
          if (json.logradouro) {
            enderecoInput.value = json.logradouro;
            bairroInput.value = json.bairro;
            paisSelect.value = "Brazil";
              paisSelect.dispatchEvent(new Event('change'));
              cidadeAPI = json.localidade; // verificado no console.log
            ufSelect.value = json.uf;
            ufSelect.dispatchEvent(new Event('change'));

          } else {
            Swal.fire({
              text: "Este CEP não existe!",
              icon: "error",
              buttonsStyling: false,
              confirmButtonText: "Ok",
              customClass: {
                confirmButton: "btn btn-primary"
              }
            });
          }
        });
    });
  })();

// Busca dados pelo cnpj
(function () {
    const cnpjInput = document.getElementById("CNPJ");
    const cep = document.getElementById("CEP")
    cnpjInput.addEventListener('blur', e => {
      const value = cnpjInput.value.replace(/\D/g, '');
      const url = `https://publica.cnpj.ws/cnpj/${value}`;

    const options = {
    method: "GET",
    headers: {
        Accept: "application/json",
    }
    };
  
  fetch(url,options)
    .then(response => response.json())
    .then(data => {
      console.log(data);
      if (data) {
        $("#Entidade").val(data.razao_social)
        $("#Fantasia").val(data.estabelecimento.nome_fantasia)
        $("#InscricaoEstadual").val(data.estabelecimento.inscricoes_estaduais[0].inscricao_estadual)
        cep.value = data.estabelecimento.cep
        cep.dispatchEvent(new Event('blur'))
        $("#Numero").val(data.estabelecimento.numero)
        $("#ReceitaDataSituacao").val(data.estabelecimento.data_situacao_cadastral)
        $("#Telefone1").val(data.estabelecimento.ddd1 + data.estabelecimento.telefone1)
        $("#Telefone2").val(data.estabelecimento.ddd2 + data.estabelecimento.telefone2)
        $("#Email_Comercial").val(data.estabelecimento.email)
        $("#Complemento").val(data.estabelecimento.complemento)
        $("#DtAberturaEmpresa").val(data.estabelecimento.data_inicio_atividade)
        $("#Capital_Social").val(data.capital_social)
        if(data.estabelecimento.situacao_cadastral == 'Ativa'){
            $("#ReceitaAtivo").val('S').trigger('change')
        }
        else{
            $("#ReceitaAtivo").val('N').trigger('change')
        }

  
      } else {
        Swal.fire({
          text: "Este CNPJ não existe!",
          icon: "error",
          buttonsStyling: false,
          confirmButtonText: "Ok",
          customClass: {
            confirmButton: "btn btn-primary"
          }
        });
      }
    })
    .catch(error => {
      console.error('Erro ao buscar informações do CNPJ', error);
    });
});
  })();