//list layout view
$('.grid-layout-view').on('click', function(e) {
    $('.product-wrapper-grid').removeClass("list-view");
    $(".product-wrapper-grid").children().children().removeClass("col-xl-12");
});
$('.list-layout-view').on('click', function(e) {
    $('.collection-grid-view').css('opacity', '0');
    $(".product-wrapper-grid").css("opacity","0.2");
    $('.product-wrapper-grid').addClass("list-view");
    $(".product-wrapper-grid").children().children();
    $(".product-wrapper-grid").children().children().addClass("col-xl-12");
    setTimeout(function(){
        $(".product-wrapper-grid").css("opacity","1");
    }, 500);
});

// owl carousl
$(document).ready(function() {
    $("#testimonial").owlCarousel({
        items :1,
        margin:30,
        loop : true,
        pagination:true,
        navigationText:true,
        dots:false,
        nav: true
    });
});

// grid options
$('.product-2-layout-view').on('click', function(e) {
    if($('.product-wrapper-grid').hasClass("list-view")) {}
    else{
        $(".product-wrapper-grid").children().children().removeClass();
        $(".product-wrapper-grid").children().children().addClass("col-xl-6");
        $(".product-wrapper-grid").children().children().addClass("col-sm-6");
    }
});
$('.product-3-layout-view').on('click', function(e) {
    if($('.product-wrapper-grid').hasClass("list-view")) {}
    else{
        $(".product-wrapper-grid").children().children().removeClass();
        $(".product-wrapper-grid").children().children().addClass("col-xl-4");
        $(".product-wrapper-grid").children().children().addClass("col-sm-4");
    }
});
$('.product-4-layout-view').on('click', function(e) {
    if($('.product-wrapper-grid').hasClass("list-view")) {}
    else{
        $(".product-wrapper-grid").children().children().removeClass();
        $(".product-wrapper-grid").children().children().addClass("col-xl-3");
        $(".product-wrapper-grid").children().children().addClass("col-sm-3");
    }
});
$('.product-6-layout-view').on('click', function(e) {
    if($('.product-wrapper-grid').hasClass("list-view")) {}
    else{
        $(".product-wrapper-grid").children().children().removeClass();
        $(".product-wrapper-grid").children().children().addClass("col-xl-2");
    }
});



"use strict";
var item = function(){

    var forms;
    var init = function(){

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
                produto: $("#produto").val() || '',
                produto_original_id: $("#produto_original_id").val() || '',
                quantidade_sugerida: $("#quantidade_sugerida").val() || '',
                quantidade_minima: $("#quantidade_minima").val() || '',
                quantidade_maxima: $("#quantidade_maxima").val() || '',
                quantidade_disponivel: $("#quantidade_disponivel").val() || '',
                multiplo_boomerangue: $("#multiplo_boomerangue").val() || '',
                multiplo_pague: $("#multiplo_pague").val() || '',
                valor_item_original: $("#valor_item_original").val() || '',
                valor_atacado: $("#valor_atacado").val() || '',
                valor_unitario: $("#valor_unitario").val() || '',
                valor_unitario_calculado: $("#valor_unitario_calculado").val() || '',
                valor_total_item: $("#valor_total_item").val() || '',
                valor_sem_desconto: $("#valor_sem_desconto").val() || '',
                percentual_desconto: $("#percentual_desconto").val() || '',
                item_ativo: $("#item_ativo").val() || '',
                ordem: $("#ordem").val() || '',
                obrigatorio_compra: $("#obrigatorio_compra").val() || '',
                unidade_caixa: $("#unidade_caixa").val() || '',
                unidade_venda: $("#unidade_venda").val() || '',
                produto_bloqueado: $("#produto_bloqueado").val() || '',
                complemento1: $("#complemento1").val() || null,
              };
              fetch('api/bmm_boomerangueitens/',{
                method: "POST",
                credentials: 'include',
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
                        title: 'Item salvo!',
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
            Inputmask('currency', {
                alias: 'numeric',
                suffix: '',
                radixPoint: ',',
                groupSeparator: '.',
                autoGroup: true,
                digits: 2,
                digitsOptional: false,
                placeholder: '0'
            }).mask($("#valor_item_original"));

            Inputmask('currency', {
                alias: 'numeric',
                suffix: '',
                radixPoint: ',',
                groupSeparator: '.',
                autoGroup: true,
                digits: 2,
                digitsOptional: false,
                placeholder: '0'
            }).mask($("#valor_atacado"));

            Inputmask('currency', {
                alias: 'numeric',
                suffix: '',
                radixPoint: ',',
                groupSeparator: '.',
                autoGroup: true,
                digits: 2,
                digitsOptional: false,
                placeholder: '0'
            }).mask($("#valor_unitario"));

            Inputmask('currency', {
                alias: 'numeric',
                suffix: '',
                radixPoint: ',',
                groupSeparator: '.',
                autoGroup: true,
                digits: 2,
                digitsOptional: false,
                placeholder: '0'
            }).mask($("#valor_unitario_calculado"));

            Inputmask('currency', {
                alias: 'numeric',
                suffix: '',
                radixPoint: ',',
                groupSeparator: '.',
                autoGroup: true,
                digits: 2,
                digitsOptional: false,
                placeholder: '0'
            }).mask($("#valor_total_item"));

            Inputmask('currency', {
                alias: 'numeric',
                suffix: '',
                radixPoint: ',',
                groupSeparator: '.',
                autoGroup: true,
                digits: 2,
                digitsOptional: false,
                placeholder: '0'
            }).mask($("#valor_sem_desconto"));
            init();
        }
    };
}()

item.init()