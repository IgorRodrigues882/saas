var cont=0
function checado(){
   
    if(!document.getElementById("btMenu").checked){
        document.getElementById("ola").style.transform="translateX("+7+"%"+")"
        cont=1
    }
    else{
        if(document.getElementById("btMenu").checked){
        document.getElementById("ola").style.transform="translateX("+107+"%"+")"
        cont=0  
        }
    }
}
// função para fechar menu mobile ao clicar em qualquer area do documento.
function fechar(){
    if(cont==1){
        document.getElementById("ola").style.transform="translateX("+107+"%"+")"
        cont=0;
        document.getElementById("btMenu").checked=false;
    }
}
function getBrowserPrefix() {
 
  // Checa pela propriedade de forma não prefixada
  if ('hidden' in document) {
    return null;
  }
 
  // Todos os prefixos disponíveis.
  var browserPrefixes = ['moz', 'ms', 'o', 'webkit'];
 
  for (var i = 0; i < browserPrefixes.length; i++) {
    var prefix = browserPrefixes[i] + 'Hidden';
    if (prefix in document) {
      return browserPrefixes[i];
    }
  }
 
  // A API não é suportada pelo navegador.
  return null;
}
 
// Obtém a forma correta de "hidden" para o navegador em questão
function hiddenProperty(prefix) {
  if (prefix) {
    return prefix + 'Hidden';
  } else {
    return 'hidden';
  }
}
 
// Obtém a forma correta de "visibilityState" para o navegador em questão
function visibilityState(prefix) {
  if (prefix) {
    return prefix + 'VisibilityState';
  } else {
    return 'visibilityState';
  }
}
 
// Obtém o evento correto de "visbilityChange" para o navegador em questão
function visibilityEvent(prefix) {
  if (prefix) {
    return prefix + 'visibilitychange';
  } else {
    return 'visibilitychange';
  }
}
                            
var prefix = getBrowserPrefix();
var hidden = hiddenProperty(prefix);
var visibilityState = visibilityState(prefix);
var visibilityEvent = visibilityEvent(prefix);

                            
