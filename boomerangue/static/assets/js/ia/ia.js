"use strict";
var ia = function(){
 
    var chatOutput
    var input;
    var init = function(){

        
        input.addEventListener("keyup", function(event) {
            event.preventDefault();
            if(event.keyCode==13){
                fetch('ia',{
                    method: "POST",
                    credentials: 'include',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(input.value),
                  }).then((response) => response.json())
                  .then((data) => {
                    sendMessage(data);
                  })
            }
        })


        function sendMessage(data) {
            const messageText = input.value;
            if (messageText.trim() === "") {
                return;
            }
    
            const messageElement = document.createElement("div");
            messageElement.className = "message user-message";
            messageElement.textContent = "Você: " + messageText;
            chatOutput.appendChild(messageElement);
    
            input.value = "";
            input.focus();
    
            // Simulação de resposta do chatbot (você pode substituir isso pela lógica real)
            
            const chatbotMessageElement = document.createElement("div");
            chatbotMessageElement.className = "message chatbot-message";
            chatbotMessageElement.textContent = "BOT: "+data.chatbot_response;
            chatOutput.appendChild(chatbotMessageElement);
            chatOutput.scrollTop = chatOutput.scrollHeight;
        }
    
    }
    return {
        init: function() {
            chatOutput = document.getElementById("chat-output")
            input = document.getElementById('ia_quest');
            console.log(input)
            init();
        }
    };
}()

ia.init()