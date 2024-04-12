let genButton = document.getElementById("generate");
let input = document.getElementById("input");

console.log("client / frontend! ")
let loadingIndicator = document.getElementById("loading");
loadingIndicator.style.display="none";

let fileInput = document.getElementById("file-input");
let currentImage = null
fileInput.addEventListener(
  "change",e=>{
    let file = e.target.files[0];
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = ()=>{
      let img = document.getElementById("result");
      img.src = reader.result;
      console.log(reader.result)
      currentImage = reader.result;
    }
  })

genButton.addEventListener("click", async () => {
  loadingIndicator.style.display="inline";

  const response = await fetch("/api/generateImage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({img: currentImage  }),
  });

  loadingIndicator.style.display="none";
  if (response.ok) {
    const data = await response.json();
    
    let uniqueItems = new Set();
    data.result.forEach(item => {
      uniqueItems.add(item.name);
    });
    
    let results = document.getElementById("results");
    let outputList = '<span>I can see...</span><ul>';
    uniqueItems.forEach( name => {
      outputList += `<li>${name}</li>`;
    })
    outputList += "</ul>";
    results.innerHTML = outputList;
    console.log(data);
    
  } else {
    console.error("Error generating image:", response.statusText);
    // Handle the error, e.g., display an error message to the user
  }
});
