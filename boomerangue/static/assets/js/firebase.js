 import { initializeApp} from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
 import { getMessaging, getToken} from "https://www.gstatic.com/firebasejs/9.14.0/firebase-messaging.js";
  // import { getAuth,createUserWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/9.14.0/firebase-auth.js";

  // https://firebase.google.com/docs/web/setup#available-libraries
  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional

  
  const Config = {
  apiKey: "",
  authDomain: "boomerangue-app.firebaseapp.com",
  projectId: "boomerangue-app",
  storageBucket: "boomerangue-app.appspot.com",
  messagingSenderId: "750961842823",
  appId: "1:750961842823:web:053262c9393ae34caef622",
  measurementId: "G-RNQWLZ1MLX"
  };
	const app=initializeApp(Config);
	// const auth=getAuth(app);
	const messaging=getMessaging();
  const service =  await navigator.serviceWorker.register('../firebase-messaging-sw.js')


getToken(messaging, {serviceWorkerRegistration: service, vapidKey:'' }).then((currentToken) => {
  if (currentToken) {
  		console.log('Token:',currentToken);
    	enviaToken(currentToken);
  		cadastroTopic(currentToken);
  		if (document.cookie.indexOf("acceptNotification") < 0) {
   			document.cookie = "acceptNotification=True; expires=" + (new Date(Date.now() + 60000*24*24*1000)).toUTCString() + ";path=/";
        	instaled(ins='IGOO',currentToken);
    	}
    
  } else {
    // Show permission request UI
    console.log('No registration token available. Request permission to generate one.');
    // ...
  }
}).catch((err) => {
  console.log('An error occurred while retrieving token. ', err);
  
 });
 	// createUserWithEmailAndPassword(auth, tokenUser+"@mepluga.com", "123456")
 	// .then((userCredential) => {
 	// const user = userCredential.user;
 	// // ...
 	// })
 	// .catch((error) => {
 	// const errorCode = error.code;
 	// const errorMessage = error.message;
 	// // ..
 	// });

if(window.indexedDB){
    console.log('IndexedDB is supported');
}

var request = window.indexedDB.open('EXAMPLE_DB', 1);
var db;
request.onsuccess = function(event) {
    console.log('[onsuccess]',request.result);
    db = event.target.result; // === request.result
};
request.onerror = function(event) {
    console.log('[onerror]', request.error);
};

request.onupgradeneeded = function(event) {
    var db = event.target.result;
    var store = db.createObjectStore('usuario', {keyPath: 'id'});
	store.add({id: '1', token: tokenUser});
    // Armazenando valores no novo objectStore.
};
