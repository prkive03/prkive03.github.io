function login(){
let user=document.getElementById("username").value;
if(user!=""){
document.getElementById("welcomeText").innerText="Welcome, "+user+" 🌸";
showPage("menu");
}
}

function showPage(id){
document.getElementById(current).classList.remove("active");
document.getElementById(id).classList.add("active");
current=id;
}

function startTimer(){
timeLeft=document.getElementById("setTime").value;
paused=false;
timer=setInterval(()=>{
if(timeLeft>0 && !paused){
timeLeft--;
document.getElementById("timer").innerText="Time Left: "+timeLeft+"s";
}
},1000);
}

function pauseTimer(){paused=true;}
function resumeTimer(){paused=false;}

function research(){
let topic=document.getElementById("researchInput").value;
document.getElementById("researchResult").innerText=
topic+" is an important topic in Computer System Servicing related to networking or server configuration.";
}

function searchTopic(value){
console.log("Searching:",value);
}

function changeTheme(theme){
if(theme=="sunset"){
document.documentElement.style.setProperty('--sky','#ffcccb');
document.documentElement.style.setProperty('--grass','#ffe4b5');
}
if(theme=="forest"){
document.documentElement.style.setProperty('--sky','#c8e6c9');
document.documentElement.style.setProperty('--grass','#a5d6a7');
}
if(theme=="night"){
document.documentElement.style.setProperty('--sky','#1b263b');
document.documentElement.style.setProperty('--grass','#415a77');
document.documentElement.style.setProperty('--card','#ffffff22');
document.documentElement.style.setProperty('--text','#ffffff');
}
}
