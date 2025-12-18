"use strict";
var lista = function(){
    
    var navlinks;
    var cards;
    var nomes;
    var init = function(){


            navlinks.forEach(element => {
                element.addEventListener("click", function(){
                    cards.forEach(el=>{
                        if(element.id == "todas"){
                            $(el).show();
                        }
                       else if(el.id == element.id){
                        $(el).show();
                       }
                       else{
                        $(el).hide();
                       }
                    })
                });

            })

            $("#pesquisar-boomerangue").on('keyup', function(e){
                // Valor digitado no input
                var searchTerm =  e.target.value.toLowerCase();
                // Itera sobre as divs com a classe .item e verifica a semelhança com o termo de pesquisa
                    for(let i=0; i<nomes.length; i++) {
                    var text = nomes[i].innerText.toLowerCase();
                    var parentDiv = nomes[i].closest(".card-principal");
                    // Se a div contém a sequência de caracteres digitada, mostra a div, caso contrário, esconde
                    if (!text.includes(searchTerm)) {
                        $(parentDiv).hide()
                    } else {
                        $(parentDiv).show()
                    }
                };
            })

    
    }
    return {
        init: function() {
            navlinks = document.querySelectorAll('.nav-link');
            cards = document.querySelectorAll('.card-principal');
            nomes = document.querySelectorAll('#nome-boomerangue');
            init();
        }
    };
}()

lista.init()