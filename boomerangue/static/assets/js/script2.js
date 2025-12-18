var baseUrl = '';
const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
	// Extrai o valor do csrftoken do cookie
const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;
//função para converter para formato Moeda
Number.prototype.formatMoney = function (c, d, t) {
    var n = this,
        c = isNaN(c = Math.abs(c)) ? 2 : c,
        d = d == undefined ? "." : d,
        t = t == undefined ? "," : t,
        s = n < 0 ? "-" : "",
        i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

//chamando a função que retorna dinheiro
function currencyFormatted(value, str_cifrao) {
    return str_cifrao + ' ' + value.formatMoney(2, '.', ',');
}



//-----------------Subtrait quantidade através do botão  no layout web
function btnSubtrair(id,valUni){

    var valor = $('#produto_'+id).val();
    valor = parseFloat(valor);
    valor = valor - 1;

    if(valor < 0){
        valor = 0;
    }

    $('#produto_'+id).val(valor); //atualiza valor no input web
    $('#produto_mobile'+id).val(valor); //atualiza valor no input mobile

    somarTotalUnitario(id,valor,valUni);

    somarTotalDaCompra();
    $('#produto_'+id).focus();
    $('#produto_'+id).blur();

}

function btnSubtrairMobile(id,valUni){

    var valor = $('#produto_mobile'+id).val();
    valor = parseFloat(valor);
    valor = valor - 1;

    if(valor < 0){
        valor = 0;
    }

    $('#produto_mobile'+id).val(valor); //atualiza valor no input mobile

    somarTotalUnitario(id,valor,valUni);

    somarTotalDaCompra();
    $('#produto_mobile'+id).focus();
    $('#produto_mobile'+id).blur();

}


function btnSomar(id,valUni){

    //pegando valor atual
    var valor = $('#produto_'+id).val();
    //console.log("valor2: " + valor)

    //zerando valor atual
    var quantItens = $('.quantidadeItens');//Soma quantidade quando acessado na WEB

   /* var totalItens = 0;
    for (var i = 0; i < quantItens.length; i++) {
        var item = $(quantItens[i]);
        cont = parseInt(item.val());

        //console.log("ID: " + quantItens[i].id);

        //console.log("valor: " + $('#'+quantItens[i].id).val())

        var valor1 = $('#'+quantItens[i].id).val();
        valor1=0;
        // console.log("valor zerado: " + valor);

        $('#'+quantItens[i].id).val(valor1);
        $('#'+quantItens[i].id).focus();
        $('#'+quantItens[i].id).blur();
    }*/

    var quantItens2 = $('.quantidadeItens-mobile');//Soma quantidade quando acessado na WEB

   /* var totalItens2 = 0;
    for (var i2 = 0; i2 < quantItens2.length; i2++) {
        var item2 = $(quantItens2[i2]);
        cont2 = parseInt(item2.val());

        //console.log("valor: " + $('#'+quantItens[i2].id).val())

        var valor2 = $('#'+quantItens[i2].id).val();
        valor2=0;
        //console.log("valor zerado: " + valor);

        $('#'+quantItens2[i2].id).val(valor2);
        $('#'+quantItens2[i2].id).focus();
        $('#'+quantItens2[i2].id).blur();
    }*/



    valor = parseFloat(valor);
    valor = valor + 1;

	if(valor > 10){
        valor = 10;
    }

    //console.log("valor3: " + valor)

    //somar o valor unitario
    somarTotalUnitario(id,valor,valUni);

    $('#produto_'+id).val(valor);//atualiza valor no input WEB
    $('#produto_mobile'+id).val(valor); //atualiza valor no input mobile

    //somar o total da compra
    somarTotalDaCompra();
    //somarQuantidadeDeItem();
    $('#produto_'+id).focus();
    $('#produto_'+id).blur();

}

function btnSomarMobile(id,valUni){

    //pera valor atual
    var valor = $('#produto_'+id).val();
    valor = parseFloat(valor);
    valor = valor + 1;

	if(valor > 10){
        valor = 10;
    }

    //zera valores
    var quantItens = $('.quantidadeItens');//Soma quantidade quando acessado na WEB

    /*var totalItens = 0;
    for (var i = 0; i < quantItens.length; i++) {
        var item = $(quantItens[i]);
        cont = parseInt(item.val());

        // console.log("ID: " + quantItens[i].id);

        console.log("valor: " + $('#'+quantItens[i].id).val())

        var valor1 = $('#'+quantItens[i].id).val();
        valor1=0;
        // console.log("valor zerado: " + valor);

        $('#'+quantItens[i].id).val(valor1);
        $('#'+quantItens[i].id).focus();
        $('#'+quantItens[i].id).blur();
    }*/

    var quantItens2 = $('.quantidadeItens-mobile');//Soma quantidade quando acessado na WEB

    /*var totalItens2 = 0;
    for (var i2 = 0; i2 < quantItens2.length; i2++) {
        var item2 = $(quantItens2[i2]);
        cont2 = parseInt(item2.val());

        // console.log("valor: " + $('#'+quantItens[i].id).val())

        var valor2 = $('#'+quantItens2[i2].id).val();
        valor2=0;
        // console.log("valor zerado: " + valor);

        $('#'+quantItens2[i2].id).val(valor2);
        $('#'+quantItens2[i2].id).focus();
        $('#'+quantItens2[i2].id).blur();
    }*/



    //somar o valor unitario
    somarTotalUnitario(id,valor,valUni);

    $('#produto_'+id).val(valor);//atualiza valor no input WEB
    $('#produto_mobile'+id).val(valor); //atualiza valor no input mobile

    //somar o total da compra
    somarTotalDaCompra();
    //somarQuantidadeDeItem();
    $('#produto_'+id).focus();
    $('#produto_'+id).blur();

}



//atualizar o total unitario em cada campo
function somarTotalUnitario(id,val,preco){
    var somaTotalUni = val * preco;

    //somar o valor unitario
    somaTotalUni = currencyFormatted(somaTotalUni,'');

     $('#somaProduto_'+id).text(somaTotalUni); // atualiza total unitario na tela web
     $('#somaProduto_mobile'+id).text(somaTotalUni); // atualiza total unitario na tela mobile

     //somar o total da compra
     somarTotalDaCompra();

}


//somar o total da compra
function somarTotalDaCompra() {

    var itens = $('.totalUnitario');//somar total atraves do WEB
   // var itens = $('.totalUnitario-mobile');
    var total = 0;
    for (var i = 0; i < itens.length; i++) {
        var item = $(itens[i]);
    	var valor1=item.text().replace(",","");

        var valor = parseFloat(valor1);

        total = total + valor;
    }

    //chama a função que retorna o valor converttido em Real
    total = currencyFormatted(total,''); //pode ser passado o Cifrão
    $("#somaTotalProdutos").text(total);
    total = 0;
}


//somar quantidade de itens
function somarQuantidadeDeItem(){
    var quantItens = $('.quantidadeItens');//Soma quantidade quando acessado na WEB
    var quantItens = $('.quantidadeItens-mobile');//Soma quantidade quando acessado no mobile

    var totalItens = 0;
    for (var i = 0; i < quantItens.length; i++) {
        var item = $(quantItens[i]);
        cont = parseInt(item.val());

        totalItens = totalItens + cont;
    }
    console.log(totalItens);

    $("#totalItens").text(totalItens);
}


// quando input perder o foco executar essa função
function setInput(id, preco, idSoma, idElementoBanco) {

    // somar valor unitário
   // var quantidade = document.getElementById(id).value;
    var quantidade = $('#'+id).val();
    console.log(quantidade);
	var pegaid=idSoma.replace(/[^0-9]/g,'');

	var valor1=preco.replace(",","");

    var total = parseFloat(quantidade * parseFloat(valor1));
    if (total == '') {
        total = parseFloat(0);
    }
	if(total>0){
    	document.getElementById("cifrao_"+pegaid).style.opacity="1";
    	
    }
	else{
    	document.getElementById("cifrao_"+pegaid).style.opacity="0";
    }
    total = currencyFormatted(total,'');
   //inserir valor Total Unitario somas
    $('#'+idSoma).text(total);

    //somar quantidade de itens
    somarQuantidadeDeItem();

    //chamar a função que soma todos os totais
    somarTotalDaCompra();

 // parametros que são passados para o servidor
    var parametro = {
        QuantidadeCompradaUN: quantidade,
        ValorMultimplicadorCompra: preco,
        ValorTotalCompra: quantidade * preco
    }





//salva os dados no servidor
    $(document).ready(function () {
        console.log(parametro)
        fetch(`/pt/api/bmm_boomerangueitens_clientes/${idElementoBanco}/`,{
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
                },
            body:JSON.stringify(parametro)
        }).then((res)=>res.json())
		.then(data=>{
			console.log("RETORNO BMMITENS",data)
		})
    });




}

function getDataHoraAtual() {
    var agora = new Date();
    var ano = agora.getFullYear();
    var mes = ("0" + (agora.getMonth() + 1)).slice(-2);
    var dia = ("0" + agora.getDate()).slice(-2);
    var hora = ("0" + agora.getHours()).slice(-2);
    var minuto = ("0" + agora.getMinutes()).slice(-2);
    var segundo = ("0" + agora.getSeconds()).slice(-2);
    var milissegundo = ("00" + agora.getMilliseconds()).slice(-3);
    return ano + "-" + mes + "-" + dia + " " + hora + ":" + minuto + ":" + segundo + "." + milissegundo;
}

