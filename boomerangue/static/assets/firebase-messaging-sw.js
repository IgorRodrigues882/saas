importScripts("https://www.gstatic.com/firebasejs/9.14.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.14.0/firebase-messaging-compat.js");
var test=0;
var request = indexedDB.open('EXAMPLE_DB', 1);

request.onsuccess = function  (event) {
	var db=event.target.result
	var transaction = db.transaction('usuario', "readonly");
	var store = transaction.objectStore('usuario');
	var req = store.get('1');
	req.onsuccess = function (event) {
    	test=event.target.result.token;
	}
}


const Config = {
    apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
  };

var app=firebase.initializeApp(Config);

var messaging=firebase.messaging();
	messaging.onBackgroundMessage(payload => {
  		console.log('[firebase-messaging-sw.js] Received background message ', payload);
  		var dataFromServer = payload.data;
  		var notificationTitle = dataFromServer.title
        setTimeout(()=>{
  		var notificationOptions = {
        	body: dataFromServer.body,
        	image: dataFromServer.image,
        	icon: dataFromServer.icon,
        	badge:dataFromServer.badge,
        	data: {
            	url:"/oferta/"+test
        	}
    	};
    	return self.registration.showNotification(notificationTitle,
        notificationOptions);
        },1000);
	});


self.addEventListener('notificationclick', function (event) {
    console.log("notificationclick", event)
    var urlToRedirect = event.notification.data.url;
    event.notification.close();
    event.waitUntil(self.clients.openWindow(urlToRedirect));
});
