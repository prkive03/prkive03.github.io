
let timer;
let timeLeft = 0;

function login(){

let username = document.getElementById("username").value;

localStorage.setItem("user", username);

window.location="menu.html";

}

function welcome(){

document.getElementById("welcome").innerHTML=
"Welcome "+localStorage.getItem("user");

}

/* THEME */

function changeTheme(){

let color = prompt("Enter color:");

document.body.style.background=color;

}

/* TIMER */

function setTimer(){

timeLeft = prompt("Enter seconds:");

startTimer();

}

function startTimer(){

timer=setInterval(()=>{

if(timeLeft<=0){

clearInterval(timer);

alert("Time's up!");

}

document.getElementById("timer").innerHTML=timeLeft;

timeLeft--;

},1000);

}

function stopTimer(){

clearInterval(timer);

}

function fun(){

alert("😂 Computer needs coffee ☕");

}